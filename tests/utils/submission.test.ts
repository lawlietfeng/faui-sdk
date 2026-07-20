import { describe, expect, it } from 'vitest';
import { areDataModelsEqual, cloneDataModel } from '../../src/utils/submission';

describe('submission utilities', () => {
  it('compares complete data models deeply', () => {
    expect(areDataModelsEqual(
      { profile: { name: 'Ann' }, tags: ['a'] },
      { profile: { name: 'Ann' }, tags: ['a'] },
    )).toBe(true);
    expect(areDataModelsEqual(
      { profile: { name: 'Ann' }, tags: ['a'] },
      { profile: { name: 'Bob' }, tags: ['a'] },
    )).toBe(false);
  });

  it('clones data so callback mutations cannot update the source model', () => {
    const source = { profile: { name: 'Ann' }, tags: ['a'] };
    const cloned = cloneDataModel(source);

    (cloned.profile as { name: string }).name = 'Bob';
    (cloned.tags as string[]).push('b');

    expect(source).toEqual({ profile: { name: 'Ann' }, tags: ['a'] });
  });
});
