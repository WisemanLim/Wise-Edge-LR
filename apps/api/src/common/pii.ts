// 고유식별정보 마스킹 (govtech/PIPA: 주민번호·전화·이메일·카드). 순수 함수.
// COMPLIANCE.md testing_additions: 고유식별정보 암호화·마스킹 검증.

const CARD = /\b(\d{4})[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b/g;
const RRN = /\b(\d{6})[- ]?\d{7}\b/g; // 주민등록번호
const PHONE = /\b(01[016789])[- ]?\d{3,4}[- ]?\d{4}\b/g;
const EMAIL = /\b([A-Za-z0-9._%+-])[A-Za-z0-9._%+-]*@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;

// 순서 주의: 카드(16) → 주민(13) → 전화(10~11) → 이메일.
export function maskPii(text: string): string {
  return (text ?? '')
    .replace(CARD, (_m, a) => `${a}-****-****-****`)
    .replace(RRN, (_m, a) => `${a}-*******`)
    .replace(PHONE, (_m, a) => `${a}-****-****`)
    .replace(EMAIL, (_m, a) => `${a}***@***`);
}

export function hasPii(text: string): boolean {
  const t = text ?? '';
  return [CARD, RRN, PHONE, EMAIL].some((re) => new RegExp(re.source).test(t));
}
