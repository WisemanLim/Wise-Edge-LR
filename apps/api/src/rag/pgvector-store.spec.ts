import { describe, expect, it } from 'vitest';
import { toVectorLiteral } from './pgvector-store';

describe('toVectorLiteral', () => {
  it('number[] → pgvector 리터럴', () => {
    expect(toVectorLiteral([1, 2, 3])).toBe('[1,2,3]');
    expect(toVectorLiteral([0.5, -0.25])).toBe('[0.5,-0.25]');
  });
  it('빈 벡터', () => {
    expect(toVectorLiteral([])).toBe('[]');
  });
});
