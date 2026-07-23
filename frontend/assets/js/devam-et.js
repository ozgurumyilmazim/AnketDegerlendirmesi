$(document).ready(function () {
    const $form = $('#resumeForm');
    const $tcNoInput = $('#tcNo');
    const $saveCodeInput = $('#saveCode');
    const $resumeBtn = $('#resumeBtn');

    $tcNoInput.on('input', function () {
        $(this).val($(this).val().replace(/[^0-9]/g, ''));
    });

    $saveCodeInput.on('input', function () {
        $(this).val($(this).val().toUpperCase().replace(/[^A-Z0-9]/g, ''));
    });

    $form.on('submit', async function (e) {
        e.preventDefault();
        hideError();
        hideSuccess();

        const tcNo = $tcNoInput.val().trim();
        const saveCode = $saveCodeInput.val().trim().toUpperCase();

        if (tcNo.length !== 11) {
            showError('TC Kimlik No 11 haneli olmalıdır.');
            return;
        }

        if (saveCode.length !== 11) {
            showError('Kayıt kodu 11 haneli olmalıdır.');
            return;
        }

        $resumeBtn.prop('disabled', true).html('<span class="spinner-border spinner-border-sm me-2"></span>Kontrol ediliyor...');

        try {
            await resumeTest(tcNo, saveCode);
        } catch (error) {
            console.error('Devam etme hatası:', error);
            showError(error.message || 'Test bulunamadı. Lütfen bilgilerinizi kontrol edin.');
            $resumeBtn.prop('disabled', false).html('<i class="fas fa-play me-2"></i>Teste Devam Et');
        }
    });
});

async function resumeTest(tcNo, saveCode) {
    if (typeof PG_API === 'undefined' || !PG_API) {
        throw new Error('Veritabanı bağlantısı bulunamadı. Lütfen daha sonra tekrar deneyin.');
    }

    const { data: participants, error: participantError } = await PG_API
        .from('participants')
        .select('id, first_name, last_name, tc_no, gender, age, education, marital_status, profession, institution_code, institution_name')
        .eq('tc_no', tcNo)
        .limit(1);

    if (participantError) {
        console.error('Katılımcı sorgu hatası:', participantError);
        throw new Error('Veritabanı hatası oluştu. Lütfen daha sonra tekrar deneyin.');
    }

    if (!participants || participants.length === 0) {
        throw new Error('Bu TC Kimlik No ile kayıtlı katılımcı bulunamadı.');
    }

    const participant = participants[0];

    const { data: testResults, error: testError } = await PG_API
        .from('test_results')
        .select('id, test_answers, start_time, dont_know_count, completed_questions, total_questions, status, session_code, current_index')
        .eq('participant_id', participant.id)
        .eq('session_code', saveCode)
        .limit(1);

    if (testError) {
        console.error('Test sonucu sorgu hatası:', testError);
        throw new Error('Veritabanı hatası oluştu. Lütfen daha sonra tekrar deneyin.');
    }

    if (!testResults || testResults.length === 0) {
        throw new Error('Bu bilgilere ait kayıtlı test bulunamadı. Lütfen TC Kimlik No ve kayıt kodunu kontrol edin.');
    }

    const testResult = testResults[0];

    if (testResult.status === 'completed') {
        throw new Error('Bu test daha önce tamamlanmış. Tamamlanmış bir teste devam edilemez.');
    }

    if (testResult.status === 'abandoned') {
        throw new Error('Bu test iptal edilmiş durumda. Yeniden başlatmak için lütfen iletişime geçin.');
    }

    const personalInfo = {
        firstName: participant.first_name,
        lastName: participant.last_name,
        tcNo: participant.tc_no,
        gender: participant.gender === 'erkek' ? 'male' : participant.gender === 'kadin' ? 'female' : participant.gender,
        age: participant.age,
        education: participant.education,
        maritalStatus: participant.marital_status,
        profession: participant.profession,
        institutionCode: participant.institution_code,
        institutionName: participant.institution_name
    };

    localStorage.setItem('mmpiPersonalInfo', JSON.stringify(personalInfo));
    localStorage.setItem('mmpiParticipantId', participant.id);

    if (!localStorage.getItem('kvkkConsent')) {
        localStorage.setItem('kvkkConsent', 'true');
        localStorage.setItem('mmpiConsentDate', new Date().toISOString());
    }

    const answers = testResult.test_answers || {};
    const answeredCount = Object.keys(answers).length;
    const dontKnowCount = testResult.dont_know_count || 0;
    const currentIndex = testResult.current_index != null
        ? testResult.current_index
        : Math.min(answeredCount, (testResult.total_questions || 567) - 1);

    const resumeData = {
        testResultId: testResult.id,
        participantId: participant.id,
        saveCode: saveCode,
        answers: answers,
        dontKnowCount: dontKnowCount,
        currentQuestionIndex: currentIndex,
        answeredCount: answeredCount,
        totalQuestions: testResult.total_questions || 567,
        startTime: testResult.start_time || new Date().toISOString()
    };

    localStorage.setItem('mmpiResumeInfo', JSON.stringify(resumeData));
    localStorage.removeItem('mmpiTestProgress');
    localStorage.removeItem('mmpiTestResults');

    showSuccess('Test bulundu! Yönlendiriliyorsunuz...');

    setTimeout(function () {
        window.location.href = 'mmpi-test.html?resume=true';
    }, 1000);
}

function showError(message) {
    const $errorDiv = $('#errorMessage');
    const $errorText = $('#errorText');
    if ($errorDiv.length && $errorText.length) {
        $errorText.text(message);
        $errorDiv.css('display', 'block');
        $('html, body').animate({ scrollTop: 0 }, 300);
    }
}

function hideError() {
    const $errorDiv = $('#errorMessage');
    if ($errorDiv.length) {
        $errorDiv.css('display', 'none');
    }
}

function showSuccess(message) {
    const $successDiv = $('#successMessage');
    const $successText = $('#successText');
    if ($successDiv.length && $successText.length) {
        $successText.text(message);
        $successDiv.css('display', 'block');
    }
}

function hideSuccess() {
    const $successDiv = $('#successMessage');
    if ($successDiv.length) {
        $successDiv.css('display', 'none');
    }
}
