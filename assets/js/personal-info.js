// Kişisel Bilgi Formu JavaScript

$(document).ready(function() {
    const $form = $('#personalInfoForm');
    const $tcNoInput = $('#tcNo');
    
    // Test için alanları doldur
    fillTestData();
    
    // TC Kimlik No sadece rakam girişi
    $tcNoInput.on('input', function() {
        $(this).val($(this).val().replace(/[^0-9]/g, ''));
    });
    
    // Form gönderimi
    $form.on('submit', async function(e) {
        e.preventDefault();
        
        // Önceki hata mesajlarını temizle
        hideError();
        
        // Form verilerini topla
        const formData = {
            firstName: $('#firstName').val(),
            lastName: $('#lastName').val(),
            tcNo: $('#tcNo').val(),
            gender: $('#gender').val(),
            age: parseInt($('#age').val()),
            institutionCode: $('#institutionCode').val(),
            institutionName: $('#institutionName').val(),
            profession: $('#profession').val(),
            education: $('#education').val(),
            maritalStatus: $('#maritalStatus').val(),
            created: new Date().toISOString()
        };
        
        // TC Kimlik No kontrolü
        if (formData.tcNo.length !== 11) {
            alert('TC Kimlik No 11 haneli olmalıdır.');
            return;
        }
        
        // Yaş kontrolü (MMPI için 16 yaş ve üzeri)
        if (formData.age < 16) {
            alert('MMPI testi 16 yaş ve üzeri bireyler için uygundur.');
            return;
        }
        
        // Önceki test kontrolü yap
        const hasCompletedTest = await checkPreviousTestForPersonalInfo(formData);
        if (hasCompletedTest) {
            return; // Test durduruldu
        }
        
        // Verileri localStorage'a kaydet
        localStorage.setItem('mmpiPersonalInfo', JSON.stringify(formData));
        
        // Supabase'e katılımcı bilgilerini kaydet (eğer yapılandırılmışsa)
        saveParticipantToSupabase(formData).then(() => {
            // KVKK onay sayfasına yönlendir
            window.location.href = 'kvkk-consent.html';
        }).catch(error => {
            console.error('Katılımcı bilgileri kaydedilemedi:', error);
            
            // Kullanıcıya hata mesajı göster
            const errorMessage = error.message || 'Veritabanı bağlantısında sorun yaşanıyor.';
            showError(errorMessage);
            
            // Hata durumunda yönlendirme yapma
            return;
        });
    });
});

// Katılımcı bilgilerini Supabase'e kaydet
async function saveParticipantToSupabase(participantData) {
    // Supabase bağlantısı kontrolü
    if (typeof supabase === 'undefined' || !supabase) {
        console.log('Supabase bağlantısı mevcut değil, sadece localStorage kullanılıyor.');
        throw new Error('Veritabanı bağlantısı kurulamadı');
    }
    
    try {
        // Önce aynı TC No ile kayıt var mı kontrol et
        const { data: existingParticipant, error: checkError } = await supabase
            .from('participants')
            .select('id')
            .eq('tc_no', participantData.tcNo)
            .single();
        
        if (checkError && checkError.code !== 'PGRST116') {
            // PGRST116 = No rows found, bu normal
            throw checkError;
        }
        
        if (existingParticipant) {
            console.log('Bu TC No ile zaten kayıt mevcut.');
            return existingParticipant;
        }
        
        console.log('Gender değeri:', participantData.gender);
        
        // Yeni katılımcı kaydet
        const { data, error } = await supabase
            .from('participants')
            .insert([{
                first_name: participantData.firstName,
                last_name: participantData.lastName,
                tc_no: participantData.tcNo,
                gender: participantData.gender,
                age: participantData.age,
                institution_code: participantData.institutionCode,
                institution_name: participantData.institutionName,
                profession: participantData.profession,
                education: participantData.education,
                marital_status: participantData.maritalStatus,
                created: participantData.created
            }])
            .select();
        
        if (error) {
            throw error;
        }
        
        console.log('Katılımcı bilgileri Supabase\'e kaydedildi:', data);
        
        // Katılımcı ID'sini localStorage'a kaydet
        if (data && data.length > 0) {
            localStorage.setItem('mmpiParticipantId', data[0].id);
        }
        
        return data;
        
    } catch (error) {
        console.error('Supabase katılımcı kayıt hatası:', error);
        
        // Bağlantı hatası mesajını daha açıklayıcı hale getir
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
            throw new Error('İnternet bağlantısı sorunu nedeniyle veritabanına erişilemiyor');
        } else if (error.message.includes('Invalid API key') || error.message.includes('Unauthorized')) {
            throw new Error('Veritabanı yetkilendirme hatası');
        } else {
            throw new Error('Veritabanı kayıt hatası: ' + error.message);
        }
    }
}

// TC Kimlik No doğrulama fonksiyonu (opsiyonel)
function validateTCNo(tcNo) {
    if (tcNo.length !== 11) return false;
    
    const digits = tcNo.split('').map(Number);
    
    // İlk hane 0 olamaz
    if (digits[0] === 0) return false;
    
    // 10. hane kontrolü
    const sum1 = (digits[0] + digits[2] + digits[4] + digits[6] + digits[8]) * 7;
    const sum2 = digits[1] + digits[3] + digits[5] + digits[7];
    const check1 = (sum1 - sum2) % 10;
    
    if (check1 !== digits[9]) return false;
    
    // 11. hane kontrolü
    const sum3 = digits.slice(0, 10).reduce((a, b) => a + b, 0);
    const check2 = sum3 % 10;
    
    if (check2 !== digits[10]) return false;
    
    return true;
}

// Kişisel bilgi sayfasında önceki test kontrolü
async function checkPreviousTestForPersonalInfo(formData) {
    try {
        console.log('checkPreviousTestForPersonalInfo başladı');
        
        // Normalize edilmiş katılımcı bilgileri
        const normalizedInfo = {
            name: formData.firstName,
            surname: formData.lastName,
            tcNo: formData.tcNo // TC No'yu benzersiz kimlik olarak kullan
        };
        
        if (!normalizedInfo.name || !normalizedInfo.surname || !normalizedInfo.tcNo) {
            console.log('Katılımcı bilgileri eksik, test devam edebilir');
            return false;
        }
        
        // Supabase bağlantısı kontrolü
        if (typeof supabase === 'undefined' || !supabase) {
            console.log('Supabase bağlantısı mevcut değil, test devam edebilir');
            return false;
        }
        
        try {
            // TC No üzerinden katılımcıyı bul
            const { data: participantData, error: participantError } = await supabase
                .from('participants')
                .select('id')
                .eq('tc_no', normalizedInfo.tcNo)
                .limit(1);
            
            if (participantError) {
                console.error('Katılımcı kontrolü başarısız:', participantError);
                return false;
            }
            
            if (participantData && participantData.length > 0) {
                // Bu katılımcının tamamlanmış testi var mı kontrol et
                const { data, error } = await supabase
                    .from('test_results')
                    .select('id, created, status')
                    .eq('participant_id', participantData[0].id)
                    .eq('status', 'completed')
                    .order('created', { ascending: false })
                    .limit(1);
                
                if (error) {
                    console.error('Test sonuçları kontrolü başarısız:', error);
                    return false;
                }
                
                if (data && data.length > 0) {
                    console.log('Supabase\'de aynı kişinin testi bulundu:', data[0]);
                    showPreviousTestWarningForPersonalInfo(data[0]);
                    return true;
                }
            }
        } catch (supabaseError) {
            console.error('Supabase bağlantı hatası:', supabaseError);
            return false;
        }
        
        console.log('Önceki test bulunamadı, test başlayabilir');
        return false;
        
    } catch (error) {
        console.error('Önceki test kontrolü hatası:', error);
        // Hata durumunda teste devam et
        return false;
    }
}

// Kişisel bilgi sayfasında önceki test uyarısı göster
function showPreviousTestWarningForPersonalInfo(previousTest) {
    const testDate = new Date(previousTest.created).toLocaleDateString('tr-TR');
    
    // Mevcut form container'ını bul ve içeriğini değiştir
    const formContainer = document.querySelector('.card');
    if (formContainer) {
        formContainer.innerHTML = `
            <div class="text-center">
                <div class="mb-4">
                    <i class="fas fa-exclamation-triangle text-warning" style="font-size: 4rem;"></i>
                </div>
                <h3 class="text-warning mb-4">Test Daha Önce Tamamlanmış</h3>
                <div class="alert alert-warning">
                    <p class="mb-2"><strong>Bu kişisel bilgilerle daha önce test yapılmış ve tamamlanmış.</strong></p>
                    <p class="mb-0">Aynı kişi için tekrar test yapılamaz.</p>
                </div>
                <div class="mt-4">
                    <button class="btn btn-primary btn-lg" onclick="window.location.href='index.html'">
                        <i class="fas fa-home"></i> Ana Sayfaya Dön
                    </button>
                </div>
            </div>
        `;
    }
}

// Test için örnek verileri doldur
function fillTestData() {
    // Sadece localhost'ta ve alanlar boşsa test verileri doldur
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        if (!$('#firstName').val()) $('#firstName').val('Test');
        if (!$('#lastName').val()) $('#lastName').val('Kullanıcı');
        if (!$('#tcNo').val()) $('#tcNo').val('12345678921');
        if (!$('#gender').val()) $('#gender').val('male');
        if (!$('#age').val()) $('#age').val('16');
        if (!$('#institutionCode').val()) $('#institutionCode').val('TEST001');
        if (!$('#institutionName').val()) $('#institutionName').val('Test Kurumu');
        if (!$('#profession').val()) $('#profession').val('Öğrenci');
        if (!$('#education').val()) $('#education').val('Lise');
        if (!$('#maritalStatus').val()) $('#maritalStatus').val('Bekar');
    }
    // Canlı ortamda alanlar boş kalacak
}

// Hata mesajı göster
function showError(message) {
    const $errorDiv = $('#errorMessage');
    const $errorText = $('#errorText');
    
    if ($errorDiv.length && $errorText.length) {
        $errorText.text(message);
        $errorDiv.css('display', 'block');
        
        // Sayfanın en üstüne scroll yap
        $('html, body').animate({ scrollTop: 0 }, 300);
    }
}

// Hata mesajını gizle
function hideError() {
    const $errorDiv = $('#errorMessage');
    if ($errorDiv.length) {
        $errorDiv.css('display', 'none');
    }
}