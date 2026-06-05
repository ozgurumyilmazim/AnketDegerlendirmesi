// Report.js - MMPI Test Raporu Görüntüleme

let reportData = null;
let testId = null;

// Textarea otomatik yükseklik ayarlaması
function autoResizeTextarea(textarea) {
    // Önce height'i sıfırla ki scrollHeight doğru hesaplansın
    textarea.style.height = 'auto';
    // Min-height'den küçük olmaması için kontrol et
    const minHeight = 120;
    const newHeight = Math.max(textarea.scrollHeight, minHeight);
    textarea.style.height = newHeight + 'px';
}

// Ek değerlendirme notları alanının görünürlüğünü kontrol et (sadece PDF için)
function checkAdditionalNoteVisibility() {
    const additionalNote = document.getElementById('additionalNote');
    if (additionalNote) {
        const noteValue = additionalNote.value?.trim();
        // const cardElement = additionalNote.closest('.card');
        const cardElement = document.getElementById('additionalNoteCard');

        if (!noteValue) {
            cardElement.classList.add('no-print');
        } else {
            cardElement.classList.remove('no-print');
        }
    }
}

// Norm konfigürasyonu (TR - MMPI-2 - Adult)
const NORM_DEFAULTS = {
    testVersion: 'MMPI-2',
    locale: 'TR',
    ageGroup: 'adult'
};

// Sayfa yüklendiğinde
document.addEventListener('DOMContentLoaded', function() {

    // URL'den test ID'sini al
    const urlParams = new URLSearchParams(window.location.search);
    testId = urlParams.get('id');

    if (!testId) {
        showError('Test ID bulunamadı.');
        return;
    }

    // Raporu yükle
    loadReport();
});

// Raporu yükle
async function loadReport() {
    try {
        // Önce raporu al (URL'den gelen ID reports tablosundaki ID olabilir)
        const { data: report, error: reportError } = await supabase
            .from('reports')
            .select('*')
            .eq('id', testId)
            .single();

        if (reportError) {
            console.error('Rapor bulunamadı:', reportError);
            showError('Rapor bulunamadı.');
            return;
        }

        // Test sonucunu al (report'tan test_result_id kullanarak)
        const { data: testResult, error: testError } = await supabase
            .from('test_results')
            .select('*')
            .eq('id', report.test_result_id)
            .single();

        if (testError) {
            console.error('Test sonucu alınırken hata:', testError);
            showError('Test sonucu bulunamadı.');
            return;
        }

        // Katılımcı bilgilerini participants tablosundan al
        const { data: participant, error: pErr } = await supabase
            .from('participants')
            .select('*')
            .eq('id', testResult.participant_id)
            .single();
        if (pErr) {
            console.warn('Katılımcı bilgisi alınamadı:', pErr);
        }

        // Rapor verilerini birleştir
        reportData = {
            testResult,
            participant: participant || null,
            report: {
                ...report.report_content,
                id: report.id,
                created_at: report.created,
                // Yeni psikolog değerlendirmesi alanları
                psychologist_name: report.psychologist_name,
                evaluation_date: report.evaluation_date,
                participation: report.participation,
                validity: report.validity,
                summary: report.summary,
                additional_evaluation_note: report.additional_evaluation_note,
                pdp_results: report.pdp_results,
                task_definitions_evaluation: report.task_definitions_evaluation,
                evaluation_process: report.evaluation_process,
                measurement_process: report.measurement_process,
                competency_evaluation: report.competency_evaluation,
                session_need_status: report.session_need_status,
                session_explanation: report.session_explanation
            }
        };

        // Rapor içeriği yoksa veya eksikse hata göster
        if (!reportData.report.raw_scores || !reportData.report.t_scores) {
            showError('Rapor içeriği eksik. Lütfen raporu yeniden oluşturun.');
            return;
        }

        // Raporu görüntüle
        displayReport();

    } catch (error) {
        console.error('Rapor yüklenirken hata:', error);
        showError('Rapor yüklenirken beklenmeyen bir hata oluştu.');
    }
}

// Raporu görüntüle
function displayReport() {
    const { testResult, report } = reportData;

    // Katılımcı bilgilerini göster
    displayParticipantInfo(testResult);

    // Geçerlilik değerlendirmesini göster
    displayValidityAssessment(report.validity_assessment);

    // Profil grafiğini çiz
    drawProfileChart(report.t_scores);

    drawProfileChartForPdf(report.t_scores);

    // Ölçek sonuçlarını göster
    displayScaleResults(report.raw_scores, report.t_scores, report.interpretations);

    // K oranlarını göster
    displayKAdjustments(report.raw_scores, report.t_scores);

    // Özet ve yorumlamayı göster
    displaySummary(report.summary);

    // Önerileri göster
    displayRecommendations(report.recommendations);

    // Yükleme göstergesini gizle ve raporu göster
    document.getElementById('loadingIndicator').style.display = 'none';
    document.getElementById('reportContent').style.display = 'block';

    // Psikolog değerlendirmesi alanlarını başlat
    initializePsychologistEvaluation();

    // Psikolog değerlendirmesi verilerini yükle
    loadPsychologistEvaluation();

    // Özet ve Rapor Sonucu alanlarını başlat
    initializeSummaryAndResult();

    // Özet ve Rapor Sonucu verilerini yükle
    loadSummaryAndResult();

    // Tüm textarea'ların yüksekliklerini son bir kez kontrol et
    setTimeout(() => {
        const textareas = document.querySelectorAll('.auto-resize-textarea');
        textareas.forEach(textarea => {
            if (textarea.value.trim()) {
                autoResizeTextarea(textarea);
            }
        });
    }, 200);
}

// Katılımcı bilgilerini göster
function displayParticipantInfo(testResult) {
    const participant = reportData.participant || {};

    const participantName = `${participant.first_name || ''} ${participant.last_name || ''}`.trim() || 'Belirtilmemiş';
    document.getElementById('participantName').textContent = participantName;

    // TC Kimlik No
    const participantTcNo = participant.tc_no || 'Belirtilmemiş';
    document.getElementById('participantTcNo').textContent = participantTcNo;

    // Cinsiyet farklı formatlarda gelebilir; normalize ederek göster
    const gRaw = (participant.gender || '').toString().toLowerCase();
    const genderText = gRaw === 'male' || gRaw === 'erkek' ? 'Erkek' :
        gRaw === 'female' || gRaw === 'kadın' || gRaw === 'kadin' ? 'Kadın' :
            (participant.gender ? String(participant.gender) : 'Belirtilmemiş');
    document.getElementById('participantGender').textContent = genderText;

    const participantAge = participant.age || 'Belirtilmemiş';
    document.getElementById('participantAge').textContent = participantAge;

    const participantEducation = participant.education || 'Belirtilmemiş';
    document.getElementById('participantEducation').textContent = participantEducation;

    // Medeni Durum
    const participantMaritalStatus = participant.marital_status || 'Belirtilmemiş';
    document.getElementById('participantMaritalStatus').textContent = participantMaritalStatus;

    const testDate = formatDate(testResult.created);
    document.getElementById('testDate').textContent = testDate;

    // PDF için katılımcı bilgilerini de güncelle
    document.getElementById('pdfParticipantName').textContent = participantName;
    document.getElementById('pdfParticipantTcNo').textContent = participantTcNo;
    document.getElementById('pdfAge').textContent = participantAge;
    document.getElementById('pdfEducation').textContent = participantEducation;
    document.getElementById('pdfProfession').textContent = participant.profession || 'Belirtilmemiş';
    document.getElementById('pdfMaritalStatus').textContent = participant.marital_status || 'Belirtilmemiş';
    document.getElementById('pdfTestDate').textContent = testDate;

    // Test süresini hesapla
    if (testResult.start_time && testResult.end_time) {
        const duration = Math.round((new Date(testResult.end_time) - new Date(testResult.start_time)) / (1000 * 60));
        document.getElementById('testDuration').textContent = `${duration} dakika`;
    } else {
        document.getElementById('testDuration').textContent = 'Belirtilmemiş';
    }
    // "Bilmiyorum" sayısı
    const dk = typeof testResult.dont_know_count === 'number' ? testResult.dont_know_count :
        countDontKnowFromAnswers(testResult.test_answers);
    const dkEl = document.getElementById('dontKnowCount');
    if (dkEl) dkEl.textContent = dk;
}

// Geçerlilik değerlendirmesini göster
function displayValidityAssessment(validityAssessment) {
    const validitySection = document.getElementById('validitySection');
    const validityContent = document.getElementById('validityContent');

    if (!validityAssessment.isValid || validityAssessment.warnings.length > 0) {
        let html = '';

        if (!validityAssessment.isValid) {
            html += `
                <div class="alert alert-danger">
                    <h6><i class="fas fa-exclamation-triangle me-2"></i>Geçersiz Profil</h6>
                    <p class="mb-0">Bu test profili geçersiz olarak değerlendirilmiştir. Sonuçlar dikkatli yorumlanmalıdır.</p>
                </div>
            `;
        }

        if (validityAssessment.warnings.length > 0) {
            html += '<h6>Uyarılar:</h6><ul>';
            validityAssessment.warnings.forEach(warning => {
                html += `<li>${warning}</li>`;
            });
            html += '</ul>';
        }

        validityContent.innerHTML = html;
    } else {
        validityContent.innerHTML = `
            <div class="alert alert-success">
                <h6><i class="fas fa-check-circle me-2"></i>Geçerli Profil</h6>
                <p class="mb-0">Test profili geçerli olarak değerlendirilmiştir.</p>
            </div>
        `;
    }
}

// Profil grafiğini çiz
function drawProfileChart(tScores) {
    const ctx = document.getElementById('profileChart').getContext('2d');

    // Ölçek isimleri ve sırası
    const scaleOrder = ['L', 'F', 'K', 'Hs', 'D', 'Hy', 'Pd', 'Mf', 'Pa', 'Pt', 'Sc', 'Ma', 'Si'];
    // Grafik x-etiketleri kısa kodlarla gösterilsin (parantezsiz)
    const labels = scaleOrder.slice();
    const data = scaleOrder.map(scale => tScores[scale] || 50);

    // Dikey çizgi (Hs öncesi) için basit plugin
    const verticalLinePlugin = {
        id: 'verticalLinePlugin',
        afterDatasetsDraw(chart) {
            const index = 3; // Hs öncesi (L,F,K -> 0,1,2; çizgi 3. tickte)
            const { ctx, chartArea, scales } = chart;
            if (!scales?.x || !scales?.y) return;
            const x1 = scales.x.getPixelForTick(2);
            const x2 = scales.x.getPixelForTick(3);
            var x = x1 + (x2-x1)/2;
            ctx.save();
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(x, chartArea.top);
            ctx.lineTo(x, chartArea.bottom);
            ctx.stroke();
            ctx.restore();
        }
    };

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: '',
                data: data,
                borderColor: '#007bff',
                backgroundColor: 'rgba(0, 123, 255, 0.1)',
                borderWidth: 2,
                pointBackgroundColor: data.map(score => {
                    if (score >= 65) return '#dc3545'; // Yüksek - Kırmızı
                    if (score >= 60) return '#ffc107'; // Orta-Yüksek - Sarı
                    return '#28a745'; // Normal - Yeşil
                }),
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 6,
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            font: {
                family: 'Arial, sans-serif',
                size: 14
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    titleFont: {
                        family: 'Arial, sans-serif',
                        size: 14,
                        weight: 'bold'
                    },
                    bodyFont: {
                        family: 'Arial, sans-serif',
                        size: 12
                    },
                    callbacks: {
                        title: function(items) {
                            // Parantezli açıklamalarla başlık
                            const idx = items?.[0]?.dataIndex ?? 0;
                            const scale = ['L','F','K','Hs','D','Hy','Pd','Mf','Pa','Pt','Sc','Ma','Si'][idx];
                            const longNames = {
                                L: 'L (Yalan)', F: 'F (Sıklık)', K: 'K (Düzeltme)',
                                Hs: 'Hs (Hipokondriazis)', D: 'D (Depresyon)', Hy: 'Hy (Histeri)',
                                Pd: 'Pd (Psikopati)', Mf: 'Mf (Maskülinite-Femininite)', Pa: 'Pa (Paranoya)',
                                Pt: 'Pt (Psikasteni)', Sc: 'Sc (Şizofreni)', Ma: 'Ma (Hipomani)', Si: 'Si (Sosyal İçedönüklük)'
                            };
                            return longNames[scale] || scale;
                        },
                        label: function(context) {
                            return `: ${context.parsed.y}`;
                        }
                    }
                },
                datalabels: {
                    color: '#e06666',
                    align: 'top',
                    anchor: 'end',
                    formatter: function(value) { return value; },
                    font: {
                        family: 'Arial, sans-serif',
                        size: 12,
                        weight: 'bold'
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    min: 0,
                    max: 120,
                    ticks: {
                        stepSize: 10,
                        font: {
                            family: 'Arial, sans-serif',
                            size: 12
                        }
                    },
                    title: {
                        display: true,
                        text: '',
                        font: {
                            family: 'Arial, sans-serif',
                            size: 14,
                            weight: 'bold'
                        }
                    },
                    grid: {
                        color: function(context) {
                            if (context.tick.value === 65) return '#dc3545';
                            if (context.tick.value === 70) return '#ffc107';
                            return '#e0e0e0';
                        },
                        lineWidth: function(context) {
                            if (context.tick.value === 65 || context.tick.value === 70) return 2;
                            return 1;
                        }
                    }
                },
                x: {
                    ticks: {
                        autoSkip: false,
                        maxRotation: 0,
                        minRotation: 0,
                        font: {
                            family: 'Arial, sans-serif',
                            size: 11,
                            weight: 'bold'
                        },
                        callback: function(value, index) {
                            // X ekseninde ölçek kısa adı + T değeri (iki satır)
                            const scale = scaleOrder[index];
                            const t = (tScores && tScores[scale] !== undefined) ? tScores[scale] : 50;
                            return [scale, String(t)];
                        }
                    },
                    title: {
                        display: true,
                        text: '',
                        font: {
                            family: 'Arial, sans-serif',
                            size: 14,
                            weight: 'bold'
                        }
                    }
                }
            },
        },
        plugins: [verticalLinePlugin]
    });
}


// Profil grafiğini çiz
function drawProfileChartForPdf(tScores) {
    const ctx = document.getElementById('profileChartForPdf').getContext('2d');

    // Ölçek isimleri ve sırası
    const scaleOrder = ['L', 'F', 'K', 'Hs', 'D', 'Hy', 'Pd', 'Mf', 'Pa', 'Pt', 'Sc', 'Ma', 'Si'];
    // Grafik x-etiketleri kısa kodlarla gösterilsin (parantezsiz)
    const labels = scaleOrder.slice();
    const data = scaleOrder.map(scale => tScores[scale] || 50);

    // Dikey çizgi (Hs öncesi) için basit plugin
    const verticalLinePlugin = {
        id: 'verticalLinePlugin',
        afterDatasetsDraw(chart) {
            const index = 3; // Hs öncesi (L,F,K -> 0,1,2; çizgi 3. tickte)
            const { ctx, chartArea, scales } = chart;
            if (!scales?.x || !scales?.y) return;
            const x1 = scales.x.getPixelForTick(2);
            const x2 = scales.x.getPixelForTick(3);
            var x = x1 + (x2-x1)/2;
            ctx.save();
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(x, chartArea.top);
            ctx.lineTo(x, chartArea.bottom);
            ctx.stroke();
            ctx.restore();
        }
    };

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: '',
                data: data,
                borderColor: '#007bff',
                backgroundColor: 'rgba(0, 123, 255, 0.1)',
                borderWidth: 2,
                pointBackgroundColor: data.map(score => {
                    if (score >= 65) return '#dc3545'; // Yüksek - Kırmızı
                    if (score >= 60) return '#ffc107'; // Orta-Yüksek - Sarı
                    return '#28a745'; // Normal - Yeşil
                }),
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 6,
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            aspectRatio: 1092 / 592, // 1.845 - hedeflenen oran
            font: {
                family: 'Arial, sans-serif',
                size: 14
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    titleFont: {
                        family: 'Arial, sans-serif',
                        size: 14,
                        weight: 'bold'
                    },
                    bodyFont: {
                        family: 'Arial, sans-serif',
                        size: 12
                    },
                    callbacks: {
                        title: function(items) {
                            // Parantezli açıklamalarla başlık
                            const idx = items?.[0]?.dataIndex ?? 0;
                            const scale = ['L','F','K','Hs','D','Hy','Pd','Mf','Pa','Pt','Sc','Ma','Si'][idx];
                            const longNames = {
                                L: 'L (Yalan)', F: 'F (Sıklık)', K: 'K (Düzeltme)',
                                Hs: 'Hs (Hipokondriazis)', D: 'D (Depresyon)', Hy: 'Hy (Histeri)',
                                Pd: 'Pd (Psikopati)', Mf: 'Mf (Maskülinite-Femininite)', Pa: 'Pa (Paranoya)',
                                Pt: 'Pt (Psikasteni)', Sc: 'Sc (Şizofreni)', Ma: 'Ma (Hipomani)', Si: 'Si (Sosyal İçedönüklük)'
                            };
                            return longNames[scale] || scale;
                        },
                        label: function(context) {
                            return `: ${context.parsed.y}`;
                        }
                    }
                },
                datalabels: {
                    color: '#e06666',
                    align: 'top',
                    anchor: 'end',
                    formatter: function(value) { return value; },
                    font: {
                        family: 'Arial, sans-serif',
                        size: 12,
                        weight: 'bold'
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    min: 0,
                    max: 120,
                    ticks: {
                        stepSize: 10,
                        font: {
                            family: 'Arial, sans-serif',
                            size: 12
                        }
                    },
                    title: {
                        display: true,
                        text: '',
                        font: {
                            family: 'Arial, sans-serif',
                            size: 14,
                            weight: 'bold'
                        }
                    },
                    grid: {
                        color: function(context) {
                            if (context.tick.value === 65) return '#dc3545';
                            if (context.tick.value === 70) return '#ffc107';
                            return '#e0e0e0';
                        },
                        lineWidth: function(context) {
                            if (context.tick.value === 65 || context.tick.value === 70) return 2;
                            return 1;
                        }
                    }
                },
                x: {
                    ticks: {
                        autoSkip: false,
                        maxRotation: 0,
                        minRotation: 0,
                        font: {
                            family: 'Arial, sans-serif',
                            size: 11,
                            weight: 'bold'
                        },
                        callback: function(value, index) {
                            // X ekseninde ölçek kısa adı + T değeri (iki satır)
                            const scale = scaleOrder[index];
                            const t = (tScores && tScores[scale] !== undefined) ? tScores[scale] : 50;
                            return [scale, String(t)];
                        }
                    },
                    title: {
                        display: true,
                        text: '',
                        font: {
                            family: 'Arial, sans-serif',
                            size: 14,
                            weight: 'bold'
                        }
                    }
                }
            },
        },
        plugins: [verticalLinePlugin]
    });
}

// Ölçek sonuçlarını göster
function displayScaleResults(rawScores, tScores, interpretations) {
    const scaleResults = document.getElementById('scaleResults');

    const scaleOrder = ['L', 'F', 'K', 'Hs', 'D', 'Hy', 'Pd', 'Mf', 'Pa', 'Pt', 'Sc', 'Ma', 'Si'];
    const scaleNames = {
        'L': 'L - Yalan Ölçeği',
        'F': 'F - Sıklık Ölçeği',
        'K': 'K - Düzeltme Ölçeği',
        'Hs': 'Hs - Hipokondriazis',
        'D': 'D - Depresyon',
        'Hy': 'Hy - Histeri',
        'Pd': 'Pd - Psikopati',
        'Mf': 'Mf - Maskülinite-Femininite',
        'Pa': 'Pa - Paranoya',
        'Pt': 'Pt - Psikasteni',
        'Sc': 'Sc - Şizofreni',
        'Ma': 'Ma - Hipomani',
        'Si': 'Si - Sosyal İçedönüklük'
    };
    // +K katsayıları (cinsiyetten bağımsız)
    const kCorrections = { Hs: 0.5, Pd: 0.4, Pt: 1.0, Sc: 1.0, Ma: 0.2 };
    const kScore = rawScores['K'] || 0;

    let html = '';

    scaleOrder.forEach(scale => {
        if (tScores[scale] !== undefined) {
            const tScore = tScores[scale];
            const rawScore = rawScores[scale] || 0;
            const kAdd = kCorrections[scale] ? Math.round(kScore * kCorrections[scale]) : 0;
            const interpretation = interpretations[scale] || 'Değerlendirme yapılamadı';

            let cardClass = 'scale-normal';
            if (tScore >= 65) cardClass = 'scale-high';
            else if (tScore >= 60) cardClass = 'scale-moderate';

            html += `
                <div class="col-lg-3 col-md-4 col-sm-6 mb-1">
                    <div class="card scale-card ${cardClass}">
                        <div class="card-body">
                            <h6 class="card-title">${scaleNames[scale]}</h6>
                            <div class="row align-items-center">
                                <div class="col-4">
                                    <small class="text-muted d-block">Ham</small>
                                    <div class="h5 mb-0">${rawScore}</div>
                                    <small class="text-muted">${
                kCorrections[scale]
                    ? `+${(Number.isInteger(kCorrections[scale]) ? kCorrections[scale].toFixed(0) : kCorrections[scale])}K`
                    : '-'
            }</small>
                                </div>
                                <div class="col-4">
                                    <small class="text-muted d-block">T-Skor</small>
                                    <div class="h5 mb-0 text-primary fw-bold">${tScore}</div>
                                </div>
                                <div class="col-4 text-end">
                                    <span class="badge ${
                tScore >= 65 ? 'bg-danger' :
                    tScore >= 60 ? 'bg-warning text-dark' : 'bg-success'
            } small">${
                tScore >= 65 ? 'Yüksek' :
                    tScore >= 60 ? 'Orta' : 'Normal'
            }</span>
                                </div>
                            </div>
                            <p class="card-text small mt-1 mb-0" title="${interpretation}">${
                interpretation.length > 60 ? interpretation.substring(0, 60) + '...' : interpretation
            }</p>
                        </div>
                    </div>
                </div>
            `;
        }
    });

    scaleResults.innerHTML = html;
}

// Özet ve yorumlamayı göster
function displaySummary(summary) {
    const summaryContent = document.getElementById('summaryContent');
    if (typeof summary === 'string') {
        summaryContent.innerHTML = `<p>${summary}</p>`;
    } else if (summary && summary.overallAssessment) {
        // Eski/alternatif format desteği
        const items = [];
        if (summary.keyFindings && summary.keyFindings.length) items.push(`<strong>Bulgu:</strong> ${summary.keyFindings.join(', ')}`);
        if (summary.riskFactors && summary.riskFactors.length) items.push(`<strong>Riskler:</strong> ${summary.riskFactors.join(', ')}`);
        if (summary.strengths && summary.strengths.length) items.push(`<strong>Güçlü Yönler:</strong> ${summary.strengths.join(', ')}`);
        summaryContent.innerHTML = `<p>${summary.overallAssessment}</p>${items.map(i=>`<p>${i}</p>`).join('')}`;
    } else {
        summaryContent.innerHTML = `<p>Özet verisi bulunamadı.</p>`;
    }
}

// Önerileri göster
function displayRecommendations(recommendations) {
    const recommendationsContent = document.getElementById('recommendationsContent');

    let html = '<ul>';
    recommendations.forEach(recommendation => {
        html += `<li>${recommendation}</li>`;
    });
    html += '</ul>';

    recommendationsContent.innerHTML = html;
}

// Hata göster
function showError(message) {
    document.getElementById('loadingIndicator').innerHTML = `
        <div class="alert alert-danger">
            <h5><i class="fas fa-exclamation-triangle me-2"></i>Hata</h5>
            <p class="mb-0">${message}</p>
            <button class="btn btn-primary mt-3" onclick="history.back()">
                <i class="fas fa-arrow-left me-2"></i>Geri Dön
            </button>
        </div>
    `;
}

// Tarih formatlama
function formatDate(dateString) {
    if (!dateString) return 'Belirtilmemiş';

    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}



// Yardımcı: test_answers JSON'dan "Bilmiyorum" sayısını hesapla
function countDontKnowFromAnswers(answersMap = {}) {
    try {
        const keys = Object.keys(answersMap || {});
        let cnt = 0;
        for (const k of keys) {
            const v = answersMap[k];
            if (v === 'Bilmiyorum' || v === 'dont_know' || v === null) cnt++;
        }
        return cnt;
    } catch (_) {
        return 0;
    }
}

// Boş rapor içerikleri için yerinde skor hesaplama
async function computeScoresFromTestResult(testResult, participant = null) {
    try {
        // test_answers: { "1":"Doğru" | "Yanlış" | "Bilmiyorum" }
        const rawAnswersMap = testResult?.test_answers || {};

        // Cevapları normalize et -> 'Doğru' | 'Yanlış' | 'Bilmiyorum'
        const normalizeAnswer = (val) => {
            if (val === undefined || val === null) return 'Bilmiyorum';
            const v = (typeof val === 'string' ? val.trim() : val).toString().toLowerCase();
            if (v === 'true' || v === 'doğru' || v === 'dogru' || v === 'evet' || v === '1') return 'Doğru';
            if (v === 'false' || v === 'yanlış' || v === 'yanlis' || v === 'hayır' || v === 'hayir' || v === '0') return 'Yanlış';
            if (v === 'dont_know' || v === 'bilmiyorum' || v === 'unknown' || v === 'null' || v === 'NaN'.toLowerCase()) return 'Bilmiyorum';
            return val === true ? 'Doğru' : val === false ? 'Yanlış' : 'Bilmiyorum';
        };

        const answersMap = {};
        Object.keys(rawAnswersMap).forEach((k) => {
            answersMap[k] = normalizeAnswer(rawAnswersMap[k]);
        });

        // Scoring keys'i çek
        const { data: scoringKeys, error } = await supabase
            .from('scoring_keys')
            .select('scale_name, question_number, scoring_answer');
        if (error) throw error;

        // scoring_keys -> scoringMap { scale_name: { question_number: scoring_answer } }
        const scoringMap = {};
        scoringKeys.forEach(k => {
            const scale = k.scale_name;
            const q = String(k.question_number);
            if (!scoringMap[scale]) scoringMap[scale] = {};
            scoringMap[scale][q] = normalizeAnswer(k.scoring_answer);
        });

        // Ham puanları hesapla: O(1) erişimle karşılaştır
        const rawScores = {};
        Object.keys(scoringMap).forEach(scaleName => {
            let score = 0;
            const questionsForScale = scoringMap[scaleName];
            Object.keys(questionsForScale).forEach(q => {
                if (answersMap[q] === questionsForScale[q]) score++;
            });
            rawScores[scaleName] = score;
        });

        // Opsiyonel debug: URL ?debug=1 ise konsola kısa özet yaz
        try {
            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.get('debug') === '1') {
                console.log('[MMPI Debug] Özet ham puanlar:', rawScores);
            }
        } catch (_) { /* noop */ }

        // Cinsiyet normalizasyonu
        const genderRaw = ((participant?.gender) || '').toString().toLowerCase();
        const gender = genderRaw === 'male' || genderRaw === 'erkek' ? 'male' : genderRaw === 'female' || genderRaw === 'kadın' || genderRaw === 'kadin' ? 'female' : 'male';

        // Mf birleşimi
        if (gender === 'male' && rawScores['Mf_Male'] !== undefined) {
            rawScores['Mf'] = rawScores['Mf_Male'];
            delete rawScores['Mf_Male'];
            delete rawScores['Mf_Female'];
        } else if (gender === 'female' && rawScores['Mf_Female'] !== undefined) {
            rawScores['Mf'] = rawScores['Mf_Female'];
            delete rawScores['Mf_Male'];
            delete rawScores['Mf_Female'];
        }

        // Parametreleri (M, SD, k_correction) t_score_params tablosundan al
        const paramsByScale = await fetchTScoreParams(gender);

        // K düzeltmesi: tablodaki k_correction oranına göre uygula
        const kScore = rawScores['K'] || 0;
        const kCorrected = { ...rawScores };
        Object.keys(kCorrected).forEach(scale => {
            const p = paramsByScale[scale];
            if (!p) return;
            const kCoef = Number(p.k_correction || 0);
            if (kCoef !== 0) {
                // K düzeltmesini en yakın tam sayıya yuvarlayarak ekle
                kCorrected[scale] = kCorrected[scale] + Math.round(kScore * kCoef);
            }
        });

        // T-skorları: T = 50 + 10 * (HamPuanKcorr - M) / SD  (1 ondalık basamak)
        const tScores = {};
        Object.keys(kCorrected).forEach(scale => {
            const p = paramsByScale[scale];
            if (p && p.sd && Number(p.sd) !== 0) {
                const rs = kCorrected[scale];
                const mean = Number(p.mean_m);
                const sd = Number(p.sd);
                const t = 50 + (10 * (rs - mean)) / sd;
                tScores[scale] = Math.round(t);
            } else {
                // Parametre bulunamazsa eski basit dönüşüm (geçici güvenli geri dönüş)
                const rs = kCorrected[scale];
                let t = 50;
                if (['L', 'F', 'K'].includes(scale)) t = 50 + (rs - 5) * 10;
                else t = 50 + (rs - 15) * 2;
                tScores[scale] = Math.round(t);
            }
        });

        // Yorumlar
        const interpretations = {};
        Object.keys(tScores).forEach(scale => {
            const s = tScores[scale];
            interpretations[scale] = s >= 65 ? 'Yüksek - Klinik olarak anlamlı' : s >= 60 ? 'Orta-Yüksek - Dikkat edilmesi gereken' : s >= 40 ? 'Normal aralık' : 'Düşük';
        });

        // Geçerlilik
        const validityAssessment = { isValid: true, warnings: [] };
        if (tScores['L'] > 70) validityAssessment.warnings.push('L ölçeği yüksek - Aşırı sosyal istenirlik');
        if (tScores['F'] > 80) { validityAssessment.warnings.push('F ölçeği çok yüksek - Profil geçersiz olabilir'); validityAssessment.isValid = false; }
        else if (tScores['F'] > 70) validityAssessment.warnings.push('F ölçeği yüksek - Dikkatli yorumlama gerekli');
        if (tScores['K'] > 70) validityAssessment.warnings.push('K ölçeği yüksek - Savunuculuk');

        // Özet
        const clinical = ['Hs','D','Hy','Pd','Mf','Pa','Pt','Sc','Ma','Si'];
        const elevated = clinical.filter(sc => tScores[sc] >= 65).sort((a,b)=>tScores[b]-tScores[a]);
        const scaleNames = { Hs:'Hipokondriazis', D:'Depresyon', Hy:'Histeri', Pd:'Psikopati', Mf:'Maskülinite-Femininite', Pa:'Paranoya', Pt:'Psikasteni', Sc:'Şizofreni', Ma:'Hipomani', Si:'Sosyal İçedönüklük' };
        const summary = elevated.length === 0 ? 'MMPI profili normal sınırlar içerisindedir. Klinik olarak anlamlı yükselme gözlenmemektedir.' : `MMPI profilinde ${elevated.map(s=>scaleNames[s]||s).join(', ')} ölçek(ler)inde klinik olarak anlamlı yükselme gözlenmektedir.`;

        // Öneriler
        const recommendations = [];
        if (elevated.length === 0) recommendations.push('Rutin psikolojik takip önerilir.');
        if (tScores['D'] >= 70) recommendations.push('Depresyon belirtileri açısından detaylı değerlendirme önerilir.');
        if (tScores['Pt'] >= 70) recommendations.push('Anksiyete bozuklukları açısından değerlendirme önerilir.');
        if (tScores['Sc'] >= 70) recommendations.push('Psikotik belirtiler açısından acil değerlendirme gerekebilir.');
        if (recommendations.length === 0) recommendations.push('Psikolojik destek ve takip önerilir.');
        recommendations.push('Sonuçlar klinik görüşme ile desteklenmelidir.');

        return { rawScores, tScores, interpretations, validityAssessment, summary, recommendations };
    } catch (e) {
        console.error('Skorlar hesaplanamadı:', e);
        return null;
    }
}

// T parametrelerini getir: t_score_params (M, SD, k_correction)
async function fetchTScoreParams(gender) {
    const { testVersion, locale, ageGroup } = NORM_DEFAULTS;
    const { data, error } = await supabase
        .from('t_score_params')
        .select('scale_name, mean_m, sd, k_correction')
        .eq('test_version', testVersion)
        .eq('locale', locale)
        .eq('gender', gender)
        .eq('age_group', ageGroup);
    if (error) throw error;
    const map = {};
    (data || []).forEach(row => { map[row.scale_name] = row; });
    return map;
}

// K ham puan ve düzeltme oranlarını göster
function displayKAdjustments(rawScores = {}, tScores = {}) {
    const k = rawScores['K'] || 0;
    const section = document.getElementById('kRatiosSection');
    if (!section) return;
    document.getElementById('kRawValue').textContent = k;
    document.getElementById('k05Cell').textContent = Math.round(k * 0.5);
    document.getElementById('k04Cell').textContent = Math.round(k * 0.4);
    document.getElementById('k10Cell').textContent = Math.round(k * 1.0);
    document.getElementById('k02Cell').textContent = Math.round(k * 0.2);
    document.getElementById('kSourceNote').textContent = 'Not: K düzeltmesi klinik ölçeklerde yaygın kullanılan katsayılara göre hesaplanmıştır (Hs:+0.5K, Pd:+0.4K, Pt:+1.0K, Sc:+1.0K, Ma:+0.2K).';
    section.style.display = 'block';
}

// Psikolog Değerlendirmesi Fonksiyonları

// Psikolog değerlendirmesi alanlarını başlat
function initializePsychologistEvaluation() {
    // Bugünün tarihini varsayılan olarak ayarla
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('evaluationDate').value = today;

    // Katılımcı bilgilerini otomatik doldur
    if (reportData && reportData.participant) {
        const participant = reportData.participant;
        // Psikolog adı için varsayılan değer (daha sonra kullanıcı tarafından değiştirilebilir)
        document.getElementById('psychologistName').value = 'Psk. Selma Oğultürk';
    }

    // Kaydet butonuna event listener ekle
    document.getElementById('savePsychologistEvaluation').addEventListener('click', savePsychologistEvaluation);

    // PDP bölümü toggle event listener
    document.getElementById('togglePdpSection').addEventListener('click', togglePdpSection);

    // PDP checkbox'larına event listener ekle
    document.addEventListener('change', function(e) {
        if (e.target.type === 'checkbox' && e.target.closest('#pdpParametersSection')) {
            // Sayfa pozisyonunu kaydet
            const scrollPosition = window.scrollY || window.pageYOffset;
            
            updatePdpResultMessage();
            
            // Sayfa pozisyonunu koru
            window.scrollTo(0, scrollPosition);
        }
    });

    // Görev tanımları buton event listener'larını ekle
    document.addEventListener('click', function(e) {
        if (e.target.closest('.task-btn-check') || e.target.closest('.task-btn-cross')) {
            handleTaskButtonClick(e);
        }
    });

    // Ek değerlendirme notu input'una event listener ekle
    const additionalNoteElement = document.getElementById('additionalNote');
    if (additionalNoteElement) {
        additionalNoteElement.addEventListener('input', function() {
            checkAdditionalNoteVisibility();
        });
    }

    // Mevcut psikolog değerlendirmesini yükle
    loadPsychologistEvaluation();

    // İlk yüklemede PDP sonuç mesajını göster
    // Sayfa pozisyonunu kaydet
    const scrollPosition = window.scrollY || window.pageYOffset;
    updatePdpResultMessage();
    // Sayfa pozisyonunu koru
    window.scrollTo(0, scrollPosition);

}

// Görev tanımları buton tıklama işleyicisi
function handleTaskButtonClick(e) {
    const button = e.target.closest('button');
    if (!button) return;

    const taskId = button.getAttribute('data-task');
    const isCheckButton = button.classList.contains('task-btn-check');
    const isCrossButton = button.classList.contains('task-btn-cross');

    if (!taskId) return;

    const checkBtn = document.getElementById(`task_${taskId}_check`);
    const crossBtn = document.getElementById(`task_${taskId}_cross`);
    const resultSpan = document.getElementById(`result_${taskId}`);
    const row = button.closest('tr');

    if (!checkBtn || !crossBtn || !resultSpan || !row) return;

    // Mevcut durumu kontrol et
    const isCheckActive = checkBtn.classList.contains('btn-success');
    const isCrossActive = crossBtn.classList.contains('btn-danger');

    // Önce tüm butonları sıfırla
    checkBtn.classList.remove('btn-success');
    checkBtn.classList.add('btn-outline-success');
    crossBtn.classList.remove('btn-danger');
    crossBtn.classList.add('btn-outline-danger');

    if (isCheckButton) {
        if (!isCheckActive) {
            // Tik butonunu aktif yap
            checkBtn.classList.remove('btn-outline-success');
            checkBtn.classList.add('btn-success');
            updateTaskResult(taskId, true);
        } else {
            // Seçimi iptal et (tik butonuna tekrar tıklandı)
            updateTaskResult(taskId, null);
        }
    } else if (isCrossButton) {
        if (!isCrossActive) {
            // Çarpı butonunu aktif yap
            crossBtn.classList.remove('btn-outline-danger');
            crossBtn.classList.add('btn-danger');
            updateTaskResult(taskId, false);
        } else {
            // Seçimi iptal et (çarpı butonuna tekrar tıklandı)
            updateTaskResult(taskId, null);
        }
    }
}

// Görev sonuç güncellemesi
function updateTaskResult(taskId, value) {
    const resultSpan = document.getElementById(`result_${taskId}`);
    const row = document.getElementById(`task_${taskId}_check`)?.closest('tr');

    if (!resultSpan || !row) return;

    if (value === true) {
        // Uygun
        resultSpan.textContent = '✓';
        resultSpan.style.color = '#28a745';
        resultSpan.style.fontWeight = 'bold';
        resultSpan.setAttribute('data-value', 'true');
        resultSpan.classList.remove('empty');
        resultSpan.classList.remove('d-none');
        row.classList.remove('no-print'); // PDF'te görünsün
        row.classList.remove('task-row-empty'); // Sınıfı temizle
    } else if (value === false) {
        // Uygun değil
        resultSpan.textContent = '✗';
        resultSpan.style.color = '#dc3545';
        resultSpan.style.fontWeight = 'bold';
        resultSpan.setAttribute('data-value', 'false');
        resultSpan.classList.remove('empty');
        resultSpan.classList.remove('d-none');
        row.classList.remove('no-print'); // PDF'te görünsün
        row.classList.remove('task-row-empty'); // Sınıfı temizle
    } else {
        // Boş durum
        resultSpan.textContent = '—';
        resultSpan.style.color = '#6c757d';
        resultSpan.style.fontWeight = 'normal';
        resultSpan.removeAttribute('data-value');
        resultSpan.classList.add('empty');
        resultSpan.classList.add('d-none'); // Web'de gizle
        row.classList.add('no-print'); // PDF'te gizle
        row.classList.add('task-row-empty'); // Ek browser uyumluluğu
    }

    // Veri durumunu güncelle
    setTaskData(taskId, value);

    // Buton animasyonu
    addButtonFeedback(taskId, value);
}

// Buton feedback animasyonu
function addButtonFeedback(taskId, value) {
    const checkBtn = document.getElementById(`task_${taskId}_check`);
    const crossBtn = document.getElementById(`task_${taskId}_cross`);

    if (!checkBtn || !crossBtn) return;

    // Animasyon sınıfını ekle
    const activeBtn = value === true ? checkBtn : value === false ? crossBtn : null;

    if (activeBtn) {
        activeBtn.style.transform = 'scale(0.9)';
        setTimeout(() => {
            activeBtn.style.transform = '';
        }, 150);
    }
}

// Görev veri durumunu kaydet
let taskDataState = {};

function setTaskData(taskId, value) {
    taskDataState[`task_${taskId}`] = value;
}

function getTaskData(taskId) {
    return taskDataState[`task_${taskId}`];
}


// Psikolog değerlendirmesini kaydet
async function savePsychologistEvaluation() {
    try {
        const button = document.getElementById('savePsychologistEvaluation');
        const originalText = button.innerHTML;

        // Yükleme göstergesi
        button.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Kaydediliyor...';
        button.disabled = true;

        // Form verilerini al
        const psychologistData = {
            psychologist_name: document.getElementById('psychologistName')?.value || '',
            evaluation_date: document.getElementById('evaluationDate')?.value || '',
            participation: document.getElementById('participationAssessment')?.value || '',
            validity: document.getElementById('validityAssessment')?.value || '',
            additional_evaluation_note: document.getElementById('additionalNote')?.value || '',
            pdp_results: getPdpParametersData(),
            task_definitions_evaluation: getTaskDefinitionsData(),
            evaluation_process: document.getElementById('evaluationProcess')?.value || '',
            measurement_process: document.getElementById('measurementProcess')?.value || '',
            competency_evaluation: getCompetencyEvaluationData(),
            session_need_status: document.getElementById('sessionNeedAssessment')?.value || '',
            session_explanation: document.getElementById('sessionNeedAssessment')?.value || '',
            data_usage_recommendations: document.getElementById('dataUsageRecommendations')?.value || ''
        };

        // Özet ve rapor verilerini al
        const summaryData = {
            validity_scales_summary: document.getElementById('validityScalesSummary')?.value || '',
            psychologist_notes_summary: document.getElementById('psychologistNotesSummary')?.value || ''
        };

        const resultData = {
            clinical_scales_result: document.getElementById('clinicalScalesResult')?.value || '',
            general_evaluation: document.getElementById('generalEvaluation')?.value || '',
            conclusion_recommendations: document.getElementById('conclusionRecommendations')?.value || ''
        };

        // Mevcut rapor içeriğini al ve güncellenmiş verileri ekle
        const currentReportContent = reportData.report;
        const updatedReportContent = {
            ...currentReportContent,
            summary_data: summaryData,
            result_data: resultData
        };

        // Supabase'e yeni alanları kullanarak kaydet
        const { data, error } = await supabase
            .from('reports')
            .update({
                psychologist_name: psychologistData.psychologist_name,
                evaluation_date: psychologistData.evaluation_date,
                participation: psychologistData.participation,
                validity: psychologistData.validity,
                additional_evaluation_note: psychologistData.additional_evaluation_note,
                pdp_results: psychologistData.pdp_results,
                task_definitions_evaluation: psychologistData.task_definitions_evaluation,
                evaluation_process: psychologistData.evaluation_process,
                measurement_process: psychologistData.measurement_process,
                competency_evaluation: psychologistData.competency_evaluation,
                session_need_status: psychologistData.session_need_status,
                session_explanation: psychologistData.session_explanation,
                data_usage_recommendations: psychologistData.data_usage_recommendations,
                report_content: updatedReportContent,
                updated: new Date().toISOString()
            })
            .eq('id', reportData.report.id);

        if (error) {
            throw error;
        }

        // Başarı mesajı
        showSuccessMessage('Psikolog değerlendirmesi başarıyla kaydedildi.');

        // Rapor verisini güncelle
        Object.assign(reportData.report, psychologistData);
        reportData.report = updatedReportContent;

    } catch (error) {
        console.error('Psikolog değerlendirmesi kaydedilirken hata:', error);
        showErrorMessage('Psikolog değerlendirmesi kaydedilirken bir hata oluştu.');
    } finally {
        // Butonu eski haline getir
        const button = document.getElementById('savePsychologistEvaluation');
        button.innerHTML = '<i class="fas fa-save me-2"></i>Tüm Değerlendirmeyi Kaydet';
        button.disabled = false;
    }
}

// Mevcut psikolog değerlendirmesini yükle
function loadPsychologistEvaluation() {
    if (reportData && reportData.report) {
        const report = reportData.report;

        // Form alanlarını doldur
        if (report.psychologist_name) {
            const element = document.getElementById('psychologistName');
            if (element) element.value = report.psychologist_name;
        }

        if (report.evaluation_date) {
            const element = document.getElementById('evaluationDate');
            if (element) element.value = report.evaluation_date.split('T')[0];
        }

        const participationElement = document.getElementById('participationAssessment');
        if (participationElement) {
            participationElement.value = report.participation || 'Psikolojik değerlendirme programı kapsamında yapılan görüşmede kişinin iletişime katılımcı olduğu gözlemlenmiştir.';
            if (participationElement.classList.contains('auto-resize-textarea')) {
                autoResizeTextarea(participationElement);
            }
        }

        const validityElement = document.getElementById('validityAssessment');
        if (validityElement) {
            validityElement.value = report.validity || 'Uygulanmış olan testin sonucu geçerlidir. Sonuçlar yapılan klinik görüşme ve gözlem ile uyumlu bulunmuştur.';
            if (validityElement.classList.contains('auto-resize-textarea')) {
                autoResizeTextarea(validityElement);
            }
        }

        if (report.summary) {
            const element = document.getElementById('psychologistEvaluationText');
            if (element) {
                element.value = report.summary;
                if (element.classList.contains('auto-resize-textarea')) {
                    autoResizeTextarea(element);
                }
            }
        }

        if (report.additional_evaluation_note) {
            const element = document.getElementById('additionalNote');
            if (element) {
                element.value = report.additional_evaluation_note;
                if (element.classList.contains('auto-resize-textarea')) {
                    autoResizeTextarea(element);
                }
            }
        }

        const evaluationProcessElement = document.getElementById('evaluationProcess');
        if (evaluationProcessElement) {
            evaluationProcessElement.value = report.evaluation_process || 'Bu bölüm, değerlendirme sürecini tanımlar, performansınızın nasıl ölçüldüğünü açıklar ve değerlendirme sonuçlarınızı nasıl yorumlayıp kullanabileceğinizle ilgili size yön gösterir.';
            if (evaluationProcessElement.classList.contains('auto-resize-textarea')) {
                autoResizeTextarea(evaluationProcessElement);
            }
        }

        const measurementProcessElement = document.getElementById('measurementProcess');
        if (measurementProcessElement) {
            measurementProcessElement.value = report.measurement_process || 'Psikolojik değerlendirme programı uzman klinik psikologlar tarafından yapılan ön görüşmeler, testler ve klinik değerlendirmeleri içermektedir. Burada amaç; mevcut ya da seçim aşamasındaki personelin psikolojik durumunun, kişilik özelliklerinin, iyi oluş halinin desteklenmesini, psikolojik sağlamlığının değerlendirilmesini, raporlanmasını ve bu raporların da kurum ile paylaşılmasını içerir. Aynı zamanda, PDP rapor analizleri ile kişisel psikolojik skala ve iş skalası sonucuna göre personelin eğitim ihtiyaçları, yetkinlik ve görev uygunlukları da ortaya çıkmakta, bu bulgular ışığında; doğru adayın belirlenmesi ve mevcut personelin ihtiyaçlarının doğru analiz edilmesini hedeflemektedir.';
            if (measurementProcessElement.classList.contains('auto-resize-textarea')) {
                autoResizeTextarea(measurementProcessElement);
            }
        }

        const sessionNeedAssessmentElement = document.getElementById('sessionNeedAssessment');
        if (sessionNeedAssessmentElement) {
            sessionNeedAssessmentElement.value = report.session_need_status || 'Birey psikoterapiden; kişiye psikopatolojik bulguya rastlanılmaması, duygu- durum yapılanması, stres noktalarının tespiti, tükenmişlik ( iş bazlı )  olup olmadığını belirlemek, motivasyon kısmını detaylandırabilmek ( iş -yaşam ) ve sözelleştirmek istediği alanları tespit edebilmek adına 4 seans planlanmıştır.';
            if (sessionNeedAssessmentElement.classList.contains('auto-resize-textarea')) {
                autoResizeTextarea(sessionNeedAssessmentElement);
            }
        }

        // Veri kullanımına dair önerileri yükle
        const dataUsageRecommendationsElement = document.getElementById('dataUsageRecommendations');
        if (dataUsageRecommendationsElement) {
            dataUsageRecommendationsElement.value = report.data_usage_recommendations || 'Veri Kullanımına Dair Öneriler: Kurumun ve kişinin değişimi olasılığı sebebiyle, bu rapordaki verilerin değerlendirme tarihinden itibaren iki yıl süresince kullanılmasını önermektedir. Bu önerimiz, Değerlendirme Merkezi Operasyonları Prensipleri ve Etiği ve Uluslararası Değerlendirme Merkezi Prensipleri (2009) ile uyumludur.';
            if (dataUsageRecommendationsElement.classList.contains('auto-resize-textarea')) {
                autoResizeTextarea(dataUsageRecommendationsElement);
            }
        }

        // PDP sonuçlarını yükle
        if (report.pdp_results) {
            loadPdpParametersData(report.pdp_results);
        }

        // Görev tanımları değerlendirmesini yükle
        if (report.task_definitions_evaluation) {
            loadTaskDefinitionsData(report.task_definitions_evaluation);
        }

        // Yetkinlik değerlendirmesini yükle
        if (report.competency_evaluation) {
            loadCompetencyEvaluationData(report.competency_evaluation);
        }

        // İlk yüklemede PDP sonuç mesajını kontrol et
        updatePdpResultMessage();

        // İlk yüklemede PDP sonuç mesajını kontrol et
        updatePdpResultMessage();

        // Ek değerlendirme notu görünürlüğünü kontrol et
        checkAdditionalNoteVisibility();
    }
}

// PDP bölümünü göster/gizle
function togglePdpSection() {
    // Sayfa pozisyonunu kaydet
    const scrollPosition = window.scrollY || window.pageYOffset;
    
    const section = document.getElementById('pdpParametersSection');
    const icon = document.getElementById('pdpToggleIcon');

    if (section.style.display === 'none') {
        section.style.display = 'block';
        icon.className = 'fas fa-eye-slash';
        updatePdpResultMessage(); // PDP bölümü açıldığında mesajı güncelle
    } else {
        section.style.display = 'none';
        icon.className = 'fas fa-eye';
    }
    
    // Sayfa pozisyonunu koru
    window.scrollTo(0, scrollPosition);
}

// PDP sonuç mesajını güncelle
function updatePdpResultMessage() {
    // Sayfa pozisyonunu kaydet
    const scrollPosition = window.scrollY || window.pageYOffset;
    
    const checkboxes = document.querySelectorAll('#pdpParametersSection input[type="checkbox"]');
    const checkedBoxes = Array.from(checkboxes).filter(cb => cb.checked);
    const resultMessage = document.getElementById('pdpResultMessage');
    const resultText = document.getElementById('pdpResultText');
    const resultAlert = document.getElementById('pdpResultAlert');

    if (resultMessage && resultText && resultAlert) {
        if (checkedBoxes.length > 0) {
            resultText.textContent = 'Psikopatolojik bulguya rastlanılmıştır.';
            resultAlert.className = 'alert alert-danger';
        } else {
            resultText.textContent = 'Psikopatolojik bulguya rastlanılmamıştır.';
            resultAlert.className = 'alert alert-success';
        }
        resultMessage.style.display = 'block';
    }
    
    // Sayfa pozisyonunu koru
    window.scrollTo(0, scrollPosition);
}

// PDP parametrelerini topla
function getPdpParametersData() {
    const pdpData = {};
    const checkboxes = document.querySelectorAll('#pdpParametersSection input[type="checkbox"]');

    checkboxes.forEach(checkbox => {
        pdpData[checkbox.id] = checkbox.checked;
    });

    return pdpData;
}

// Görev tanımları değerlendirmesi verilerini al
function getTaskDefinitionsData() {
    // Use dynamic task definitions loader if available
    if (window.taskDefinitionsLoader) {
        return window.taskDefinitionsLoader.getTaskEvaluationData();
    }

    // Fallback to static method
    const taskData = {};

    // Görev tanımları buton durumlarını topla
    for (let i = 1; i <= 43; i++) {
        const checkBtn = document.getElementById(`task_${i}_check`);
        const crossBtn = document.getElementById(`task_${i}_cross`);

        if (checkBtn && crossBtn) {
            if (checkBtn.classList.contains('btn-success')) {
                taskData[`task_${i}`] = true;
            } else if (crossBtn.classList.contains('btn-danger')) {
                taskData[`task_${i}`] = false;
            } else {
                taskData[`task_${i}`] = null;
            }
        }
    }

    return taskData;
}

// Yetkinlik değerlendirmesi verilerini al
function getCompetencyEvaluationData() {
    const competencyData = {
        psychological_scale: {},
        work_scale: {}
    };

    // Psikolojik skala puanlarını topla
    const psychScaleInputs = document.querySelectorAll('input[id^="psych_scale_"]');
    psychScaleInputs.forEach(input => {
        const scaleId = input.id.replace('psych_scale_', '');
        competencyData.psychological_scale[scaleId] = input.value || '';
    });

    // İş skalası puanlarını topla
    const workScaleInputs = document.querySelectorAll('input[id^="work_scale_"]');
    workScaleInputs.forEach(input => {
        const scaleId = input.id.replace('work_scale_', '');
        competencyData.work_scale[scaleId] = input.value || '';
    });

    return competencyData;
}

// PDP parametrelerini yükle
function loadPdpParametersData(data) {
    if (!data) return;

    // Sayfa pozisyonunu kaydet
    const scrollPosition = window.scrollY || window.pageYOffset;

    // PDP parametrelerini yükle
    Object.keys(data).forEach(checkboxId => {
        const checkbox = document.getElementById(checkboxId);
        if (checkbox) {
            checkbox.checked = data[checkboxId];

            // Checkbox değişikliğini tetikle
            const event = new Event('change', { bubbles: true });
            checkbox.dispatchEvent(event);
        }
    });

    // PDP sonuç mesajını güncelle
    updatePdpResultMessage();
    
    // Sayfa pozisyonunu koru
    window.scrollTo(0, scrollPosition);
}

// Görev tanımları değerlendirmesi verilerini yükle
function loadTaskDefinitionsData(data) {
    if (!data) return;

    // Use dynamic task definitions loader if available
    if (window.taskDefinitionsLoader) {
        window.taskDefinitionsLoader.loadTaskEvaluationData(data);
        return;
    }

    // Fallback to static method
    // Görev tanımları buton durumlarını yükle
    Object.keys(data).forEach(taskId => {
        const taskNumber = taskId.replace('task_', '');
        const checkBtn = document.getElementById(`task_${taskNumber}_check`);
        const crossBtn = document.getElementById(`task_${taskNumber}_cross`);

        if (checkBtn && crossBtn) {
            // Önce tüm butonları sıfırla
            checkBtn.classList.remove('btn-success');
            checkBtn.classList.add('btn-outline-success');
            crossBtn.classList.remove('btn-danger');
            crossBtn.classList.add('btn-outline-danger');

            const value = data[taskId];

            if (value === true) {
                // Tik butonunu aktif yap
                checkBtn.classList.remove('btn-outline-success');
                checkBtn.classList.add('btn-success');
            } else if (value === false) {
                // Çarpı butonunu aktif yap
                crossBtn.classList.remove('btn-outline-danger');
                crossBtn.classList.add('btn-danger');
            }

            // Sonuç gösterimini güncelle
            updateTaskResult(taskNumber, value);
        }
    });
}

// Yetkinlik değerlendirmesi verilerini yükle
function loadCompetencyEvaluationData(data) {
    if (!data) return;

    // Psikolojik skala puanlarını yükle
    if (data.psychological_scale) {
        Object.keys(data.psychological_scale).forEach(scaleId => {
            const input = document.getElementById(`psych_scale_${scaleId}`);
            if (input) {
                input.value = data.psychological_scale[scaleId];
            }
        });
    }

    // İş skalası puanlarını yükle
    if (data.work_scale) {
        Object.keys(data.work_scale).forEach(scaleId => {
            const input = document.getElementById(`work_scale_${scaleId}`);
            if (input) {
                input.value = data.work_scale[scaleId];
            }
        });
    }

    // Veriler yüklendikten sonra toplam hesaplamaları güncelle
    setTimeout(() => {
        calculatePsychologicalTotal();
        calculateWorkTotal();
    }, 100);
}

// Başarı mesajı göster
function showSuccessMessage(message) {
    // Mevcut alert'leri temizle
    const existingAlerts = document.querySelectorAll('.alert-success');
    existingAlerts.forEach(alert => alert.remove());

    // Yeni başarı mesajı oluştur
    const alertDiv = document.createElement('div');
    alertDiv.className = 'alert alert-success alert-dismissible fade show';
    alertDiv.innerHTML = `
        <i class="fas fa-check-circle me-2"></i>${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;

    // Psikolog değerlendirmesi kartının üstüne ekle
    const psychEvalCard = document.querySelector('.card:has(#psychologistName)');
    if (psychEvalCard) {
        psychEvalCard.parentNode.insertBefore(alertDiv, psychEvalCard);
    }

    // 5 saniye sonra otomatik kaldır
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.remove();
        }
    }, 5000);
}

// Hata mesajı göster
function showErrorMessage(message) {
    // Mevcut alert'leri temizle
    const existingAlerts = document.querySelectorAll('.alert-danger');
    existingAlerts.forEach(alert => alert.remove());

    // Yeni hata mesajı oluştur
    const alertDiv = document.createElement('div');
    alertDiv.className = 'alert alert-danger alert-dismissible fade show';
    alertDiv.innerHTML = `
        <i class="fas fa-exclamation-circle me-2"></i>${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;

    // Psikolog değerlendirmesi kartının üstüne ekle
    const psychEvalCard = document.querySelector('.card:has(#psychologistName)');
    if (psychEvalCard) {
        psychEvalCard.parentNode.insertBefore(alertDiv, psychEvalCard);
    }

    // 8 saniye sonra otomatik kaldır
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.remove();
        }
    }, 8000);
}

// Özet ve Rapor Sonucu alanlarını başlat
function initializeSummaryAndResult() {
    // Özet kaydet butonu event listener
    const saveSummaryBtn = document.getElementById('saveSummary');
    if (saveSummaryBtn) {
        saveSummaryBtn.addEventListener('click', saveSummary);
    }

    // Rapor sonucu kaydet butonu event listener
    const saveResultBtn = document.getElementById('saveReportResult');
    if (saveResultBtn) {
        saveResultBtn.addEventListener('click', saveReportResult);
    }

    // Mevcut verileri yükle
    loadSummaryAndResult();

    // Otomatik değerlendirmeleri oluştur
    generateAutomaticEvaluations();
}

// Özet kaydet
async function saveSummary() {
    try {
        const button = document.getElementById('saveSummary');
        const originalText = button.innerHTML;

        // Yükleme göstergesi
        button.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Kaydediliyor...';
        button.disabled = true;

        // Form verilerini al
        const summaryData = {
            validity_scales_summary: document.getElementById('validityScalesSummary').value,
            psychologist_notes_summary: document.getElementById('psychologistNotesSummary').value
        };

        // Mevcut rapor içeriğini al ve özet verilerini ekle
        const currentReportContent = reportData.report;
        const updatedReportContent = {
            ...currentReportContent,
            summary_data: summaryData
        };

        // Supabase'e kaydet
        const { data, error } = await supabase
            .from('reports')
            .update({
                report_content: updatedReportContent,
                updated: new Date().toISOString()
            })
            .eq('id', reportData.report.id);

        if (error) {
            throw error;
        }

        // Başarı mesajı
        showSuccessMessage('Özet başarıyla kaydedildi.');

        // Rapor verilerini güncelle
        reportData.report = updatedReportContent;

    } catch (error) {
        console.error('Özet kaydedilirken hata:', error);
        showErrorMessage('Özet kaydedilirken hata oluştu: ' + error.message);
    } finally {
        // Butonu eski haline getir
        const button = document.getElementById('saveSummary');
        button.innerHTML = '<i class="fas fa-save me-2"></i>Özet Kaydet';
        button.disabled = false;
    }
}

// Rapor sonucu kaydet
async function saveReportResult() {
    try {
        const button = document.getElementById('saveReportResult');
        const originalText = button.innerHTML;

        // Yükleme göstergesi
        button.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Kaydediliyor...';
        button.disabled = true;

        // Form verilerini al
        const resultData = {
            clinical_scales_result: document.getElementById('clinicalScalesResult').value,
            general_evaluation: document.getElementById('generalEvaluation').value,
            conclusion_recommendations: document.getElementById('conclusionRecommendations').value
        };

        // Mevcut rapor içeriğini al ve sonuç verilerini ekle
        const currentReportContent = reportData.report;
        const updatedReportContent = {
            ...currentReportContent,
            result_data: resultData
        };

        // Supabase'e kaydet
        const { data, error } = await supabase
            .from('reports')
            .update({
                report_content: updatedReportContent,
                updated: new Date().toISOString()
            })
            .eq('id', reportData.report.id);

        if (error) {
            throw error;
        }

        // Başarı mesajı
        showSuccessMessage('Rapor sonucu başarıyla kaydedildi.');

        // Rapor verilerini güncelle
        reportData.report = updatedReportContent;

    } catch (error) {
        console.error('Rapor sonucu kaydedilirken hata:', error);
        showErrorMessage('Rapor sonucu kaydedilirken hata oluştu: ' + error.message);
    } finally {
        // Butonu eski haline getir
        const button = document.getElementById('saveReportResult');
        button.innerHTML = '<i class="fas fa-save me-2"></i>Rapor Sonucu Kaydet';
        button.disabled = false;
    }
}

// Mevcut özet ve rapor sonucu verilerini yükle
function loadSummaryAndResult() {
    if (reportData && reportData.report) {
        // Özet verilerini yükle
        if (reportData.report.summary_data) {
            const summaryData = reportData.report.summary_data;

            const validityScalesSummary = document.getElementById('validityScalesSummary');
            if (validityScalesSummary && summaryData.validity_scales_summary) {
                validityScalesSummary.value = summaryData.validity_scales_summary;
                if (validityScalesSummary.classList.contains('auto-resize-textarea')) {
                    autoResizeTextarea(validityScalesSummary);
                }
            }

            const psychologistNotesSummary = document.getElementById('psychologistNotesSummary');
            if (psychologistNotesSummary && summaryData.psychologist_notes_summary) {
                psychologistNotesSummary.value = summaryData.psychologist_notes_summary;
                if (psychologistNotesSummary.classList.contains('auto-resize-textarea')) {
                    autoResizeTextarea(psychologistNotesSummary);
                }
            }
        }

        // Rapor sonucu verilerini yükle
        if (reportData.report.result_data) {
            const resultData = reportData.report.result_data;

            const clinicalScalesResult = document.getElementById('clinicalScalesResult');
            if (clinicalScalesResult && resultData.clinical_scales_result) {
                clinicalScalesResult.value = resultData.clinical_scales_result;
                if (clinicalScalesResult.classList.contains('auto-resize-textarea')) {
                    autoResizeTextarea(clinicalScalesResult);
                }
            }

            const generalEvaluation = document.getElementById('generalEvaluation');
            if (generalEvaluation && resultData.general_evaluation) {
                generalEvaluation.value = resultData.general_evaluation;
                if (generalEvaluation.classList.contains('auto-resize-textarea')) {
                    autoResizeTextarea(generalEvaluation);
                }
            }

            const conclusionRecommendations = document.getElementById('conclusionRecommendations');
            if (conclusionRecommendations && resultData.conclusion_recommendations) {
                conclusionRecommendations.value = resultData.conclusion_recommendations;
                if (conclusionRecommendations.classList.contains('auto-resize-textarea')) {
                    autoResizeTextarea(conclusionRecommendations);
                }
            }
        }
    }
}

// Otomatik değerlendirmeleri oluştur (T puanlarına göre)
async function generateAutomaticEvaluations() {
    if (!reportData || !reportData.report || !reportData.report.t_scores) {
        return;
    }

    try {
        const tScores = reportData.report.t_scores;
        const participant = reportData.participant;
        const gender = participant ? participant.gender : 'male';

        // Geçerlilik ölçekleri için otomatik değerlendirme
        let validityEvaluation = '';

        // L, F, K ölçekleri için mmpi_interpretations tablosundan değerlendirme al
        const validityScales = ['L', 'F', 'K'];

        for (const scale of validityScales) {
            const score = tScores[scale] || 0;
            const interpretation = await getInterpretationFromDatabase(scale, score, gender);
            if (interpretation) {
                validityEvaluation += `${scale} Ölçeği (T=${score}): ${interpretation}\n\n`;
            } else {
                validityEvaluation += `${scale} Ölçeği (T=${score}): Bu aralığa ilişkin özgün bir durum tanımlanmamıştır.\n\n`;
            }
        }

        // Klinik ölçekler için otomatik değerlendirme
        let clinicalEvaluation = '';

        // Klinik ölçeklerin değerlendirmesi
        const clinicalScales = ['Hs', 'D', 'Hy', 'Pd', 'Mf', 'Pa', 'Pt', 'Sc', 'Ma', 'Si'];

        for (const scale of clinicalScales) {
            const score = tScores[scale] || 0;
            const interpretation = await getInterpretationFromDatabase(scale, score, gender);
            if (interpretation) {
                clinicalEvaluation += `${scale} Ölçeği (T=${score}): ${interpretation}\n\n`;
            } else {
                clinicalEvaluation += `${scale} Ölçeği (T=${score}): Bu aralığa ilişkin özgün bir durum tanımlanmamıştır.\n\n`;
            }
        }

        // Alanları doldur (sadece boşsa)
        const validityScalesSummary = document.getElementById('validityScalesSummary');
        if (validityScalesSummary && !validityScalesSummary.value.trim()) {
            validityScalesSummary.value = validityEvaluation;
        }

        const clinicalScalesResult = document.getElementById('clinicalScalesResult');
        if (clinicalScalesResult && !clinicalScalesResult.value.trim()) {
            clinicalScalesResult.value = clinicalEvaluation;
        }

    } catch (error) {
        console.error('Otomatik değerlendirme oluşturulurken hata:', error);
    }
}

// mmpi_interpretations tablosundan değerlendirme al
async function getInterpretationFromDatabase(scale, tScore, gender = null) {
    try {
        let query = supabase
            .from('mmpi_interpretations')
            .select('description')
            .eq('scale_name', scale)
            .lte('min_t_score', tScore)
            .gte('max_t_score', tScore);

        // Mf ölçeği için cinsiyet filtresi ekle
        if (scale === 'Mf' && gender) {
            query = query.eq('gender', gender);
        }

        const { data, error } = await query.single();

        if (error) {
            console.error(`${scale} ölçeği için değerlendirme bulunamadı:`, error);
            return null;
        }

        return data.description;
    } catch (error) {
        console.error('Veritabanından değerlendirme alınırken hata:', error);
        return null;
    }
}

// Roboto fontunu PDF'e yükle
async function loadRobotoFont() {
    try {
        const response = await fetch('assets/fonts/Roboto-Regular.ttf');
        const arrayBuffer = await response.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        let binary = '';
        for (let i = 0; i < uint8Array.byteLength; i++) {
            binary += String.fromCharCode(uint8Array[i]);
        }
        return btoa(binary);
    } catch (error) {
        console.error('Roboto font yüklenemedi:', error);
        return null;
    }
}

// Roboto Bold fontunu PDF'e yükle
async function loadRobotoBoldFont() {
    try {
        const response = await fetch('assets/fonts/Roboto-Bold.ttf');
        const arrayBuffer = await response.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        let binary = '';
        for (let i = 0; i < uint8Array.byteLength; i++) {
            binary += String.fromCharCode(uint8Array[i]);
        }
        return btoa(binary);
    } catch (error) {
        console.error('Roboto Bold font yüklenemedi:', error);
        return null;
    }
}

// MMPI Profil Grafiğini PDF olarak indir
async function downloadMmpiProfilChartAsPDF() {
    try {
        const canvas = document.getElementById('profileChartForPdf');
        if (!canvas) {
            alert('Grafik bulunamadı!');
            return;
        }

        // Yeni canvas oluştur - yüksek çözünürlük için daha büyük boyutlarda
        const downloadCanvas = document.createElement('canvas');
        const scale = 3; // Çözünürlük çarpanı - daha net metin için
        downloadCanvas.width = canvas.width * scale;
        downloadCanvas.height = canvas.height * scale;

        const downloadCtx = downloadCanvas.getContext('2d');

        // Anti-aliasing ve metin kalitesi ayarları
        downloadCtx.imageSmoothingEnabled = true;
        downloadCtx.imageSmoothingQuality = 'high';
        downloadCtx.textRenderingOptimization = 'optimizeQuality';

        // Orijinal canvas'ı yüksek çözünürlükle çiz
        downloadCtx.drawImage(canvas, 0, 0, canvas.width, canvas.height, 0, 0, downloadCanvas.width,downloadCanvas.height);

        // Yeni canvas'ı image'e çevir
        const imgData = downloadCanvas.toDataURL('image/png', 1.0);

        // PDF oluştur - Türkçe karakter desteği için
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({
            orientation: 'landscape',
            unit: 'mm',
            format: 'a4',
            putOnlyUsedFonts: true,
            compress: true
        });

        // Roboto fontlarını yükle ve ekle
        const robotoBase64 = await loadRobotoFont();
        const robotoBoldBase64 = await loadRobotoBoldFont();

        if (robotoBase64) {
            pdf.addFileToVFS('Roboto-Regular.ttf', robotoBase64);
            pdf.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');
        }

        if (robotoBoldBase64) {
            pdf.addFileToVFS('Roboto-Bold.ttf', robotoBoldBase64);
            pdf.addFont('Roboto-Bold.ttf', 'Roboto', 'bold');
        }

        // Sayfa boyutları
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();

        // Grafik boyutları (kenar boşlukları ile) - sağ tarafa yer bırak
        const margin = 20;
        const rightMargin = 95; // Sağ tarafta katılımcı bilgileri için yer (daraltıldı)

        // Grafik oranı 1092/592 = 1.845
        const targetAspectRatio = 1092 / 592; // 1.845
        const availableWidth = pageWidth - margin - rightMargin;
        const maxHeight = 160; // Grafik yüksekliği artırıldı

        // Orana göre boyutları hesapla
        let imgWidth = availableWidth;
        let imgHeight = imgWidth / targetAspectRatio;

        // Eğer yükseklik çok fazla ise, yüksekliği sınırla ve genişliği ayarla
        if (imgHeight > maxHeight) {
            imgHeight = maxHeight;
            imgWidth = imgHeight * targetAspectRatio;
        }

        // Başlık ekle - Türkçe karakter desteği
        pdf.setFontSize(16);
        pdf.setFont(robotoBoldBase64 ? 'Roboto' : 'helvetica', 'bold');
        const title = 'MMPI Profil Grafiği';
        pdf.text(title, pageWidth / 2, 15, { align: 'center' });

        // Katılımcı bilgilerini sağ tarafa tablo formatında ekle
        if (reportData && reportData.participant) {
            const participant = reportData.participant;
            const testResult = reportData.testResult;

            // Türkçe karakter desteği - Roboto font ile artık gerek yok
            const replaceTurkishChars = (text) => {
                if (!text) return '-';
                return text.toString(); // Roboto font Türkçe karakterleri destekler
            };

            // Katılımcı bilgileri - istenen sırayla (tüm değerleri string'e çevir)
            const participantName = `${participant.first_name || ''} ${participant.last_name || ''}`.trim() || '-';
            const participantTcNo = String(participant.tc_no || '-');
            const profession = String(participant.profession || '-');
            const testDate = testResult && testResult.created ? new Date(testResult.created).toLocaleDateString('tr-TR') : '-';
            const education = String(participant.education || '-');
            const age = String(participant.age || '-');
            const maritalStatus = String(participant.marital_status || '-');

            // Sağ tarafta katılımcı bilgileri tablosu - grafik ile dikey ortalanmış
            const infoStartX = margin + imgWidth + 5;
            const tableWidth = 85; // Tablo genişliği azaltıldı

            // Grafik yüksekliği ve başlangıç pozisyonu
            const graphStartY = 35;
            const graphHeight = imgHeight;

            // Tek tablo boyutları (8 satır - Adı Soyadı ve TC No dahil)
            const rowHeight = 9;
            const totalRows = 8;
            const tableHeight = totalRows * rowHeight;

            // Dikey ortalama için başlangıç pozisyonu
            const tableStartY = graphStartY + (graphHeight - tableHeight) / 3;

            // Tek tablo - Adı Soyadı en üstte
            let currentY = tableStartY;

            pdf.setDrawColor(0, 0, 0);
            pdf.setFontSize(8);

            // Tablo verisi - Adı Soyadı en üstte
            const tableData = [
                ['Adı Soyadı', participantName],
                ['TC Kimlik No', participantTcNo],
                ['Meslek', profession],
                ['Uygulama Tarihi', testDate],
                ['Eğitim', education],
                ['Yaş', age],
                ['Medeni Durumu', maritalStatus],
                ['İstekte Bulunan', 'Psikolog']
            ];

            var gender = participant.gender === 'male' ? 'ERKEK' : 'KADIN';
            pdf.setFontSize(14);
            pdf.setFont(robotoBase64 ? 'Roboto' : 'helvetica', 'bold');
            pdf.text(gender, infoStartX + 30, currentY - 5);
            pdf.setFontSize(8);

            // Tek tablo dış kenarlığı
            pdf.rect(infoStartX, currentY, tableWidth, tableHeight);

            // Tablo satırları
            tableData.forEach((rowData, index) => {
                const rowY = currentY + (index * rowHeight);

                // Yatay çizgi (son satır hariç)
                if (index > 0) {
                    pdf.line(infoStartX, rowY, infoStartX + tableWidth, rowY);
                }

                // Dikey çizgi (ortada)
                pdf.line(infoStartX + 35, rowY, infoStartX + 35, rowY + rowHeight);

                // Etiket hücresi (gri arka plan)
                pdf.setFillColor(240, 240, 240);
                pdf.rect(infoStartX, rowY, 35, rowHeight, 'FD');

                // Metin ekle
                pdf.setFont(robotoBase64 ? 'Roboto' : 'helvetica', 'bold');
                pdf.setTextColor(0, 0, 0);
                pdf.text(rowData[0], infoStartX + 2, rowY + 6);

                pdf.setFont(robotoBase64 ? 'Roboto' : 'helvetica', 'normal');
                pdf.text(rowData[1], infoStartX + 37, rowY + 6);
            });
            
            // "Bilmiyorum" sayısı - tablonun altında
            const dontKnowY = currentY + tableHeight + 12; // Tablonun 12 punto altında
            // "Bilmiyorum" sayısı
            const dontKnowCount = typeof testResult.dont_know_count === 'number' ? testResult.dont_know_count :
                countDontKnowFromAnswers(testResult.test_answers);
            
            pdf.setFont(robotoBase64 ? 'Roboto' : 'helvetica', 'bold');
            pdf.setTextColor(0, 0, 0);
            pdf.setFontSize(12);

            pdf.text('"Bilmiyorum" Sayısı:', infoStartX, dontKnowY+15);


            pdf.setFont(robotoBase64 ? 'Roboto' : 'helvetica', 'normal');
            pdf.text(String(dontKnowCount), infoStartX + 40, dontKnowY+15);
        }

        // Grafiği ekle - katılımcı bilgileri ile aynı hizada
        const yPosition = 35;
        if (imgHeight + yPosition <= pageHeight - margin) {
            pdf.addImage(imgData, 'PNG', margin, yPosition, imgWidth, imgHeight);
        } else {
            // Grafik sayfa boyutundan büyükse, boyutunu ayarla
            const maxHeight = pageHeight - yPosition - margin;
            const adjustedWidth = (canvas.width * maxHeight) / canvas.height;
            const xPosition = (pageWidth - adjustedWidth) / 2;
            pdf.addImage(imgData, 'PNG', xPosition, yPosition, adjustedWidth, maxHeight);
        }

        // PDF'i indir - dosya adında Türkçe karakter problemi çözümü
        let fileName = 'MMPI_Profil';
        if (reportData && reportData.participant) {
            // Dosya adı için Türkçe karakterleri değiştir (dosya sistemi uyumluluğu için)
            const cleanName = (name) => {
                return name
                    .replace(/ğ/g, 'g')
                    .replace(/Ğ/g, 'G')
                    .replace(/ü/g, 'u')
                    .replace(/Ü/g, 'U')
                    .replace(/ş/g, 's')
                    .replace(/Ş/g, 'S')
                    .replace(/ı/g, 'i')
                    .replace(/İ/g, 'I')
                    .replace(/ö/g, 'o')
                    .replace(/Ö/g, 'O')
                    .replace(/ç/g, 'c')
                    .replace(/Ç/g, 'C');
            };

            const firstName = cleanName(reportData.participant.first_name || '');
            const lastName = cleanName(reportData.participant.last_name || '');
            const currentDate = new Date().toLocaleDateString('tr-TR');

            fileName = `MMPI_Profil_${firstName}_${lastName}_${currentDate.replace(/\./g, '_')}.pdf`;
        } else {
            const currentDate = new Date().toLocaleDateString('tr-TR');
            fileName = `MMPI_Profil_${currentDate.replace(/\./g, '_')}.pdf`;
        }

        pdf.save(fileName);

    } catch (error) {
        console.error('PDF oluşturulurken hata:', error);
        alert('PDF oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.');
    }
}

// Radio button seçildiğinde ilgili input alanına değer yazan fonksiyon
function updateScoreInput(radioName, scoreInputId, minValue, maxValue) {
    const selectedRadio = document.querySelector(`input[name="${radioName}"]:checked`);
    const scoreInput = document.getElementById(scoreInputId);

    if (selectedRadio && scoreInput) {
        // Radio button'un value'sunu al ve input alanına yaz
        const value = parseInt(selectedRadio.value);
        if (value >= minValue && value <= maxValue) {
            scoreInput.value = value;
        }
    }
}

// Tüm radio button'lar için event listener'ları ekle
function setupRadioButtonListeners() {
    // Yetkinlik adlarını input ID'lerine çeviren mapping
    const competencyIdMapping = {
        'stress_capacity': 'stress',
        'emotional_flexibility': 'emotional',
        'problem_solving': 'problem_solving',
        'self_esteem': 'self_esteem',
        'social_support': 'social_support',
        'positive_thinking': 'positive_thinking',
        'life_satisfaction': 'life_satisfaction',
        'adaptation': 'adaptation',
        'mental_health': 'mental_health',
        'motivation': 'motivation',
        'performance': 'performance',
        'safety': 'safety',
        'quality': 'quality',
        'teamwork': 'teamwork',
        'discipline': 'discipline',
        'representation': 'representation',
        'initiative': 'initiative',
        'learning': 'learning',
        'job_satisfaction': 'job_satisfaction',
        'workplace_rules': 'workplace_rules'
    };

    // Tüm yetkinlik maddeleri için genel mantık
    Object.keys(competencyIdMapping).forEach(competencyName => {
        const inputPrefix = competencyIdMapping[competencyName];
        const radios = document.querySelectorAll(`input[name="${competencyName}"]`);

        radios.forEach((radio, index) => {
            radio.addEventListener('change', function() {
                // İş Skalası alanları için work_scale_ prefix'ini kullan
                const isWorkScale = ['performance', 'safety', 'quality', 'teamwork', 'discipline', 'representation', 'initiative', 'learning','workplace_rules','job_satisfaction'].includes(competencyName) ||
                    inputPrefix.startsWith('work_scale_');
                const prefix = isWorkScale ? 'work_scale_' : 'psych_scale_';
                const actualInputPrefix = isWorkScale ? competencyName : inputPrefix;

                // Önce bu yetkinliğin tüm input alanlarını temizle ve readonly yap
                for (let i = 1; i <= 5; i++) {
                    const input = document.getElementById(`${prefix}${actualInputPrefix}_${i}`);
                    if (input) {
                        input.value = '';
                        input.readOnly = true;
                    }
                }

                // Sadece seçili olan radio button'un input alanına değer yaz ve düzenlenebilir yap
                if (this.checked) {
                    const scoreInputId = `${prefix}${actualInputPrefix}_${index + 1}`;
                    const scoreInput = document.getElementById(scoreInputId);
                    if (scoreInput) {
                        const value = parseInt(this.value);
                        const minValue = parseInt(scoreInput.getAttribute('min'));
                        const maxValue = parseInt(scoreInput.getAttribute('max'));
                        if (value >= minValue && value <= maxValue) {
                            scoreInput.value = value;
                            scoreInput.readOnly = false; // Bu input alanını düzenlenebilir yap
                            updateCompetencyTotal(actualInputPrefix); // Toplam alanını güncelle
                        }
                    }
                }
            });
        });
    });
}

// Yetkinlik seçimini temizle
function clearCompetencySelection(competencyName) {
    // Radio button'ları temizle
    const radios = document.querySelectorAll(`input[name="${competencyName}"]`);
    radios.forEach(radio => {
        radio.checked = false;
    });

    // Yetkinlik adlarını input ID'lerine çeviren mapping
    const competencyIdMapping = {
        'stress_capacity': 'stress',
        'emotional_flexibility': 'emotional',
        'problem_solving': 'problem_solving',
        'self_esteem': 'self_esteem',
        'social_support': 'social_support',
        'positive_thinking': 'positive_thinking',
        'life_satisfaction': 'life_satisfaction',
        'adaptation': 'adaptation',
        'mental_health': 'mental_health',
        'motivation': 'motivation',
        'performance': 'performance',
        'safety': 'safety',
        'quality': 'quality',
        'teamwork': 'teamwork',
        'discipline': 'discipline',
        'representation': 'representation',
        'initiative': 'initiative',
        'learning': 'learning',
        'job_satisfaction': 'job_satisfaction',
        'workplace_rules': 'workplace_rules'
    };

    // İlgili input alanlarını temizle ve readonly yap
    const inputPrefix = competencyIdMapping[competencyName];
    if (inputPrefix) {
        // İş Skalası alanları için work_scale_ prefix'ini kullan
        const isWorkScale = ['performance', 'safety', 'quality', 'teamwork', 'discipline', 'representation', 'initiative', 'learning','job_satisfaction','workplace_rules'].includes(competencyName) ||
            inputPrefix.startsWith('work_scale_');
        const prefix = isWorkScale ? 'work_scale_' : 'psych_scale_';
        const actualInputPrefix = isWorkScale ? competencyName : inputPrefix;

        for (let i = 1; i <= 5; i++) {
            const input = document.getElementById(`${prefix}${actualInputPrefix}_${i}`);
            if (input) {
                input.value = '';
                input.readOnly = true;
            }
        }
    }
}

// Yetkinlik toplam alanını güncelle
function updateCompetencyTotal(inputPrefix) {
    // Radio button seçildiğinde veya input değiştiğinde toplam hesaplamaları tetikle
    if (typeof calculatePsychologicalTotal === 'function') {
        calculatePsychologicalTotal();
    }
    if (typeof calculateWorkTotal === 'function') {
        calculateWorkTotal();
    }
}

// Input alanları için event listener'ları ekle
function setupInputListeners() {
    const psychPrefixes = [
        'stress', 'emotional', 'problem_solving', 'self_esteem', 'social_support',
        'positive_thinking', 'life_satisfaction', 'adaptation', 'mental_health', 'motivation'
    ];

    const workPrefixes = [
        'performance', 'safety', 'quality', 'teamwork', 'discipline',
        'representation', 'initiative', 'learning','job_satisfaction','workplace_rules'
    ];


    // Psikolojik Skala input'ları
    psychPrefixes.forEach(prefix => {
        for (let i = 1; i <= 5; i++) {
            const input = document.getElementById(`psych_scale_${prefix}_${i}`);
            if (input) {
                input.addEventListener('input', function() {
                    updateCompetencyTotal(prefix);
                });
                // Change event'i de ekle
                input.addEventListener('change', function() {
                    updateCompetencyTotal(prefix);
                });
            }
        }
    });

    // İş Skalası input'ları
    workPrefixes.forEach(prefix => {
        for (let i = 1; i <= 5; i++) {
            const input = document.getElementById(`work_scale_${prefix}_${i}`);
            if (input) {
                input.addEventListener('input', function() {
                    updateCompetencyTotal(prefix);
                });
                // Change event'i de ekle
                input.addEventListener('change', function() {
                    updateCompetencyTotal(prefix);
                });
            }
        }
    });

}

// Tablo tıklama mantığını kur
function setupTableClickListeners() {
    // Tüm tabloları bul
    const tables = document.querySelectorAll('.table-container table');

    tables.forEach(table => {
        const rows = table.querySelectorAll('tbody tr');

        rows.forEach(row => {
            const firstTd = row.querySelector('td:first-child');
            const secondTd = row.querySelector('td:nth-child(2)');
            const radioButton = firstTd ? firstTd.querySelector('input[type="radio"]') : null;
            const numberInput = secondTd ? secondTd.querySelector('input[type="number"]') : null;

            if (firstTd && radioButton) {
                // 1. td'ye tıklandığında radio button'ı seç
                firstTd.addEventListener('click', function(e) {
                    // Eğer tıklanan element zaten radio button ise, normal davranışı bırak
                    if (e.target.type === 'radio') {
                        return;
                    }

                    // Radio button'ı seç
                    radioButton.checked = true;

                    // Radio button'un change event'ini tetikle
                    const changeEvent = new Event('change', { bubbles: true });
                    radioButton.dispatchEvent(changeEvent);
                });
            }

            if (secondTd && numberInput && radioButton) {
                // 2. td'ye tıklandığında max değeri yaz ve readonly'yi kaldır
                secondTd.addEventListener('click', function(e) {
                    // Eğer tıklanan element zaten input ise, normal davranışı bırak
                    if (e.target.type === 'number') {
                        return;
                    }

                    // Önce radio button'ı seç
                    radioButton.checked = true;

                    // Radio button'un change event'ini tetikle
                    const changeEvent = new Event('change', { bubbles: true });
                    radioButton.dispatchEvent(changeEvent);

                    // Kısa bir gecikme ile input'a max değeri yaz
                    setTimeout(() => {
                        if (numberInput && !numberInput.readOnly) {
                            const maxValue = parseInt(numberInput.getAttribute('max'));
                            if (maxValue) {
                                numberInput.value = maxValue;
                                numberInput.focus();
                            }
                        }
                    }, 50);
                });
            }
        });
    });
}

// Sayfa yüklendiğinde radio button listener'larını kur
document.addEventListener('DOMContentLoaded', function() {
    // Mevcut DOMContentLoaded event'ine ek olarak
    setTimeout(() => {
        setupRadioButtonListeners(); // Radio button listener'larını kur
        setupInputListeners(); // Input listener'larını kur
        setupTableClickListeners(); // Tablo tıklama listener'larını kur
        
        // Sayfa yüklendiğinde toplam hesaplamaları yap
        calculatePsychologicalTotal();
        calculateWorkTotal();
    }, 500); // Biraz daha uzun gecikme ile kurulum yap
});