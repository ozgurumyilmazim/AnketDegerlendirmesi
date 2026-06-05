/**
 * PDF Utility Functions
 * PDF oluşturma ve indirme işlemleri için yardımcı fonksiyonlar
 */

// PDF kütüphanelerinin yüklenip yüklenmediğini kontrol et
function checkPDFLibraries() {
    if (typeof window.jspdf === 'undefined') {
        console.error('jsPDF kütüphanesi yüklenmemiş!');
        return false;
    }
    if (typeof html2canvas === 'undefined') {
        console.error('html2canvas kütüphanesi yüklenmemiş!');
        return false;
    }
    return true;
}

/**
 * HTML elementini PDF olarak indir
 * @param {string|HTMLElement} element - PDF'e dönüştürülecek element (selector veya element)
 * @param {string} filename - İndirilecek dosya adı (uzantısız)
 * @param {Object} options - PDF seçenekleri
 */
async function downloadElementAsPDF(element, filename, options = {}) {
    if (!checkPDFLibraries()) {
        throw new Error('PDF kütüphaneleri yüklenmemiş!');
    }

    try {
        // Element seçimi
        const targetElement = typeof element === 'string' ? document.querySelector(element) : element;
        if (!targetElement) {
            throw new Error('Hedef element bulunamadı!');
        }

        // Varsayılan seçenekler
        const defaultOptions = {
            scale: 1,
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff',
            width: targetElement.scrollWidth,
            height: targetElement.scrollHeight
        };

        const canvasOptions = { ...defaultOptions, ...options.canvas };
        const pdfOptions = {
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4',
            ...options.pdf
        };

        // Loading göster
        showPDFLoading(true);

        // no-print sınıfına sahip elementleri geçici olarak gizle
        const noPrintElements = targetElement.querySelectorAll('.no-print');
        const originalDisplays = [];
        noPrintElements.forEach((el, index) => {
            originalDisplays[index] = el.style.display;
            el.style.display = 'none';
        });
        
        // Görev tanımları için aşağıda tek kod bloğu kullanılıyor
        
        // Ek değerlendirme notları için CSS class yaklaşımı kullanılıyor
        checkAdditionalNoteVisibility();
        
        if (false) { // Eski kod kaldırıldı
            const additionalNoteValue2 = targetElement.querySelector('#additionalNote')?.value?.trim();
            if (!additionalNoteValue2) {
                additionalNoteOriginalDisplay2 = additionalNoteCard2.style.display;
                additionalNoteCard2.style.display = 'none';
            }
        }
        
        // Ek değerlendirme notları için CSS class yaklaşımı kullanılıyor
        
        // Görev tanımı bölümünde seçili olmayan maddeleri gizle
        const taskRows = targetElement.querySelectorAll('table tbody tr');
        const hiddenTaskRows = [];
        taskRows.forEach((row, index) => {
            const checkbox = row.querySelector('input[type="checkbox"].task-checkbox');
            if (checkbox && !checkbox.checked) {
                hiddenTaskRows.push({ row, originalDisplay: row.style.display });
                row.style.display = 'none';
            }
        });

        // HTML'i canvas'a dönüştür
        const canvas = await html2canvas(targetElement, canvasOptions);
        
        // no-print elementlerini tekrar göster
        noPrintElements.forEach((el, index) => {
            el.style.display = originalDisplays[index];
        });
        
        // CSS class yaklaşımı kullanıldığı için manuel geri yükleme gerekmiyor
        
        // Gizlenen görev maddelerini tekrar göster
        hiddenTaskRows.forEach(({ row, originalDisplay }) => {
            row.style.display = originalDisplay;
        });
        const imgData = canvas.toDataURL('image/jpeg', 0.8);

        // PDF oluştur
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF(pdfOptions.orientation, pdfOptions.unit, pdfOptions.format);
        
        // Sayfa boyutları
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        
        // Görsel boyutları
        const imgWidth = pageWidth;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        let heightLeft = imgHeight;
        let position = 0;

        // İlk sayfa
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        // Ek sayfalar (gerekirse)
        while (heightLeft >= 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;
        }

        // PDF'i indir
        pdf.save(`${filename}.pdf`);
        
        // Loading gizle
        showPDFLoading(false);
        
        return true;
    } catch (error) {
        showPDFLoading(false);
        console.error('PDF oluşturma hatası:', error);
        throw error;
    }
}

/**
 * Rapor PDF'i oluştur ve indir
 * @param {Object} reportData - Rapor verileri (opsiyonel)
 * @param {string} participantName - Katılımcı adı
 */
async function downloadReportPDF(reportData, participantName) {
    try {
        // Eğer reportData yoksa, participantName'i dosya adı olarak kullan
        const filename = participantName ? 
            `mmpi_rapor_${participantName}_${formatDateForFilename(new Date())}` :
            `mmpi_rapor_${formatDateForFilename(new Date())}`;
        
        // Rapor içeriğini al
        const reportContent = document.getElementById('reportContent');
        if (!reportContent) {
            throw new Error('Rapor içeriği bulunamadı');
        }
        
        await downloadElementAsTextPDF(reportContent, filename);
        
        showNotification('PDF raporu başarıyla indirildi.', 'success');
    } catch (error) {
        console.error('Rapor PDF indirme hatası:', error);
        showNotification('PDF oluşturulurken bir hata oluştu.', 'error');
    }
}

/**
 * Test sonuçları PDF'i oluştur ve indir
 * @param {Array} testResults - Test sonuçları
 * @param {string} format - PDF formatı
 */
async function downloadElementAsTextPDF(element, filename) {
    if (!checkPDFLibraries()) {
        throw new Error('PDF kütüphaneleri yüklenmemiş!');
    }

    try {
        // Element seçimi
        const targetElement = typeof element === 'string' ? document.querySelector(element) : element;
        if (!targetElement) {
            throw new Error('Hedef element bulunamadı!');
        }

        // Loading göster
        showPDFLoading(true);

        // no-print sınıfına sahip elementleri geçici olarak gizle
        const noPrintElements = targetElement.querySelectorAll('.no-print');
        const originalDisplays = [];
        noPrintElements.forEach((el, index) => {
            originalDisplays[index] = el.style.display;
            el.style.display = 'none';
        });

        // PDF oluştur
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF('portrait', 'mm', 'a4');
        
        // Sayfa boyutları
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const margin = 20;
        const maxWidth = pageWidth - (margin * 2);
        
        let yPosition = margin;
        
        // Başlık ekle
        const title = targetElement.querySelector('h1, h2, .card-title');
        if (title) {
            pdf.setFontSize(16);
            pdf.setFont(undefined, 'bold');
            const titleText = title.textContent.trim();
            pdf.text(titleText, margin, yPosition);
            yPosition += 15;
        }
        
        // İçeriği parse et ve ekle
        const cards = targetElement.querySelectorAll('.card:not(.no-print)');
        
        cards.forEach(card => {
            // Page break kontrolü - PDP bölümü için yeni sayfa
            if (card.classList.contains('page-break-before')) {
                pdf.addPage();
                yPosition = margin;
            }
            
            // Kart başlığı
            const cardHeader = card.querySelector('.card-header h5, .card-header h4, .card-header h6');
            if (cardHeader) {
                // Yeni sayfa kontrolü
                if (yPosition > pageHeight - 40) {
                    pdf.addPage();
                    yPosition = margin;
                }
                
                pdf.setFontSize(14);
                pdf.setFont(undefined, 'bold');
                const headerText = cardHeader.textContent.trim();
                pdf.text(headerText, margin, yPosition);
                yPosition += 12;
            }
            
            // Kart içeriği
            const cardBody = card.querySelector('.card-body');
            if (cardBody) {
                pdf.setFontSize(10);
                pdf.setFont(undefined, 'normal');
                
                // Paragrafları al
                const paragraphs = cardBody.querySelectorAll('p, div:not(.no-print)');
                paragraphs.forEach(p => {
                    const text = p.textContent.trim();
                    if (text && !p.classList.contains('no-print')) {
                        // Yeni sayfa kontrolü
                        if (yPosition > pageHeight - 20) {
                            pdf.addPage();
                            yPosition = margin;
                        }
                        
                        // Metni satırlara böl
                        const lines = pdf.splitTextToSize(text, maxWidth);
                        pdf.text(lines, margin, yPosition);
                        yPosition += lines.length * 5 + 3;
                    }
                });
                
                yPosition += 8; // Kartlar arası boşluk
            }
        });
        
        // no-print elementlerini tekrar göster
        noPrintElements.forEach((el, index) => {
            el.style.display = originalDisplays[index];
        });
        
        // Görev tanımları geri yükleme kaldırıldı (çift kod vardı)
        
        // Ek değerlendirme notları alanını tekrar göster
        // CSS class yaklaşımı kullanıldığı için manuel geri yükleme gerekmiyor
        
        // PDF'i kaydet
        pdf.save(`${filename}.pdf`);
        
    } catch (error) {
        console.error('PDF oluşturma hatası:', error);
        throw error;
    } finally {
        showPDFLoading(false);
    }
}

async function downloadTestResultsPDF(testResults, format = 'summary') {
    try {
        const filename = `mmpi_rapor_${formatDateForFilename(new Date())}`;
        
        // Test sonuçları için özel HTML oluştur
        const htmlContent = generateTestResultsHTML(testResults, format);
        
        // Geçici div oluştur
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = htmlContent;
        tempDiv.style.position = 'absolute';
        tempDiv.style.left = '-9999px';
        tempDiv.style.top = '-9999px';
        tempDiv.style.width = '210mm';
        tempDiv.style.padding = '20mm';
        tempDiv.style.backgroundColor = '#ffffff';
        tempDiv.style.fontFamily = 'Arial, sans-serif';
        tempDiv.style.fontSize = '12px';
        tempDiv.style.lineHeight = '1.5';
        
        document.body.appendChild(tempDiv);
        
        await downloadElementAsPDF(tempDiv, filename);
        
        // Geçici div'i kaldır
        document.body.removeChild(tempDiv);
        
        showNotification('PDF raporu başarıyla oluşturuldu.', 'success');
    } catch (error) {
        console.error('Test sonuçları PDF oluşturma hatası:', error);
        showNotification('PDF oluşturulurken bir hata oluştu.', 'error');
    }
}

/**
 * Test sonuçları için HTML içeriği oluştur
 * @param {Array} testResults - Test sonuçları
 * @param {string} format - Format tipi
 */
function generateTestResultsHTML(testResults, format) {
    let html = `
        <div style="padding: 20px; font-family: Arial, sans-serif;">
            <h1 style="text-align: center; color: #333; margin-bottom: 30px;">MMPI Test Sonuçları</h1>
            <div style="margin-bottom: 20px;">
                <strong>Rapor Tarihi:</strong> ${new Date().toLocaleDateString('tr-TR')}<br>
                <strong>Toplam Test Sayısı:</strong> ${testResults.length}
            </div>
    `;
    
    testResults.forEach((test, index) => {
        html += `
            <div style="border: 1px solid #ddd; margin-bottom: 20px; padding: 15px; border-radius: 5px;">
                <h3 style="color: #2563eb; margin-bottom: 10px;">${index + 1}. ${test.participant_name}</h3>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px;">
                    <div><strong>TC No:</strong> ${test.tc_no || 'Belirtilmemiş'}</div>
                    <div><strong>Cinsiyet:</strong> ${test.gender === 'male' ? 'Erkek' : 'Kadın'}</div>
                    <div><strong>Yaş:</strong> ${test.age || 'Belirtilmemiş'}</div>
                    <div><strong>Test Tarihi:</strong> ${formatDate(test.created)}</div>
                </div>
                <div style="margin-top: 10px;">
                    <strong>Durum:</strong> 
                    <span style="padding: 2px 8px; border-radius: 3px; font-size: 11px; 
                        ${test.status === 'completed' ? 'background-color: #dcfce7; color: #166534;' : 
                          test.status === 'in_progress' ? 'background-color: #fef3c7; color: #92400e;' : 
                          'background-color: #fee2e2; color: #991b1b;'}">
                        ${getStatusText(test.status)}
                    </span>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    return html;
}

/**
 * PDF loading durumunu göster/gizle
 * @param {boolean} show - Gösterilsin mi?
 */
function showPDFLoading(show) {
    let loadingDiv = document.getElementById('pdfLoadingOverlay');
    
    if (show) {
        if (!loadingDiv) {
            loadingDiv = document.createElement('div');
            loadingDiv.id = 'pdfLoadingOverlay';
            loadingDiv.innerHTML = `
                <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
                     background-color: rgba(0,0,0,0.5); z-index: 9999; 
                     display: flex; justify-content: center; align-items: center;">
                    <div style="background: white; padding: 30px; border-radius: 10px; text-align: center;">
                        <div style="margin-bottom: 15px;">
                            <div style="border: 4px solid #f3f3f3; border-top: 4px solid #3498db; 
                                 border-radius: 50%; width: 40px; height: 40px; 
                                 animation: spin 2s linear infinite; margin: 0 auto;"></div>
                        </div>
                        <div style="font-size: 16px; color: #333;">PDF oluşturuluyor...</div>
                    </div>
                </div>
                <style>
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                </style>
            `;
            document.body.appendChild(loadingDiv);
        }
        loadingDiv.style.display = 'flex';
    } else {
        if (loadingDiv) {
            loadingDiv.style.display = 'none';
        }
    }
}

/**
 * Tarih formatı için yardımcı fonksiyon
 * @param {Date} date - Tarih
 */
function formatDateForFilename(date) {
    return date.toISOString().slice(0, 19).replace(/[-:]/g, '').replace('T', '_');
}

/**
 * Bildirim göster
 * @param {string} message - Gösterilecek mesaj
 * @param {string} type - Bildirim tipi (success, error, warning, info)
 */
function showNotification(message, type = 'info') {
    // Eğer sayfa içinde başka bir showNotification fonksiyonu varsa onu kullan
    if (window.showNotification && window.showNotification !== showNotification && typeof window.showNotification === 'function') {
        window.showNotification(message, type);
        return;
    }
    
    // Sayfa içi bildirim oluştur
    createInPageNotification(message, type);
}

/**
 * Sayfa içi bildirim oluştur
 * @param {string} message - Gösterilecek mesaj
 * @param {string} type - Bildirim tipi (success, error, warning, info)
 */
function createInPageNotification(message, type = 'info') {
    // Mevcut bildirimleri temizle
    const existingNotifications = document.querySelectorAll('.pdf-notification');
    existingNotifications.forEach(notification => notification.remove());
    
    // Bildirim elementi oluştur
    const notification = document.createElement('div');
    notification.className = `pdf-notification pdf-notification-${type}`;
    notification.innerHTML = `
        <div class="pdf-notification-content">
            <span class="pdf-notification-message">${message}</span>
            <button class="pdf-notification-close" onclick="this.parentElement.parentElement.remove()">&times;</button>
        </div>
    `;
    
    // Stil ekle
    if (!document.getElementById('pdf-notification-styles')) {
        const style = document.createElement('style');
        style.id = 'pdf-notification-styles';
        style.textContent = `
            .pdf-notification {
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                max-width: 400px;
                padding: 15px;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                font-size: 14px;
                animation: slideIn 0.3s ease-out;
            }
            .pdf-notification-success {
                background-color: #d4edda;
                border: 1px solid #c3e6cb;
                color: #155724;
            }
            .pdf-notification-error {
                background-color: #f8d7da;
                border: 1px solid #f5c6cb;
                color: #721c24;
            }
            .pdf-notification-warning {
                background-color: #fff3cd;
                border: 1px solid #ffeaa7;
                color: #856404;
            }
            .pdf-notification-info {
                background-color: #d1ecf1;
                border: 1px solid #bee5eb;
                color: #0c5460;
            }
            .pdf-notification-content {
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            .pdf-notification-message {
                flex: 1;
                margin-right: 10px;
            }
            .pdf-notification-close {
                background: none;
                border: none;
                font-size: 18px;
                cursor: pointer;
                padding: 0;
                width: 20px;
                height: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
                opacity: 0.7;
            }
            .pdf-notification-close:hover {
                opacity: 1;
            }
            @keyframes slideIn {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    // Sayfaya ekle
    document.body.appendChild(notification);
    
    // 5 saniye sonra otomatik kaldır
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);
}

// Global olarak erişilebilir hale getir
window.PDFUtils = {
    downloadElementAsPDF,
    downloadElementAsTextPDF,
    downloadReportPDF,
    downloadTestResultsPDF,
    showPDFLoading,
    checkPDFLibraries,
    showNotification
};