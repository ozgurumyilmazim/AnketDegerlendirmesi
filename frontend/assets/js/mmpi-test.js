// MMPI Test Logic
// Test yönetimi ve soru navigasyonu

class MMPITest {
    constructor() {
        this.currentQuestionIndex = 0;
        this.answers = {};
        this.dontKnowCount = 0;
        this.maxDontKnow = testConfig?.maxDontKnowAnswers || 10;
        this.startTime = null;
        this.endTime = null;
        this.questions = [];
        this.isLoading = true;
        this.sessionCode = null;
        this.autoSaveTimer = null;

        // DOM elementleri (jQuery ile)
        this.$questionText = $('#questionText');
        this.$questionContainer = $('#questionContainer');
        this.$answerOptions = $('#answerOptions');
        this.$progressBar = $('#progressBar');
        this.$progressText = $('#progressText');
        this.$dontKnowCounter = $('#dontKnowCounter');
        this.$dontKnowCountElement = $('#dontKnowCount');
        this.$prevBtn = $('#prevBtn');
        this.$nextBtn = $('#nextBtn');
        this.$finishBtn = $('#finishBtn');
        this.$saveExitBtn = $('#saveExitBtn');
        this.$answerFeedbackOverlay = $('#answerFeedbackOverlay');
        this.$feedbackIcon = $('#feedbackIcon');
        this.$directionHintOverlay = $('#directionHintOverlay');
        this.isAdvancing = false;
        this.hintTimer = null;

        // Test başlat
        this.initializeTest();
        this.bindEvents();
    }

    // Soruları yükle
    async loadQuestions() {
        try {
            console.log('loadQuestions başladı');
            console.log('PG_API object:', typeof PG_API, PG_API);

            // PG_API kontrolü
            if (typeof PG_API === 'undefined' || !PG_API) {
                throw new Error('PG_API client bulunamadı. Lütfen sayfayı yenileyin.');
            }

            console.log('PG_API bağlantısı deneniyor...');

            // PG_API'den veri çek
            const { data, error } = await PG_API
                .from('questions')
                .select('id, question_number, question_text, category_id')
                .order('question_number', { ascending: true });

            console.log('PG_API yanıtı:', { data, error });

            if (error) {
                console.error('PG_API sorgu hatası:', error);
                throw new Error(`Veritabanı hatası: ${error.message}`);
            }

            if (!data || data.length === 0) {
                throw new Error('Veritabanında hiç soru bulunamadı.');
            }

            this.questions = data;
            console.log(`${data.length} soru başarıyla yüklendi.`);
            console.log('İlk soru:', data[0]);

        } catch (error) {
            console.error('Sorular yüklenirken hata:', error);
            throw error;
        }
    }

    // Loading göster
    showLoading(message = 'Yükleniyor...') {
        if (!this.$questionContainer.length) return;

        const $loadingDiv = $('<div>', {
            id: 'questionLoading',
            class: 'text-center p-4',
            html: `
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <div class="mt-2">${message}</div>
            `
        });

        this.$questionContainer.append($loadingDiv);

        // Butonları devre dışı bırak
        this.$prevBtn.prop('disabled', true);
        this.$nextBtn.prop('disabled', true);
        this.$finishBtn.prop('disabled', true);
    }

    // Loading gizle
    hideLoading() {
        this.isLoading = false;
        $('#questionLoading').remove();
    }

    // Loading hatası
    handleLoadingError(error) {
        this.hideLoading();

        if (!this.questionContainer) return;

        const errorDiv = document.createElement('div');
        errorDiv.className = 'alert alert-danger text-center';
        errorDiv.innerHTML = `
            <h5>Sorular Yüklenemedi</h5>
            <p>Test soruları yüklenirken bir hata oluştu:</p>
            <p><small>${error.message}</small></p>
            <button class="btn btn-primary" onclick="location.reload()">Tekrar Dene</button>
            <button class="btn btn-secondary ms-2" onclick="window.history.back()">Geri Dön</button>
        `;

        this.questionContainer.appendChild(errorDiv);
    }

    // Kişinin daha önce test yapıp yapmadığını kontrol et
    async checkPreviousTest() {
        try {
            console.log('checkPreviousTest başladı');

            // localStorage'dan katılımcı bilgilerini al
            const participantInfo = JSON.parse(localStorage.getItem('mmpiPersonalInfo') || '{}');
            console.log('Katılımcı bilgileri:', participantInfo);

            // Katılımcı bilgilerini uygun formata çevir
            const normalizedInfo = {
                name: participantInfo.firstName,
                surname: participantInfo.lastName,
                birthDate: participantInfo.tcNo // TC No'yu benzersiz kimlik olarak kullan
            };
            console.log('Normalize edilmiş bilgiler:', normalizedInfo);

            if (!normalizedInfo.name || !normalizedInfo.surname || !normalizedInfo.birthDate) {
                console.log('Katılımcı bilgileri eksik, test devam edebilir');
                return false;
            }

            // localStorage'da tamamlanmış test var mı kontrol et
            const completedTests = JSON.parse(localStorage.getItem('mmpiCompletedTests') || '[]');
            console.log('Tamamlanmış testler:', completedTests);

            const existingTest = completedTests.find(test =>
                test.name === normalizedInfo.name &&
                test.surname === normalizedInfo.surname &&
                test.birthDate === normalizedInfo.birthDate
            );

            if (existingTest) {
                console.log('localStorage\'da aynı kişinin testi bulundu:', existingTest);
                this.showPreviousTestWarning(existingTest);
                return true;
            }

            // PG_API kontrolü (eğer bağlantı varsa)
            if (typeof PG_API !== 'undefined' && PG_API) {
                try {
                    // participant_id üzerinden kontrol et (daha güvenilir)
                    const { data: participantData, error: participantError } = await PG_API
                        .from('participants')
                        .select('id')
                        .eq('first_name', normalizedInfo.name)
                        .eq('last_name', normalizedInfo.surname)
                        .eq('tc_no', normalizedInfo.birthDate)
                        .limit(1);

                    if (participantError) {
                        console.log('Katılımcı kontrolü başarısız, localStorage kontrolü yeterli');
                    } else if (participantData && participantData.length > 0) {
                        // Bu katılımcının tamamlanmış testi var mı kontrol et
                        // Minimal görünüm: sadece var mı diye kontrol edilir
                        const { data, error } = await PG_API
                            .from('test_results_min')
                            .select('id')
                            .eq('participant_id', participantData[0].id)
                            .eq('status', 'completed')
                            .limit(1);

                        if (error) {
                            console.log('PG_API kontrolü başarısız, localStorage kontrolü yeterli');
                        } else if (data && data.length > 0) {
                            console.log('PG_API\'de aynı kişinin testi bulundu (min görünüm):', data[0]);
                            this.showPreviousTestWarning();
                            return true;
                        }
                    }
                } catch (PostgreSQLError) {
                    console.log('PG_API bağlantı hatası, localStorage kontrolü yeterli');
                }
            }

            console.log('Önceki test bulunamadı, test başlayabilir');
            return false;

        } catch (error) {
            console.error('Önceki test kontrolü hatası:', error);
            // Hata durumunda teste devam et
            return false;
        }
    }

    // Daha önce test yapıldığına dair uyarı göster
    showPreviousTestWarning() {
        this.hideLoading();

        // Test container'ını gizle
        const testContainer = document.querySelector('.test-container');
        if (testContainer) {
            testContainer.style.display = 'none';
        }

        // Uyarı mesajı için container oluştur
        const warningContainer = document.createElement('div');
        warningContainer.className = 'container-fluid d-flex align-items-start justify-content-center';
        warningContainer.style.paddingTop = '50px';
        warningContainer.style.minHeight = '100vh';
        warningContainer.innerHTML = `
            <div class="container">
                <div class="card fade-in">
                    <div class="text-center">
                        <div class="mb-4">
                            <i class="fas fa-exclamation-triangle text-warning" style="font-size: 4rem;"></i>
                        </div>
                            <h3 class="text-warning mb-4">Test Daha Önce Tamamlanmış</h3>
                        <div class="alert alert-warning">
                            <p class="mb-2"><strong>Bu kişisel bilgilerle daha önce test yapılmış.</strong></p>
                            <p class="mb-0">Aynı kişi için tekrar test yapılamaz.</p>
                        </div>
                        <div class="mt-4">
                            <button class="btn btn-primary btn-lg" onclick="window.location.href='index.html'">
                                <i class="fas fa-home"></i> Ana Sayfaya Dön
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Sayfaya ekle
        document.body.appendChild(warningContainer);

        // Butonları devre dışı bırak
        if (this.$prevBtn) this.$prevBtn.prop('disabled', true);
        if (this.$nextBtn) this.$nextBtn.prop('disabled', true);
        if (this.$finishBtn) this.$finishBtn.prop('disabled', true);
    }

    async initializeTest() {
        console.log('initializeTest başladı');

        // Kaydedilmiş oturumdan devam etme kontrolü
        const isResume = this.loadSavedSession();

        if (!isResume) {
            // Önce kişinin daha önce test yapıp yapmadığını kontrol et
            const hasCompletedTest = await this.checkPreviousTest();
            if (hasCompletedTest) {
                return; // Test durduruldu
            }
        }

        // Test başlangıç zamanını kaydet
        if (!this.startTime) {
            this.startTime = new Date().toISOString();
            localStorage.setItem('mmpiTestStartTime', this.startTime);
        }

        // Bilmiyorum sayacını başlangıçta güncelle
        this.updateDontKnowCounter();

        // Loading göster
        this.showLoading('Sorular yükleniyor...');
        console.log('Loading gösterildi');

        try {
            // Soruları yükle
            await this.loadQuestions();
            console.log('Sorular yüklendi:', this.questions.length);

            if (this.questions.length === 0) {
                throw new Error('Hiçbir soru yüklenemedi.');
            }

            // Loading gizle
            this.hideLoading();

            // İlk soruyu göster (veya kaldığı yerden devam et)
            this.isLoading = false;
            this.displayQuestion();
            this.updateProgress();
            this.updateDontKnowCounter();

            // Otomatik kaydetme zamanlayıcısını başlat
            this.startAutoSave();

            console.log('Test başarıyla başlatıldı');
        } catch (error) {
            console.error('Sorular yüklenirken hata oluştu:', error);
            this.handleLoadingError(error);
        }

    }

    // Cevap görsel geri bildirimi (flash)
    showAnswerFeedback(value) {
        if (!this.$answerFeedbackOverlay.length) {
            this.$answerFeedbackOverlay = $('#answerFeedbackOverlay');
            this.$feedbackIcon = $('#feedbackIcon');
        }
        if (!this.$answerFeedbackOverlay.length) return;

        this.$answerFeedbackOverlay.removeClass('feedback-true feedback-false feedback-dontknow show');

        if (value === 'true') {
            this.$answerFeedbackOverlay.addClass('feedback-true show');
            this.$feedbackIcon.html('<i class="fas fa-check"></i> Doğru');
        } else if (value === 'false') {
            this.$answerFeedbackOverlay.addClass('feedback-false show');
            this.$feedbackIcon.html('<i class="fas fa-times"></i> Yanlış');
        } else if (value === 'dont_know') {
            this.$answerFeedbackOverlay.addClass('feedback-dontknow show');
            this.$feedbackIcon.html('<i class="fas fa-question"></i> Bilmiyorum');
        }

        setTimeout(() => {
            this.$answerFeedbackOverlay.removeClass('show');
        }, 160);
    }

    // Yönlendirme ipucu göster (oturumda ilk kez açıldığında)
    showDirectionHint() {
        if (sessionStorage.getItem('mmpi_hint_dismissed') === 'true') {
            if (this.$directionHintOverlay.length) {
                this.$directionHintOverlay.addClass('hidden').hide();
            }
            return;
        }

        if (this.$directionHintOverlay.length) {
            this.$directionHintOverlay.removeClass('hidden').show();
            if (this.hintTimer) clearTimeout(this.hintTimer);
            this.hintTimer = setTimeout(() => {
                this.dismissDirectionHint();
            }, 4000);
        }
    }

    // Yönlendirme ipucunu kapat
    dismissDirectionHint() {
        if (this.hintTimer) {
            clearTimeout(this.hintTimer);
            this.hintTimer = null;
        }
        if (this.$directionHintOverlay.length) {
            this.$directionHintOverlay.addClass('hidden');
            setTimeout(() => {
                this.$directionHintOverlay.hide();
            }, 350);
        }
        sessionStorage.setItem('mmpi_hint_dismissed', 'true');
    }

    // Hızlı cevap verme (fare, kaydırma, klavye ve radio tıklamalarında çağrılır)
    submitAnswer(value) {
        if (this.isLoading || this.questions.length === 0 || this.isAdvancing) return;

        // Bilmiyorum sınırı kontrolü
        if (value === 'dont_know') {
            const currentQuestion = this.questions[this.currentQuestionIndex];
            const currentAnswer = this.answers[currentQuestion?.question_number];
            if (this.dontKnowCount >= this.maxDontKnow && currentAnswer !== 'Bilmiyorum') {
                this.showWarning(`En fazla ${this.maxDontKnow} adet "Bilmiyorum" cevabı verebilirsiniz.`);
                return;
            }
        }

        this.dismissDirectionHint();

        // Radio butonunu işaretle
        $(`input[name="answer"][value="${value}"]`).prop('checked', true);

        // Cevabı kaydet ve UI'ı güncelle
        this.handleAnswerChange();

        // Görsel geri bildirim göster (flash)
        this.showAnswerFeedback(value);

        // Son soru değilse 200 ms sonra otomatik bir sonraki soruya geç
        if (this.currentQuestionIndex < this.questions.length - 1) {
            this.isAdvancing = true;
            setTimeout(() => {
                this.nextQuestion();
                this.isAdvancing = false;
            }, 200);
        }
    }

    bindEvents() {
        console.log('bindEvents çağrıldı');

        // Cevap seçenekleri (Radio buton doğrudan tıklandığında)
        $('input[name="answer"]').on('change', () => {
            const selectedValue = $('input[name="answer"]:checked').val();
            if (selectedValue) {
                this.submitAnswer(selectedValue);
            }
        });

        // Navigasyon butonları
        this.$prevBtn.on('click', (e) => {
            e.stopPropagation();
            this.previousQuestion();
        });

        this.$nextBtn.on('click', (e) => {
            e.stopPropagation();
            this.nextQuestion();
        });

        this.$finishBtn.on('click', (e) => {
            e.stopPropagation();
            this.finishTest();
        });

        this.$saveExitBtn.on('click', (e) => {
            e.stopPropagation();
            this.saveAndExit();
        });

        // ── Klavye kısayolları ──
        document.addEventListener('keydown', (e) => {
            // Eğer bir modal veya input içindeyse klavye kısayollarını çalıştırma
            if ($(e.target).is('input, textarea, select')) return;

            if (e.key === 'ArrowLeft' && this.$prevBtn && !this.$prevBtn.prop('disabled')) {
                this.previousQuestion();
            } else if (e.key === 'ArrowRight' && this.$nextBtn && !this.$nextBtn.prop('disabled')) {
                this.nextQuestion();
            } else if (e.key === '1' || e.key === 'D' || e.key === 'd') {
                this.submitAnswer('true');
            } else if (e.key === '2' || e.key === 'Y' || e.key === 'y') {
                this.submitAnswer('false');
            } else if (e.key === '3' || e.key === 'B' || e.key === 'b') {
                this.submitAnswer('dont_know');
            }
        });

        // ── Masaüstü Fare Tıklama İşleyicisi (.question-container üzerinde) ──
        // Sol tık -> Doğru, Sağ tık -> Yanlış, Orta tık -> Bilmiyorum
        this.$questionContainer.on('mousedown', (e) => {
            // Eğer bir buton, link veya form elemanına tıklandıysa özel mousedown'u çalıştırma
            if ($(e.target).closest('button, a, input, select, .modal').length) return;

            if (this.isLoading || this.questions.length === 0) return;

            if (e.button === 0) {
                // Sol tık -> Doğru
                this.submitAnswer('true');
            } else if (e.button === 2) {
                // Sağ tık -> Yanlış
                e.preventDefault();
                this.submitAnswer('false');
            } else if (e.button === 1) {
                // Orta tık -> Bilmiyorum
                e.preventDefault();
                this.submitAnswer('dont_know');
            }
        });

        // Sağ tık bağlam menüsünü soru konteynerinde engelle
        this.$questionContainer.on('contextmenu', (e) => {
            e.preventDefault();
        });

        // ── Mobil Dokunmatik Kaydırma (Swipe) İşleyicisi ──
        // Sağa kaydır -> Doğru, Sola kaydır -> Yanlış, Aşağı kaydır -> Bilmiyorum
        let touchStartX = null;
        let touchStartY = null;

        this.$questionContainer.on('touchstart', (e) => {
            const touch = e.originalEvent.touches[0];
            touchStartX = touch.clientX;
            touchStartY = touch.clientY;
        });

        this.$questionContainer.on('touchend', (e) => {
            if (touchStartX === null || touchStartY === null) return;
            const touch = e.originalEvent.changedTouches[0];
            const deltaX = touch.clientX - touchStartX;
            const deltaY = touch.clientY - touchStartY;
            const absX = Math.abs(deltaX);
            const absY = Math.abs(deltaY);
            const threshold = 40; // Minimum kaydırma mesafesi piksel olarak

            if (absX > threshold && absX > absY) {
                // Yatay kaydırma
                if (deltaX > threshold) {
                    // Sağa kaydırma -> Doğru
                    this.submitAnswer('true');
                } else if (deltaX < -threshold) {
                    // Sola kaydırma -> Yanlış
                    this.submitAnswer('false');
                }
            } else if (deltaY > threshold && absY > absX) {
                // Dikey aşağı kaydırma -> Bilmiyorum
                this.submitAnswer('dont_know');
            }

            touchStartX = null;
            touchStartY = null;
        });
    }

    displayQuestion(slideDirection = 'right') {
        console.log('displayQuestion çağrıldı');
        console.log('isLoading:', this.isLoading);
        console.log('questions.length:', this.questions.length);

        if (this.isLoading || this.questions.length === 0) {
            console.log('Sorular yüklenemedi veya yükleniyor');
            return;
        }

        const question = this.questions[this.currentQuestionIndex];
        console.log('Gösterilecek soru:', question);

        if (!question) {
            console.error('Soru bulunamadı:', this.currentQuestionIndex);
            return;
        }

        // Soru metnini göster
        this.$questionText.text(`${question.question_number}. ${question.question_text}`);
        console.log('Soru metni ayarlandı:', this.$questionText.text());

        // Önceki cevabı yükle (question_number bazlı, değer: Doğru/Yanlış/Bilmiyorum)
        const previousAnswerDisplay = this.answers[question.question_number];
        const previousAnswerValue = this.mapDisplayToValue(previousAnswerDisplay);
        $('input[name="answer"]').each(function () {
            $(this).prop('checked', $(this).val() === previousAnswerValue);
        });

        // Bilmiyorum seçeneğini kontrol et
        this.updateDontKnowOption();

        // Buton durumlarını güncelle
        this.updateButtons();

        // Yönlendirme ipucunu göster (ilk soruda gösterilir)
        if (this.currentQuestionIndex === 0) {
            this.showDirectionHint();
        }

        // Animasyon ekle
        if (this.$questionContainer.length) {
            this.$questionContainer.removeClass('slide-in-right slide-in-left fade-in');
            const animClass = slideDirection === 'left' ? 'slide-in-left' : 'slide-in-right';
            setTimeout(() => {
                this.$questionContainer.addClass(animClass);
            }, 10);
        } else {
            console.error('questionContainer elementi bulunamadı');
        }
    }

    handleAnswerChange() {
        const selectedAnswer = $('input[name="answer"]:checked');
        if (selectedAnswer.length === 0) return;

        const currentQuestion = this.questions[this.currentQuestionIndex];
        const questionKey = currentQuestion.question_number; // Her zaman question_number kullan
        const selectedValue = selectedAnswer.val(); // 'true' | 'false' | 'dont_know'
        const newAnswerDisplay = this.mapValueToDisplay(selectedValue); // 'Doğru' | 'Yanlış' | 'Bilmiyorum'
        const oldAnswerDisplay = this.answers[questionKey];

        // Bilmiyorum sayısını güncelle
        if (oldAnswerDisplay === 'Bilmiyorum' && newAnswerDisplay !== 'Bilmiyorum') {
            this.dontKnowCount--;
        } else if (oldAnswerDisplay !== 'Bilmiyorum' && newAnswerDisplay === 'Bilmiyorum') {
            this.dontKnowCount++;
        }

        // Cevabı kaydet
        this.answers[questionKey] = newAnswerDisplay;

        // UI'ı güncelle
        this.updateDontKnowCounter();
        this.updateDontKnowOption();
        this.updateButtons();
        this.hideWarning();

        // Cevapları localStorage'a kaydet
        this.saveProgress();
    }

    updateDontKnowOption() {
        const $dontKnowRadio = $('#answerDontKnow');
        const $dontKnowLabel = $('label[for="answerDontKnow"]');

        if ($dontKnowRadio.length && $dontKnowLabel.length) {
            if (this.dontKnowCount >= this.maxDontKnow && !$dontKnowRadio.prop('checked')) {
                $dontKnowRadio.prop('disabled', true);
                $dontKnowLabel.css('opacity', '0.5');
                $dontKnowLabel.css('cursor', 'not-allowed');
            } else {
                $dontKnowRadio.prop('disabled', false);
                $dontKnowLabel.css('opacity', '1');
                $dontKnowLabel.css('cursor', 'pointer');
            }
        }
    }

    updateDontKnowCounter() {
        const remaining = this.maxDontKnow - this.dontKnowCount;
        if (this.$dontKnowCountElement) {
            this.$dontKnowCountElement.text(remaining);
        }

        if (this.$dontKnowCounter) {
            if (remaining <= 2) {
                this.$dontKnowCounter.removeClass().addClass('alert alert-warning');
            } else if (remaining === 0) {
                this.$dontKnowCounter.removeClass().addClass('alert alert-danger');
            } else {
                this.$dontKnowCounter.removeClass().addClass('alert alert-info');
            }
        }
    }

    updateProgress() {
        if (this.questions.length === 0) return;

        const progress = ((this.currentQuestionIndex + 1) / this.questions.length) * 100;

        if (this.$progressBar) {
            this.$progressBar.css('width', progress + '%');
        }
        if (this.$progressText) {
            this.$progressText.text(`${this.currentQuestionIndex + 1} / ${this.questions.length}`);
            // İlerleme çubuğunun genişliğini ayarla
            this.$progressBar.css('minWidth', '120px');
        }
    }

    updateButtons() {
        // Önceki buton
        this.$prevBtn.prop('disabled', this.currentQuestionIndex === 0);

        // Sonraki/Bitir buton
        const hasAnswer = $('input[name="answer"]:checked').length > 0;

        if (this.currentQuestionIndex === this.questions.length - 1) {
            // Son soru
            this.$nextBtn.hide();
            this.$finishBtn.show();
            this.$finishBtn.prop('disabled', !hasAnswer);
        } else {
            // Diğer sorular
            this.$nextBtn.show();
            this.$nextBtn.prop('disabled', !hasAnswer);
            this.$finishBtn.hide();
        }
    }

    previousQuestion() {
        if (this.currentQuestionIndex > 0) {
            this.currentQuestionIndex--;
            this.displayQuestion('left');
            this.updateProgress();
        }
    }

    nextQuestion() {
        const hasAnswer = $('input[name="answer"]:checked').length > 0;
        if (!hasAnswer) {
            this.showWarning('Lütfen bir cevap seçin.');
            return;
        }

        if (this.currentQuestionIndex < this.questions.length - 1) {
            this.currentQuestionIndex++;
            this.displayQuestion('right');
            this.updateProgress();
        }
    }

    finishTest() {
        const hasAnswer = $('input[name="answer"]:checked').length > 0;
        if (!hasAnswer) {
            this.showWarning('Lütfen son soruyu da cevaplayın.');
            return;
        }

        // Tüm soruların cevaplanıp cevaplanmadığını kontrol et
        const unansweredQuestions = [];
        this.questions.forEach(question => {
            const questionKey = question.question_number;
            if (this.answers[questionKey] === undefined) {
                unansweredQuestions.push(questionKey);
            }
        });

        if (unansweredQuestions.length > 0) {
            const confirmFinish = confirm(
                `${unansweredQuestions.length} soru cevaplanmamış. ` +
                'Testi yine de tamamlamak istiyor musunuz?'
            );
            if (!confirmFinish) {
                return;
            }
        }

        // Test bitiş zamanını kaydet
        this.endTime = new Date().toISOString();
        localStorage.setItem('mmpiTestEndTime', this.endTime);

        // beforeunload event listener'ını kaldır
        this.removeBeforeUnloadListener();

        // Oturum bilgilerini temizle (test tamamlandı)
        localStorage.removeItem('mmpiSessionCode');
        localStorage.removeItem('mmpiTestProgress');

        // Loading modal göster
        const $loadingModal = $('#loadingModal');
        if ($loadingModal.length && typeof bootstrap !== 'undefined') {
            const modal = new bootstrap.Modal($loadingModal[0]);
            modal.show();
        }

        // Test sonuçlarını kaydet
        this.saveTestResults().then(() => {
            // Tamamlama sayfasına yönlendir
            setTimeout(() => {
                window.location.href = 'test-complete.html';
            }, 2000);
        }).catch(error => {
            console.error('Test sonuçları kaydedilemedi:', error);
            if ($loadingModal.length && typeof bootstrap !== 'undefined') {
                const modal = bootstrap.Modal.getInstance($loadingModal[0]);
                if (modal) modal.hide();
            }
            this.showWarning('Test sonuçları kaydedilirken bir hata oluştu. Lütfen tekrar deneyin.');
        });
    }

    loadSavedSession() {
        const savedProgress = localStorage.getItem('mmpiTestProgress');
        const sessionCode = localStorage.getItem('mmpiSessionCode');

        if (!savedProgress || !sessionCode) {
            return false;
        }

        try {
            const progress = JSON.parse(savedProgress);
            if (progress.answers && Object.keys(progress.answers).length > 0) {
                this.currentQuestionIndex = progress.currentQuestionIndex || 0;
                this.answers = progress.answers || {};
                this.dontKnowCount = progress.dontKnowCount || 0;
                this.startTime = progress.startTime || new Date().toISOString();
                this.sessionCode = sessionCode;
                console.log('Kaydedilmiş oturum yüklendi:', sessionCode);
                return true;
            }
        } catch (e) {
            console.error('Kaydedilmiş oturum yüklenirken hata:', e);
        }

        return false;
    }

    generateSessionCode() {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let code = '';
        for (let i = 0; i < 11; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    }

    async saveToDb(isComplete = false) {
        if (typeof PG_API === 'undefined' || !PG_API) {
            console.warn('PG_API mevcut değil, sadece localStorage kaydedildi.');
            return;
        }

        try {
            const personalInfo = JSON.parse(localStorage.getItem('mmpiPersonalInfo') || '{}');
            let participantId = localStorage.getItem('mmpiParticipantId');

            if (!participantId && personalInfo.tcNo) {
                const { data: participants, error: pErr } = await PG_API
                    .from('participants')
                    .select('id')
                    .eq('tc_no', personalInfo.tcNo)
                    .limit(1);
                if (!pErr && participants && participants.length > 0) {
                    participantId = participants[0].id;
                    localStorage.setItem('mmpiParticipantId', participantId);
                }
            }

            if (!participantId) {
                console.warn('Katılımcı ID bulunamadı, DB kaydı atlandı.');
                return;
            }

            const status = isComplete ? 'completed' : 'in_progress';

            // Mevcut test kaydını bul
            const { data: existingTests, error: searchErr } = await PG_API
                .from('test_results')
                .select('id, session_code')
                .eq('participant_id', participantId)
                .in('status', ['started', 'in_progress'])
                .order('created', { ascending: false })
                .limit(1);

            if (searchErr) {
                console.error('Mevcut test sorgu hatası:', searchErr);
                return;
            }

            const testData = {
                test_answers: this.answers,
                start_time: this.startTime,
                dont_know_count: this.dontKnowCount,
                completed_questions: Object.keys(this.answers).length,
                total_questions: this.questions.length || 567,
                status: status,
                current_index: this.currentQuestionIndex
            };

            if (isComplete) {
                testData.end_time = new Date().toISOString();
            }

            if (existingTests && existingTests.length > 0) {
                const existing = existingTests[0];
                testData.session_code = existing.session_code || this.sessionCode;
                await PG_API
                    .from('test_results')
                    .eq('id', existing.id)
                    .update(testData);
                console.log('Test kaydı güncellendi:', existing.id);
            } else {
                testData.session_code = this.sessionCode;
                testData.participant_id = participantId;
                testData.test_type = 'MMPI';
                testData.test_version = '1.0';
                const { data: insertResult, error: insertErr } = await PG_API
                    .from('test_results')
                    .insert([testData])
                    .select();
                if (insertErr) {
                    console.error('Test kaydı ekleme hatası:', insertErr);
                } else {
                    console.log('Test kaydı oluşturuldu:', insertResult);
                }
            }
        } catch (e) {
            console.error('DB kaydetme hatası:', e);
        }
    }

    async saveAndExit() {
        if (this.isLoading) return;

        // Son cevabı kaydet
        this.handleAnswerChange();

        // Oturum kodu oluştur
        this.sessionCode = this.generateSessionCode();
        localStorage.setItem('mmpiSessionCode', this.sessionCode);

        // İlerlemeyi localStorage'a kaydet
        this.saveProgress();

        // Veritabanına kaydet
        await this.saveToDb(false);

        // Otomatik kaydetme zamanlayıcısını durdur
        this.stopAutoSave();

        // beforeunload olayını kaldır
        this.removeBeforeUnloadListener();

        // Oturum kodunu göster
        $('#sessionCodeDisplay').text(this.sessionCode);
        const modal = new bootstrap.Modal($('#sessionCodeModal')[0]);
        modal.show();
    }

    // Timer handling
    startTimer() {
        if (!this.startTime) return;
        const maxDurationMs = (testConfig.maxDuration || 120) * 60 * 1000; // default 120 mins
        const update = () => {
            const now = new Date();
const elapsedMs = now - new Date(this.startTime);
const elapsedMin = Math.floor(elapsedMs / 60000);
const remainingMs = Math.max(maxDurationMs - elapsedMs, 0);
const remainingMin = Math.floor(remainingMs / 60000);
$('#timerContainer').text(`Geçen Süre: ${elapsedMin} dakika | Kalan Süre: ${remainingMin} dakika`);
if (remainingMs <= 0) {
    this.finishTest();
}

        };
        update(); // initial display
        this.timerInterval = setInterval(update, 1000);
    }
    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    startAutoSave() {
        const interval = testConfig?.autoSaveInterval || 30000;
        if (this.autoSaveTimer) {
            clearInterval(this.autoSaveTimer);
        }
        this.autoSaveTimer = setInterval(() => {
            if (this.sessionCode) {
                this.saveProgress();
                this.saveToDb(false);
            } else {
                this.saveProgress();
            }
        }, interval);
        console.log('Otomatik kaydetme başlatıldı:', interval, 'ms');
        this.startTimer();
    }

    stopAutoSave() {
        if (this.autoSaveTimer) {
            clearInterval(this.autoSaveTimer);
            this.autoSaveTimer = null;
            console.log('Otomatik kaydetme durduruldu');
        }
    }

    saveProgress() {
        const progress = {
            currentQuestionIndex: this.currentQuestionIndex,
            answers: this.answers,
            dontKnowCount: this.dontKnowCount,
            startTime: this.startTime,
            lastSaved: new Date().toISOString()
        };

        localStorage.setItem('mmpiTestProgress', JSON.stringify(progress));
    }

    async saveTestResults() {
        // Kişisel bilgileri al
        const personalInfo = JSON.parse(localStorage.getItem('mmpiPersonalInfo') || '{}');

        // Normalize edilmiş katılımcı bilgileri
        const normalizedInfo = {
            name: personalInfo.firstName,
            surname: personalInfo.lastName,
            birthDate: personalInfo.tcNo
        };

        const testResults = {
            testType: 'MMPI',
            version: '1.0',
            answers: this.answers,
            dontKnowCount: this.dontKnowCount,
            startTime: this.startTime,
            endTime: this.endTime,
            createdAt: new Date().toISOString()
        };

        // localStorage'a kaydet
        localStorage.setItem('mmpiTestResults', JSON.stringify(testResults));

        // Tamamlanmış test bilgisini localStorage'a kaydet (tekrar test kontrolü için)
        if (normalizedInfo.name && normalizedInfo.surname && normalizedInfo.birthDate) {
            const completedTests = JSON.parse(localStorage.getItem('mmpiCompletedTests') || '[]');
            const completedTest = {
                name: normalizedInfo.name,
                surname: normalizedInfo.surname,
                birthDate: normalizedInfo.birthDate,
                created: new Date().toISOString(),
                status: 'completed'
            };

            // Aynı kişinin testi zaten varsa güncelle, yoksa ekle
            const existingIndex = completedTests.findIndex(test =>
                test.name === normalizedInfo.name &&
                test.surname === normalizedInfo.surname &&
                test.birthDate === normalizedInfo.birthDate
            );

            if (existingIndex >= 0) {
                completedTests[existingIndex] = completedTest;
            } else {
                completedTests.push(completedTest);
            }

            localStorage.setItem('mmpiCompletedTests', JSON.stringify(completedTests));
            console.log('Tamamlanmış test bilgisi localStorage\'a kaydedildi:', completedTest);
        }

        // PG_API'e kaydet (eğer yapılandırılmışsa)
        console.log('PG_API bağlantısı kontrol ediliyor...');
        console.log('typeof PG_API:', typeof PG_API);
        console.log('PG_API object:', PG_API);

        if (typeof PG_API !== 'undefined' && PG_API) {
            try {
                console.log('PG_API bağlantısı mevcut, test sonuçları kaydediliyor...');
                console.log('Kişisel bilgiler:', personalInfo);

                // Önce localStorage'dan participant_id'yi kontrol et
                let participantId = localStorage.getItem('mmpiParticipantId');
                console.log('localStorage\'dan alınan participant_id:', participantId);

                if (!participantId) {
                    console.log('Gender değeri:', personalInfo.gender);

                    // Eğer participant_id yoksa, katılımcıyı participants tablosuna kaydet
                    // Cinsiyet değerini veritabanı formatına çevir (male/female → erkek/kadin)
                    const genderMap = { 'male': 'erkek', 'female': 'kadin', 'other': 'other' };
                    const dbGender = genderMap[personalInfo.gender] || personalInfo.gender;
                    const participantData = {
                        first_name: personalInfo.firstName,
                        last_name: personalInfo.lastName,
                        tc_no: personalInfo.tcNo,
                        gender: dbGender,
                        age: personalInfo.age,
                        institution_code: personalInfo.institutionCode,
                        profession: personalInfo.profession,
                        education: personalInfo.education,
                        marital_status: personalInfo.maritalStatus
                    };

                    console.log('Katılımcı verisi hazırlandı:', participantData);

                    const { data: participantResult, error: participantError } = await PG_API
                        .from('participants')
                        .insert([participantData])
                        .select()
                        .single();

                    if (participantError) {
                        console.error('Katılımcı kayıt hatası:', participantError);
                        alert('Katılımcı bilgileri kaydedilemedi: ' + participantError.message);
                        throw participantError;
                    }

                    console.log('Katılımcı başarıyla kaydedildi:', participantResult);
                    participantId = participantResult.id;
                    localStorage.setItem('mmpiParticipantId', participantId);
                } else {
                    console.log('Mevcut participant_id kullanılıyor:', participantId);
                }

                // Önce aynı participant_id ile test sonucu var mı kontrol et
                const { data: existingTest, error: checkError } = await PG_API
                    .from('test_results')
                    .select('id')
                    .eq('participant_id', participantId)
                    .limit(1);

                if (checkError) {
                    console.error('Test sonucu kontrol hatası:', checkError);
                    alert('Test sonuçları kontrol edilemedi: ' + checkError.message);
                    throw checkError;
                }

                // Eğer aynı katılımcı için test sonucu varsa, güncelle
                const PostgreSQLData = {
                    participant_id: participantId,
                    // participant_info kaldırıldı
                    test_answers: this.answers, // { [question_number]: 'Doğru'|'Yanlış'|'Bilmiyorum' }
                    start_time: this.startTime,
                    end_time: this.endTime,
                    dont_know_count: this.dontKnowCount,
                    completed_questions: Object.keys(this.answers).length,
                    total_questions: this.questions.length,
                    test_type: 'MMPI',
                    test_version: '1.0',
                    status: 'completed',
                    session_code: this.sessionCode || localStorage.getItem('mmpiSessionCode'),
                    current_index: this.currentQuestionIndex
                };

                console.log('Test sonucu verisi hazırlandı:', PostgreSQLData);

                let data, error;

                if (existingTest && existingTest.length > 0) {
                    console.log('Aynı katılımcı için mevcut test sonucu güncelleniyor:', existingTest[0].id);
                    // Mevcut test sonucunu güncelle
                    const result = await PG_API
                        .from('test_results')
                        .eq('id', existingTest[0].id)
                        .update(PostgreSQLData);

                    data = result.data;
                    error = result.error;
                } else {
                    // Yeni test sonucu ekle
                    const result = await PG_API
                        .from('test_results')
                        .insert([PostgreSQLData]);

                    data = result.data;
                    error = result.error;
                }

                if (error) {
                    console.error('Test sonucu kayıt hatası:', error);
                    alert('Test sonuçları kaydedilemedi: ' + error.message);
                    throw error;
                }

                console.log('Test sonuçları PG_API\'e başarıyla kaydedildi:', data);
            } catch (error) {
                console.error('PG_API kayıt hatası:', error);
                alert('Veritabanı kayıt hatası: ' + error.message);
                // Hata durumunda da devam et, localStorage'da zaten kayıtlı
                console.log('Test sonuçları yerel olarak kaydedildi.');
            }
        } else {
            console.warn('PG_API bağlantısı mevcut değil, sadece yerel kayıt yapılıyor.');
            alert('Veritabanı bağlantısı yok, test sonuçları sadece yerel olarak kaydedildi.');
        }

        return testResults;
    }

    // Yardımcı: UI değeri -> Görsel metin
    mapValueToDisplay(value) {
        if (value === 'true' || value === true) return 'Doğru';
        if (value === 'false' || value === false) return 'Yanlış';
        if (value === 'dont_know' || value === null) return 'Bilmiyorum';
        return undefined;
    }

    // Yardımcı: Görsel metin -> UI değeri
    mapDisplayToValue(display) {
        if (display === 'Doğru' || display === 'true' || display === true) return 'true';
        if (display === 'Yanlış' || display === 'false' || display === false) return 'false';
        if (display === 'Bilmiyorum' || display === 'dont_know' || display === null) return 'dont_know';
        return undefined;
    }

    showWarning(message) {
        const $warningDiv = $('#warningMessage');
        const $warningText = $('#warningText');

        if ($warningDiv.length && $warningText.length) {
            $warningText.text(message);
            $warningDiv.css('display', 'block');

            // 3 saniye sonra gizle
            setTimeout(() => {
                this.hideWarning();
            }, 3000);
        }
    }

    hideWarning() {
        const $warningDiv = $('#warningMessage');
        if ($warningDiv.length) {
            $warningDiv.css('display', 'none');
        }
    }

    // beforeunload event listener'ını kaldır
    removeBeforeUnloadListener() {
        this.stopAutoSave();
        if (this.beforeUnloadHandler) {
            window.removeEventListener('beforeunload', this.beforeUnloadHandler);
        }
    }

    editPersonalInfo() {
        // Mevcut kişisel bilgileri yükle
        const personalInfo = localStorage.getItem('mmpiPersonalInfo');

        // Modal'ı aç
        const modal = new bootstrap.Modal($('#editInfoModal')[0]);
        modal.show();

        // Orijinal TC No'yu sakla (güncelleme için)
        let originalTcNo = null;

        // Modal tamamen açıldıktan sonra form alanlarını doldur
        $('#editInfoModal').on('shown.bs.modal', () => {
            if (personalInfo) {
                const info = JSON.parse(personalInfo);

                // Orijinal TC No'yu sakla
                originalTcNo = info.tcNo;

                // Modal form alanlarını doldur
                $('#editFirstName').val(info.firstName || '');
                $('#editLastName').val(info.lastName || '');
                $('#editTcNo').val(info.tcNo || '');
                $('#editAge').val(info.age || '');
                // Gender değerini yeni formata dönüştür
                let genderValue = info.gender || '';
                if (genderValue === 'Erkek' || genderValue === 'erkek') {
                    genderValue = 'male';
                } else if (genderValue === 'Kadın' || genderValue === 'kadın') {
                    genderValue = 'female';
                }
                $('#editGender').val(genderValue);
                $('#editEducation').val(info.education || '');
                $('#editMaritalStatus').val(info.maritalStatus || '');
                $('#editProfession').val(info.profession || '');
                $('#editInstitutionCode').val(info.institutionCode || '');
                $('#editInstitutionName').val(info.institutionName || '');
            }
        });

        // Kaydet butonuna olay dinleyici ekle
        $('#savePersonalInfoBtn').off('click').on('click', () => {
            this.savePersonalInfoFromModal(modal, originalTcNo);
        });
    }

    async savePersonalInfoFromModal(modal, originalTcNo) {
        // Form verilerini al
        const formData = {
            firstName: $('#editFirstName').val().trim(),
            lastName: $('#editLastName').val().trim(),
            tcNo: $('#editTcNo').val().trim(),
            age: parseInt($('#editAge').val()),
            gender: $('#editGender').val(),
            education: $('#editEducation').val(),
            maritalStatus: $('#editMaritalStatus').val(),
            profession: $('#editProfession').val().trim(),
            institutionCode: $('#editInstitutionCode').val().trim(),
            institutionName: $('#editInstitutionName').val().trim()
        };

        // Basit validasyon
        if (!formData.firstName || !formData.lastName || !formData.tcNo ||
            !formData.age || !formData.gender || !formData.education || !formData.maritalStatus) {
            alert('Lütfen zorunlu alanları doldurun.');
            return;
        }

        // Yaş kontrolü
        if (formData.age < 16 || formData.age > 100) {
            alert('Yaş 16-100 arasında olmalıdır.');
            return;
        }

        // TC No kontrolü
        if (formData.tcNo.length !== 11 || !/^\d+$/.test(formData.tcNo)) {
            alert('TC Kimlik No 11 haneli olmalıdır.');
            return;
        }

        // Verileri localStorage'a kaydet
        localStorage.setItem('mmpiPersonalInfo', JSON.stringify(formData));

        // PG_API'e de kaydet/güncelle
        try {
            await this.updatePostgreSQLRecord(formData, originalTcNo);
            console.log('Katılımcı bilgileri PG_API\'e güncellendi.');
        } catch (error) {
            console.error('PG_API güncelleme hatası:', error);
            // Hata durumunda da devam et
        }

        // Modal'ı kapat
        modal.hide();

        // Başarı mesajı
        //        alert('Kişisel bilgileriniz başarıyla güncellendi.');
    }

    async updatePostgreSQLRecord(participantData, originalTcNo = null) {
        // PG_API bağlantısı kontrolü
        if (typeof PG_API === 'undefined' || !PG_API) {
            console.log('PG_API bağlantısı mevcut değil.');
            return;
        }

        try {
            // Arama için kullanılacak TC No (orijinal varsa onu kullan, yoksa yeni TC No)
            const searchTcNo = originalTcNo || participantData.tcNo;

            // Cinsiyet değerini veritabanı formatına çevir (male/female → erkek/kadin)
            const genderMap = { 'male': 'erkek', 'female': 'kadin', 'other': 'other' };
            const dbGender = genderMap[participantData.gender] || participantData.gender;

            // TC No ile kayıt bul ve güncelle
            const { data, error } = await PG_API
                .from('participants')
                .eq('tc_no', searchTcNo)
                .update({
                    first_name: participantData.firstName,
                    last_name: participantData.lastName,
                    tc_no: participantData.tcNo,
                    gender: dbGender,
                    age: participantData.age,
                    institution_code: participantData.institutionCode || null,
                    profession: participantData.profession || null,
                    education: participantData.education,
                    marital_status: participantData.maritalStatus
                });

            if (error) {
                throw error;
            }

            if (data && data.length > 0) {
                console.log('Katılımcı bilgileri başarıyla güncellendi:', data[0]);
                participantId = data[0].id;
                localStorage.setItem('mmpiParticipantId', participantId);
                return data[0];
            } else {
                console.log('Güncellenecek kayıt bulunamadı.');
            }

        } catch (error) {
            console.error('PG_API güncelleme hatası:', error);
            throw error;
        }
    }
}

// Sayfa yüklendiğinde testi başlat
$(document).ready(function () {
    console.log('DOMContentLoaded event fired');

    // Test nesnesi oluştur
    window.mmpiTest = new MMPITest();

    // Sayfa kapatılmadan önce uyarı (sadece test devam ederken)
    window.mmpiTest.beforeUnloadHandler = function (e) {
        // Test tamamlanmışsa uyarı gösterme
        if (window.mmpiTest && window.mmpiTest.endTime) {
            return;
        }
        const confirmationMessage = 'Test devam ediyor. İlerlemenizi kaydetmek için "Kaydet ve Çık" butonunu kullanın.';
        e.returnValue = confirmationMessage;
        return confirmationMessage;
    };

    window.addEventListener('beforeunload', window.mmpiTest.beforeUnloadHandler);

    // Sayfa görünürlük değişikliklerini izle
    document.addEventListener('visibilitychange', function () {
        if (document.hidden) {
            // Sayfa gizlendiğinde ilerlemeyi kaydet
            if (window.mmpiTest) {
                window.mmpiTest.saveProgress();
            }
        }
    });
});

// Debug fonksiyonları (geliştirme için)
if (typeof window !== 'undefined') {
    window.mmpiDebug = {
        getCurrentQuestion: () => window.mmpiTest?.currentQuestionIndex,
        getAnswers: () => window.mmpiTest?.answers,
        getDontKnowCount: () => window.mmpiTest?.dontKnowCount,
        jumpToQuestion: (index) => {
            if (window.mmpiTest && index >= 0 && index < window.mmpiTest.questions.length) {
                window.mmpiTest.currentQuestionIndex = index;
                window.mmpiTest.displayQuestion();
                window.mmpiTest.updateProgress();
            }
        },
        getQuestions: () => window.mmpiTest?.questions,
        getTotalQuestions: () => window.mmpiTest?.questions.length || 0,
        isLoading: () => window.mmpiTest?.isLoading || false
    };
}