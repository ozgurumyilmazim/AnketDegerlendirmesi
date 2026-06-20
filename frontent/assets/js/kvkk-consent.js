// KVKK ve Onam Metni JavaScript

$(document).ready(function() {
    const $consentCheckbox = $('#kvkkConsent');
    const $continueBtn = $('#continueBtn');
    
    // Checkbox durumuna göre buton aktifliği
    $consentCheckbox.on('change', function() {
        $continueBtn.prop('disabled', !$(this).prop('checked'));
    });
    
    // Teste başla butonu
    $continueBtn.on('click', function() {
        if ($consentCheckbox.prop('checked')) {
            // KVKK onayını kaydet
            localStorage.setItem('mmpiKvkkConsent', 'true');
            localStorage.setItem('mmpiConsentDate', new Date().toISOString());
            
            // Test sayfasına yönlendir
            window.location.href = 'test/mmpi-test.html';
        }
    });
});