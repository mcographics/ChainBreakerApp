import { describe, expect, it } from 'vitest';
import { chainDay, daysBetween, MemoryRepository } from './repository';

describe('date and Chain calculations', () => {
  it('counts the start date as day one', () => {
    expect(chainDay('2026-08-31', '2026-08-31')).toBe(1);
    expect(chainDay('2026-08-31', '2026-09-02')).toBe(3);
  });

  it('uses calendar dates consistently across timezone-like boundaries', () => {
    expect(daysBetween('2026-03-08', '2026-03-09')).toBe(1);
    expect(chainDay('2026-03-10', '2026-03-09')).toBe(1);
  });
});

describe('MemoryRepository', () => {
  it('keeps daily completion idempotent', async () => {
    const repo = new MemoryRepository();
    await repo.completeDailyMission('daily-1', '2026-08-31');
    await repo.completeDailyMission('daily-1', '2026-08-31');
    expect(await repo.isDailyComplete('2026-08-31')).toBe(true);
  });

  it('toggles bookmarks and persists notes by stable verse id', async () => {
    const repo = new MemoryRepository();
    await repo.toggleBookmark('kjv:John:3:16');
    expect((await repo.listBookmarks())).toHaveLength(1);
    await repo.toggleBookmark('kjv:John:3:16');
    expect((await repo.listBookmarks())).toHaveLength(0);
    await repo.saveNote({ id: 'note-1', verseId: 'kjv:John:3:16', body: 'Abide.', updatedAt: new Date().toISOString() });
    expect((await repo.listNotes())[0].body).toBe('Abide.');
    await repo.deleteNote('note-1');
    expect(await repo.listNotes()).toHaveLength(0);
  });

  it('does not duplicate check-ins for the same battle status and date', async () => {
    const repo = new MemoryRepository();
    const checkIn = { id: 'check-1', battleId: 'battle-1', date: '2026-08-31', status: 'strong' as const, createdAt: new Date().toISOString() };
    await repo.recordBattleCheckIn(checkIn);
    await repo.recordBattleCheckIn({ ...checkIn, id: 'check-2' });
    expect(await repo.listCheckIns('battle-1')).toHaveLength(1);
  });

  it('persists app settings through the repository boundary', async () => {
    const repo = new MemoryRepository();
    const settings = { preferredTranslationId: 'kjv', redLetterMode: true, autoUpdate: false, lastUpdateCheckAt: '2026-09-01T00:00:00.000Z' };
    await repo.saveSettings(settings);
    expect(await repo.getSettings()).toEqual(settings);
  });
});
