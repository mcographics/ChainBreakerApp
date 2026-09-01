import { describe, expect, it } from 'vitest';
import { articles } from './content';
import { getBibleChapter, getChapterCount, searchBible } from './scripture';

describe('bundled content', () => {
  const corpus = {
    'Genesis 1:1': 'In the beginning God created the heaven and the earth.',
    'Psalms 119:1': 'ALEPH. Blessed are the undefiled in the way, who walk in the law of the LORD.',
    'John 3:16': 'For God so loved the world, that he gave his only begotten Son.',
    'John 3:17': 'For God sent not his Son into the world to condemn the world; but that the world through him might be saved.'
  };

  it('ships the complete KJV book and chapter structure', () => {
    expect(getChapterCount({ ...corpus, 'Genesis 2:1': 'And the heavens and the earth were finished.' }, 'Genesis')).toBe(2);
    expect(getBibleChapter(corpus, 'kjv', 'John', 3)).toHaveLength(2);
    expect(getBibleChapter(corpus, 'kjv', 'John', 3).find((verse) => verse.verse === 16)?.text).toContain('For God so loved the world');
  });

  it('supports offline verse search and red-letter metadata', () => {
    expect(searchBible(corpus, 'kjv', 'undefiled')[0]?.book).toBe('Psalms');
    expect(getBibleChapter(corpus, 'kjv', 'John', 3).find((verse) => verse.verse === 16)?.isRedLetter).toBe(true);
  });

  it('contains one structured Brotherhood entry per core category', () => {
    expect(articles).toHaveLength(8);
    for (const entry of articles) expect(entry.issue && entry.biblicalPerspective && entry.practicalSolution && entry.challenge).toBeTruthy();
  });
});
