import { Capacitor } from '@capacitor/core';
import { CapacitorSQLite, SQLiteConnection, type SQLiteDBConnection } from '@capacitor-community/sqlite';
import { dailyEntries } from './content';
import type { AppState, Battle, BattleCheckIn, BibleVerse, Bookmark, BrotherhoodArticle, BrotherhoodFilter, DailyEntry, Highlight, ReadingProgress, UserProfile, VerseNote, WorkoutSession } from '../types';

const emptyState = (): AppState => ({ profile: null, battles: [], checkIns: [], dailyCompletions: [], readingProgress: { reference: 'John 3:16', updatedAt: new Date(0).toISOString() }, bookmarks: [], highlights: [], notes: [], workoutSessions: [], readArticleIds: [] });
const stateKey = 'chainbreaker-state-v1';

export interface SyncAdapter { push(state: AppState): Promise<void>; pull(): Promise<Partial<AppState> | null>; }

export interface AppRepository {
  getProfile(): Promise<UserProfile | null>;
  saveProfile(profile: UserProfile): Promise<void>;
  listBattles(): Promise<Battle[]>;
  saveBattle(battle: Battle): Promise<void>;
  recordBattleCheckIn(checkIn: BattleCheckIn): Promise<void>;
  listCheckIns(battleId?: string): Promise<BattleCheckIn[]>;
  getDailyEntry(date: string): Promise<DailyEntry>;
  isDailyComplete(date: string): Promise<boolean>;
  completeDailyMission(id: string, date: string): Promise<void>;
  getReadingProgress(): Promise<ReadingProgress>;
  saveReadingProgress(progress: ReadingProgress): Promise<void>;
  listBookmarks(): Promise<Bookmark[]>;
  toggleBookmark(verseId: string): Promise<void>;
  listHighlights(): Promise<Highlight[]>;
  saveHighlight(highlight: Highlight): Promise<void>;
  deleteHighlight(verseId: string): Promise<void>;
  listNotes(): Promise<VerseNote[]>;
  saveNote(note: VerseNote): Promise<void>;
  deleteNote(id: string): Promise<void>;
  listWorkoutSessions(): Promise<WorkoutSession[]>;
  saveWorkoutSession(session: WorkoutSession): Promise<void>;
  listReadArticleIds(): Promise<string[]>;
  markArticleRead(id: string): Promise<void>;
  deleteAll(): Promise<void>;
}

class JsonRepository implements AppRepository {
  protected state: AppState;
  constructor(initial?: AppState) { this.state = initial ?? emptyState(); }
  protected async persist(): Promise<void> {}
  async getProfile() { return this.state.profile; }
  async saveProfile(profile: UserProfile) { this.state.profile = profile; await this.persist(); }
  async listBattles() { return this.state.battles; }
  async saveBattle(battle: Battle) { const index = this.state.battles.findIndex((item) => item.id === battle.id); if (index < 0) this.state.battles.push(battle); else this.state.battles[index] = battle; await this.persist(); }
  async recordBattleCheckIn(checkIn: BattleCheckIn) { if (!this.state.checkIns.some((item) => item.battleId === checkIn.battleId && item.date === checkIn.date && item.status === checkIn.status)) this.state.checkIns.push(checkIn); await this.persist(); }
  async listCheckIns(battleId?: string) { return battleId ? this.state.checkIns.filter((item) => item.battleId === battleId) : this.state.checkIns; }
  async getDailyEntry(date: string) { const day = (Math.max(0, daysBetween(this.state.profile?.joinedDate ?? date, date)) % dailyEntries.length) + 1; return dailyEntries[day - 1]; }
  async isDailyComplete(date: string) { return this.state.dailyCompletions.includes(date); }
  async completeDailyMission(_id: string, date: string) { if (!this.state.dailyCompletions.includes(date)) this.state.dailyCompletions.push(date); await this.persist(); }
  async getReadingProgress() { return this.state.readingProgress; }
  async saveReadingProgress(progress: ReadingProgress) { this.state.readingProgress = progress; await this.persist(); }
  async listBookmarks() { return this.state.bookmarks; }
  async toggleBookmark(verseId: string) { const index = this.state.bookmarks.findIndex((item) => item.verseId === verseId); if (index >= 0) this.state.bookmarks.splice(index, 1); else this.state.bookmarks.push({ id: crypto.randomUUID(), verseId, createdAt: new Date().toISOString() }); await this.persist(); }
  async listHighlights() { return this.state.highlights; }
  async saveHighlight(highlight: Highlight) { const index = this.state.highlights.findIndex((item) => item.verseId === highlight.verseId); if (index >= 0) this.state.highlights[index] = highlight; else this.state.highlights.push(highlight); await this.persist(); }
  async deleteHighlight(verseId: string) { this.state.highlights = this.state.highlights.filter((item) => item.verseId !== verseId); await this.persist(); }
  async listNotes() { return this.state.notes; }
  async saveNote(note: VerseNote) { const index = this.state.notes.findIndex((item) => item.id === note.id); if (index < 0) this.state.notes.push(note); else this.state.notes[index] = note; await this.persist(); }
  async deleteNote(id: string) { this.state.notes = this.state.notes.filter((item) => item.id !== id); await this.persist(); }
  async listWorkoutSessions() { return this.state.workoutSessions; }
  async saveWorkoutSession(session: WorkoutSession) { const index = this.state.workoutSessions.findIndex((item) => item.id === session.id); if (index < 0) this.state.workoutSessions.push(session); else this.state.workoutSessions[index] = session; await this.persist(); }
  async listReadArticleIds() { return this.state.readArticleIds; }
  async markArticleRead(id: string) { if (!this.state.readArticleIds.includes(id)) this.state.readArticleIds.push(id); await this.persist(); }
  async deleteAll() { this.state = emptyState(); await this.persist(); }
}

export class MemoryRepository extends JsonRepository {}

class LocalStorageRepository extends JsonRepository {
  constructor() { super(); const saved = localStorage.getItem(stateKey); if (saved) { try { this.state = { ...emptyState(), ...JSON.parse(saved) }; } catch { this.state = emptyState(); } } }
  protected async persist() { localStorage.setItem(stateKey, JSON.stringify(this.state)); }
}

class SqliteRepository extends JsonRepository {
  private connection = new SQLiteConnection(CapacitorSQLite);
  private db: SQLiteDBConnection | null = null;
  private ready: Promise<void>;
  constructor() { super(); this.ready = this.initialize(); }
  private async initialize() {
    this.db = await this.connection.createConnection('chainbreaker', false, 'no-encryption', 1, false);
    await this.db.open();
    await this.db.execute('CREATE TABLE IF NOT EXISTS app_state (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL)');
    const result = await this.db.query('SELECT value FROM app_state WHERE key = ?', [stateKey]);
    if (result.values?.[0]?.value) this.state = { ...emptyState(), ...JSON.parse(result.values[0].value as string) };
  }
  protected async persist() { await this.ready; await this.db?.run('INSERT OR REPLACE INTO app_state (key, value) VALUES (?, ?)', [stateKey, JSON.stringify(this.state)]); }
  async getProfile() { await this.ready; return super.getProfile(); }
  async listBattles() { await this.ready; return super.listBattles(); }
  async listCheckIns(id?: string) { await this.ready; return super.listCheckIns(id); }
  async getDailyEntry(date: string) { await this.ready; return super.getDailyEntry(date); }
  async isDailyComplete(date: string) { await this.ready; return super.isDailyComplete(date); }
  async getReadingProgress() { await this.ready; return super.getReadingProgress(); }
  async listBookmarks() { await this.ready; return super.listBookmarks(); }
  async listHighlights() { await this.ready; return super.listHighlights(); }
  async listNotes() { await this.ready; return super.listNotes(); }
  async listWorkoutSessions() { await this.ready; return super.listWorkoutSessions(); }
  async listReadArticleIds() { await this.ready; return super.listReadArticleIds(); }
}

export function createRepository(): AppRepository {
  return Capacitor.isNativePlatform() ? new SqliteRepository() : new LocalStorageRepository();
}

export function daysBetween(start: string, end: string): number {
  const startDate = new Date(`${start}T00:00:00Z`).getTime();
  const endDate = new Date(`${end}T00:00:00Z`).getTime();
  return Math.floor((endDate - startDate) / 86_400_000);
}

export function chainDay(startDate: string, today: string): number { return Math.max(1, daysBetween(startDate, today) + 1); }

export function todayIso(): string { return new Date().toISOString().slice(0, 10); }

export type ContentSearch = { verses: BibleVerse[]; articles: BrotherhoodArticle[]; filter?: BrotherhoodFilter };
