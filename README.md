# ChainBreaker

ChainBreaker is a local-first Android rule of life for men.

> Break the chains. Build the man.

Version `0.0.1` is the first public release of the daily loop:

**Pray -> Read -> Act -> Train -> Reflect -> Repeat**

## Included in 0.0.1

- Home daily operating screen with KJV verse, devotion, prayer, mission, workout, battle, and reading continuation.
- Offline KJV Bible reader using bundled public-domain Scripture from the local `scripture` folder.
- Search, bookmarks, highlights, private verse notes, reading progress, and Red Letter Mode.
- Private local battles with daily check-ins, chain-day tracking, notes, primary-battle selection, and a focused intervention flow.
- Four-week Foundation training plan with three sessions per week, completion state, duration, notes, and virtue mapping.
- Bundled Brotherhood editorial library with category filters, search, reading state, and article detail.
- My Journey with local growth history and a reset/delete-local-data action.
- SQLite persistence on Android with an in-memory repository for tests.

## Privacy and scope

The first release has no account system, cloud backend, network dependency, social feed, comments, remote editorial loading, audio Bible, modern licensed translation, or wearable integration. Personal progress remains on the device. A typed `SyncAdapter` boundary is documented for future work but is intentionally unimplemented.

## Development

```powershell
npm install
npm run dev
npm run build
npm test
npx cap sync android
```

For Android builds, use the project Gradle wrapper from `android` and a compatible local JDK/Android SDK. The release signing keystore and `android/key.properties` are local-only and excluded from source control.

## Release artifact

The public Android APK is published through the [ChainBreaker GitHub Releases](https://github.com/mcographics/ChainBreakerApp/releases) page. The app is intended for Android 7.0 and newer.
