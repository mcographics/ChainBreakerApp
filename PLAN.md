# ChainBreaker Android MVP

## Summary

Build ChainBreaker from the empty `G:\ChainBreakerApp` workspace as an Android-first, offline-capable React/TypeScript application wrapped with Capacitor.

The product promise is:

> Break the chains. Build the man.

The first release will be a polished vertical slice of the daily loop:

**Pray → Read → Act → Train → Reflect → Repeat**

It will include Home/Daily, Word, Battles, Build, Brotherhood, onboarding, and My Journey. User progress remains private and local. The code will expose a repository boundary for future sync, but v1 will contain no account system, cloud backend, or network dependency.

## Key Changes

### 1. Application foundation

- Bootstrap a Vite + React + TypeScript project with Capacitor Android.
- Use a single responsive app shell with bottom navigation:
  - Home
  - Word
  - Brotherhood
  - Build
  - My Journey
- Use a dark, restrained, premium visual system:
  - charcoal/ink surfaces
  - warm white text
  - muted brass accent
  - restrained deep green secondary accent
  - clear success, warning, and struggle states
- Use Lucide icons for navigation and actions.
- Keep all primary workflows usable offline.
- Add a first-run onboarding flow that collects:
  - up to three man-building identities
  - one or more chains being broken
  - daily starting date
- Add a reset/delete-local-data action under My Journey.

### 2. Home and Daily experience

Create Home as the primary daily operating screen.

It will display:

- current day and Chain count
- daily verse
- short devotion
- prayer
- daily challenge
- challenge completion action
- today’s Build workout
- primary active Battle
- Bible reading continuation
- completion summary for the current day

Bundle a seven-day `Put Christ First` devotional plan containing verse, reflection, prayer, and practical challenge content. Daily completion will be persisted locally and remain idempotent if tapped repeatedly.

Use the product vocabulary consistently:

- goals become missions
- habits become disciplines
- streaks become chains
- progress becomes growth
- profile becomes My Journey

### 3. Word experience

Implement an offline KJV Bible reader using bundled public-domain text and attribution metadata.

Required functionality:

- book and chapter selection
- previous/next chapter navigation
- verse display with stable verse identifiers
- reading progress
- search across the bundled text
- bookmark a verse
- highlight a verse with selectable highlight colors
- add, edit, and delete a private verse note
- continue-reading entry from Home
- one bundled men’s reading plan tied to selected passages
- Red Letter Mode using bundled verse-level speech metadata for Jesus’ recorded words

Do not include modern licensed translations or audio Bible content in v1. Audio and additional translations remain later features requiring separate licensing/content decisions.

### 4. Battles experience

Implement private personal battles with local tracking.

Seed the following battle choices:

- Pornography
- Lust
- Alcohol
- Anger
- Fear
- Procrastination
- Gambling
- Isolation
- Nicotine
- Unforgiveness

Each battle will support:

- title and category
- start date
- calculated Chain day
- active/completed state
- daily check-in
- completion history
- primary-battle designation
- private local notes, without requiring the user to describe sensitive details

Implement the `I'M STRUGGLING` intervention as a focused action flow:

1. Leave the triggering environment.
2. Read the displayed Scripture.
3. Complete a 60-second breathing/prayer step.
4. Choose a replacement action.
5. Mark the intervention complete.

The flow must not present itself as medical treatment or crisis care. It should include a clear path to seek trusted human or emergency help when the situation is unsafe. No sensitive information is sent anywhere.

Represent progress visually with chain links that crack or disappear as a battle’s completed days accumulate. The visual should reinforce progress without shaming the user for a missed day.

### 5. Build experience

Implement one complete four-week `Foundation` training plan with three sessions per week.

Each session will include:

- exercise list
- sets/reps or timed duration
- completion controls
- workout duration
- session notes
- completion state
- linked virtue of the day

Use the initial virtue mapping:

- Monday: Discipline
- Tuesday: Courage
- Wednesday: Endurance
- Thursday: Responsibility
- Friday: Strength
- Saturday: Brotherhood
- Sunday: Rest/Worship

Home will surface the next scheduled workout. Build will show the current plan, session detail, and completed workout history. Nutrition, calorie calculation, advanced programs, rucking, HIIT, and wearable integrations remain out of scope for v1.

### 6. Brotherhood experience

Ship bundled editorial seed content rather than a network or user-generated community.

Create eight structured entries across the core categories:

- Marriage and women
- Fatherhood
- Purpose and career
- Money
- Sexual discipline
- Mental strength
- Faith
- Culture/hot topics

Each entry uses the required structure:

- The Issue
- Biblical Perspective
- Practical Solution
- Challenge

The Brotherhood screen will provide category filtering, article list/search, reading state, and article detail. It will not include accounts, posting, comments, likes, followers, moderation, or remote content loading in v1.

### 7. Persistence and interfaces

Use SQLite on Android for durable local data, with an in-memory repository for tests.

Keep content separate from private user state. Bundle immutable content as versioned JSON/data modules and persist only user progress and settings.

Define typed interfaces comparable to:

```ts
interface AppRepository {
  getProfile(): Promise<UserProfile | null>;
  saveProfile(profile: UserProfile): Promise<void>;

  listBattles(): Promise<Battle[]>;
  saveBattle(battle: Battle): Promise<void>;
  recordBattleCheckIn(checkIn: BattleCheckIn): Promise<void>;

  getDailyEntry(date: string): Promise<DailyEntry>;
  completeDailyMission(id: string, date: string): Promise<void>;

  getReadingProgress(): Promise<ReadingProgress>;
  saveReadingProgress(progress: ReadingProgress): Promise<void>;
  listBookmarks(): Promise<Bookmark[]>;
  saveHighlight(highlight: Highlight): Promise<void>;
  saveNote(note: VerseNote): Promise<void>;

  getActiveWorkout(): Promise<WorkoutSession | null>;
  saveWorkoutSession(session: WorkoutSession): Promise<void>;

  listBrotherhoodArticles(filter?: BrotherhoodFilter): Promise<BrotherhoodArticle[]>;
}
```

Define records with stable IDs, ISO timestamps, and explicit completion states so a future sync adapter can serialize them without changing the UI/domain layer.

Add an unimplemented/documented `SyncAdapter` interface only as an architectural boundary. Do not add authentication, network calls, remote storage, or conflict resolution to v1.

Core domain calculations should live outside React components:

- Chain day calculation
- daily completion state
- workout completion percentage
- reading progress
- onboarding selection limits
- active/primary battle selection
- date normalization

## Test Plan

- Unit-test Chain day calculations across:
  - first day
  - consecutive days
  - missed days
  - future start dates
  - timezone/date-boundary cases
- Unit-test onboarding validation:
  - zero selections
  - one to three identities
  - more than three identities
  - one or more battles
- Unit-test idempotent daily and workout completion.
- Unit-test repository serialization and restoration using the in-memory adapter.
- Test Bible actions:
  - chapter navigation
  - search
  - bookmark creation/removal
  - highlight creation
  - note creation/edit/delete
  - reading progress persistence
  - Red Letter Mode filtering/display
- Test Battle intervention completion and primary-battle updates.
- Test Build session completion and workout history.
- Test Brotherhood category filtering and structured article rendering.
- Run a production web build.
- Generate/sync the Android project with Capacitor.
- Assemble a debug APK using the Gradle wrapper.
- Install the APK through `adb` when a device or emulator is available and smoke-test:
  - first-run onboarding
  - bottom navigation
  - daily completion
  - Bible reading/search
  - Battle check-in/intervention
  - workout completion
  - Brotherhood article detail
  - app restart with data preserved
- Report separately whether physical-device testing was completed. A successful local build alone must not be presented as device verification.

## Assumptions and Defaults

- Android is the first shipping target; Windows and web packaging are deferred.
- The first release is local-first and account-free.
- KJV is the bundled Bible translation, with provenance/attribution included in the app.
- Brotherhood content is authored and bundled in the repository.
- Home contains the Daily experience; there is no separate Encourage tab.
- `My Journey` is the user-facing replacement for Profile.
- Push notifications, audio Bible, cloud sync, accountability partners, remote editorial feeds, user-generated community features, AI coaching, and payments are out of scope for v1.
- The available machine has Node and `adb`, but no global Gradle command. Android build verification must use the project’s Gradle wrapper, and Java/Android Gradle compatibility must be checked during project bootstrap without uninstalling existing Java installations.
