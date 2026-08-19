function generateTckn() {
  const prefix = '99';
  const middle = String(Math.floor(Math.random() * 100000000)).padStart(8, '0');
  const full = prefix + middle;
  const oddSum = full[0] * 1 + full[2] * 1 + full[4] * 1 + full[6] * 1 + full[8] * 1;
  const evenSum = full[1] * 1 + full[3] * 1 + full[5] * 1 + full[7] * 1;
  const digit10 = (oddSum * 7 - evenSum) % 10;
  const digit11 = (full.substring(0, 9).split('').reduce((a, c) => a + c * 1, 0) + digit10) % 10;
  return full + digit10 + digit11;
}

function generateGender() {
  return Math.random() < 0.5 ? 'erkek' : 'kadin';
}

export const GENDER_DISPLAY = {
  erkek: 'Erkek',
  kadin: 'Kadın',
};

export function createTestParticipant() {
  const suffix = Date.now().toString(36).slice(-6);
  return {
    firstName: 'Test',
    lastName: `Kullanici_${suffix}`,
    tcNo: generateTckn(),
    gender: generateGender(),
    age: 30,
    institutionCode: 'KUR001',
    institutionName: 'İstanbul Üniversitesi',
    profession: 'Mühendis',
    education: 'Lisans',
    maritalStatus: 'Bekar',
  };
}

export const ADMIN_CREDENTIALS = {
  email: 'admin@psikolog.com',
  password: 'admin123',
};

export const TEST_CONFIG = {
  totalQuestions: 566,
  maxDontKnow: 10,
  // answerLabel: 'Doğru',
  dontKnowLabel: 'Bilmiyorum',
};
