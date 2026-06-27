function generateTckn() {
  const prefix = '99';
  const middle = String(Math.floor(Math.random() * 100000000)).padStart(8, '0');
  const full = prefix + middle;
  const oddSum = full[0]*1 + full[2]*1 + full[4]*1 + full[6]*1 + full[8]*1;
  const evenSum = full[1]*1 + full[3]*1 + full[5]*1 + full[7]*1;
  const digit10 = (oddSum * 7 - evenSum) % 10;
  const digit11 = (full.substring(0, 9).split('').reduce((a,c) => a + c*1, 0) + digit10) % 10;
  return full + digit10 + digit11;
}

export function createTestParticipant() {
  const suffix = Date.now().toString(36).slice(-6);
  return {
    firstName: 'Test',
    lastName: `Kullanici_${suffix}`,
    tcNo: generateTckn(),
    gender: 'male',
    age: 30,
    institutionCode: 'TEST001',
    institutionName: 'Test Kurumu',
    profession: 'Yazilim Gelistirici',
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
  answerLabel: 'Doğru',
  dontKnowLabel: 'Bilmiyorum',
};
