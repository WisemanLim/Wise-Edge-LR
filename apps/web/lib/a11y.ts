// KWCAG 2.2 / WCAG 자동 점검 가능 항목(정적 HTML 분석). 순수 — 오프라인 시험 가능.
// 수동 항목(대비 측정, 스크린리더, 키보드 흐름)은 라이브 감사(gstack/Playwright)로 보완.

export interface A11yIssue {
  rule: string; // KWCAG 항목
  message: string;
}

export function auditHtml(html: string): A11yIssue[] {
  const issues: A11yIssue[] = [];
  const h = html ?? '';

  // 언어 명시 (KWCAG 7.1.1 / WCAG 3.1.1)
  if (/<html\b/i.test(h) && !/<html\b[^>]*\blang\s*=/i.test(h)) {
    issues.push({ rule: 'lang', message: '<html> 에 lang 속성 없음' });
  }

  // 이미지 대체텍스트 (KWCAG 5.1.1 / WCAG 1.1.1)
  for (const m of h.matchAll(/<img\b[^>]*>/gi)) {
    if (!/\balt\s*=/i.test(m[0])) {
      issues.push({ rule: 'img-alt', message: `img 에 alt 없음: ${m[0].slice(0, 40)}` });
    }
  }

  // 입력 레이블 (KWCAG 7.3.2 / WCAG 1.3.1, 4.1.2)
  for (const m of h.matchAll(/<(input|textarea|select)\b[^>]*>/gi)) {
    const tag = m[0];
    if (/\btype\s*=\s*["']?(hidden|submit|button)["']?/i.test(tag)) continue;
    const hasAria = /\baria-label\s*=|\baria-labelledby\s*=/i.test(tag);
    const idMatch = /\bid\s*=\s*["']([^"']+)["']/i.exec(tag);
    const hasLabel = idMatch ? new RegExp(`<label[^>]*\\bfor\\s*=\\s*["']${idMatch[1]}["']`, 'i').test(h) : false;
    if (!hasAria && !hasLabel) {
      issues.push({ rule: 'input-label', message: `폼 요소에 레이블 없음: ${tag.slice(0, 40)}` });
    }
  }

  // 버튼/링크 접근가능 이름 (KWCAG 7.4.x / WCAG 4.1.2)
  for (const m of h.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/gi)) {
    const attrs = m[1];
    const text = m[2].replace(/<[^>]+>/g, '').trim();
    if (!text && !/\baria-label\s*=/i.test(attrs)) {
      issues.push({ rule: 'button-name', message: '버튼에 접근가능 이름 없음' });
    }
  }

  // 제목 구조: h1 정확히 1개 (KWCAG 7.x / WCAG 1.3.1 권고)
  const h1 = (h.match(/<h1\b/gi) || []).length;
  if (h1 === 0) issues.push({ rule: 'heading-h1', message: 'h1 없음' });
  if (h1 > 1) issues.push({ rule: 'heading-h1', message: `h1 ${h1}개(1개 권장)` });

  return issues;
}
