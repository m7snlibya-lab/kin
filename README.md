# Kin — Family, through time

An installable, static, offline-first SPA for family ages and birthdays in Gregorian and Hijri (Umm al-Qura) calendars. No account, backend database, API calls, analytics, external fonts, or remote QR service are required by the application.

Live app: **[m7snlibya-lab.github.io/kin](https://m7snlibya-lab.github.io/kin/)**

## Run or host

Serve `dist/` from any static HTTPS host. For local development, run `npm ci` and `npm run dev`, or use `python -m http.server 8080 --directory dist`. Localhost and production HTTPS support service workers; plain HTTP on a non-localhost domain does not. There is no production build step; all runtime assets, including the QR generator and compression library, are checked in. `.openai/hosting.json` identifies the Sites deployment.

For a production-like local preview, run `npm start` and open `http://127.0.0.1:4173/kin/`. This serves the unmodified static release at the GitHub Pages subdirectory, including its service worker. Use this preview to test offline behavior; the Vite development server includes development-only resources.

### Verification and GitHub Pages

Run `npm test` for calendar, codec, merge, localization, backup, ICS and simulated offline checks. Run `npx playwright install chromium` once, then `npm run test:browser` for Chromium desktop and mobile browser checks. `npm run test:all` runs both suites. Set `KIN_BASE_URL` to an existing deployment URL (including its trailing slash) to run browser checks against that deployment instead of the local preview. Browser tests use isolated contexts and synthetic names; they do not modify another browser's family data.

The GitHub Actions workflow in `.github/workflows/pages.yml` verifies every pull request and push to `main`. A successful `main` run publishes only `dist/` to GitHub Pages. Select **GitHub Actions** in the repository's **Settings → Pages → Source** when configuring a new copy of this repository. Future pushes publish automatically after verification; failed checks prevent deployment. No custom domain or paid hosting is required.

The browser suite checks person creation/editing/removal/undo, calendar switching, search, Arabic digits and RTL, horizontal layout on a phone, selected family links, QR rendering, backup download/restore, recurring and one-time calendar downloads, unsaved-edit guards, and real service-worker offline reloads at `/kin/`. It supplements the historical release notes below. Native device installation, camera scanning, and imports into Apple/Google/Outlook calendars still require testing in those products.

Run the algorithm checks with `node tests.mjs`. Tests cover 100,406 date conversions against ICU, Hijri/Gregorian leap dates, date-based ages and countdowns, Unicode codec round trips, corruption rejection, size limits, merge conflicts, duplicate detection, and QR generation. Browser installation, offline navigation, and device QR scanning require browser/device verification; these were not tested in this environment.

## User behavior

- Add and edit a name and birth date using either calendar. Switching calendars converts a complete valid date.
- Both calendar ages, birth dates, total days lived, birth weekday, and both next-birthday countdowns appear together.
- The main URL updates after each save. Bookmark/copy a fresh link after edits: bookmarks and previously shared links are immutable snapshots, not synchronization channels.
- The app keeps a best-effort local copy to reopen from an installed app icon. The full URL is the portable source of truth.
- Sharing selects a subset and generates its URL and QR entirely offline. Large links receive a warning; links above 2,000 characters use copy/share instead of a dense QR.
- Opening an incoming link with an existing local family requires a merge review, with a view-only alternative. Explicit imports always show a review. Merge is additive; conflicts default to local values. No shared deletion propagation.
- Up to 150 people per link; Unicode names up to 120 UTF-8 bytes; birth dates from 1900-01-01 through the current local date.

## URL format (v1)

`#k1r<base64url>` stores raw bytes; `#k1z<base64url>` stores zlib DEFLATE bytes. Compression level 9 is applied only when smaller than the raw representation. The fixed prefix permits future schema versions and codecs.

The binary layout is:

1. Unsigned LEB128 record count.
2. For each person: six random identifier bytes, unsigned LEB128 day offset from 1900-01-01, one input-calendar byte (0 Gregorian, 1 Umm al-Qura), unsigned LEB128 UTF-8 name length, then name bytes.
3. Four bytes of big-endian CRC32 over the preceding bytes.

Dates are canonical absolute integer days. The input-calendar byte preserves the chosen entry convention. Stable 48-bit random identifiers support merging edits at a cost of six bytes per person. A birth-date/name match also recognizes duplicate additions with independent identifiers. CRC32 detects accidental damage, not malicious edits; this is not an authenticated or encrypted format. The decoder limits encoded size, decompressed size, record count, names, dates, duplicate identifiers and field values before applying data. Base64url makes the result safe in a fragment without percent encoding.

Why not JSON, localStorage alone, or a short-link server? Binary records avoid repeated keys and ISO-date overhead; compression removes further repetition when useful. Local storage is disposable and device-specific. A URL shortener would require a server and make offline decoding and independent recovery impossible. No derived age, weekday, countdown, sort choice, avatar or QR data is stored in the link.

## Calendar semantics

`dist/hijri-data.js` contains a frozen Umm al-Qura month-length table for AH 1300–1600, generated from ICU 78.3 in the authoring environment. Month lengths use one bit each plus an absolute start day. No network calendar service is involved. The same table is used for input and display on every device. `setup-assets.cjs` documents table generation and vendoring from the authoring runtime; it is not needed to run the app. Regenerating the table is a calendar data change and must be reviewed for compatibility.

Each age is years, months, then residual days using anniversary arithmetic. Missing anniversary dates clamp to the final day of that month (29 February becomes 28 February in a non-leap year; Hijri day 30 becomes day 29 where needed). Birthdays today have zero days remaining. The civil date advances at local midnight, not sunset; no birth time or timezone is encoded. Total elapsed days is identical in both calendars. Local moon-sighting conventions can differ from Umm al-Qura. Dates outside the bundled Hijri table fail explicitly.

The calendar adapters (`parts`, `toDay`, `days`, `months`) can support additional calendar systems later. Such support needs an explicit identifier/version strategy when saving a new entry convention. Hijri is already a lunar calendar; a Chinese lunisolar calendar, for example, would also need leap-month representation.

## Offline and durability boundaries

The versioned service worker precaches the app shell and every runtime asset, then serves navigation and assets from cache. Install fails rather than reporting ready with a partial cache. A first online visit is required per browser/device. Browser eviction, clearing storage, or uninstalling may remove the cache: reconnect to fetch the app again, then open the saved URL. The URL preserves records, not the app executable or hosting availability.

For future app changes, bump the service-worker cache name alongside the release. Keep old decoders supported for old bookmarked links. A saved link requires the hosting origin to remain reachable at least for fresh installations; for long-term independence, preserve this static source and a copy of the full link. Links contain no live synchronization service.

## Privacy

The fragment is not sent in HTTP requests. The app does not send family data elsewhere. However, names and dates are readable to anyone with the complete link, to scripts with page access, and potentially to browser history/sync, extensions and the messaging service used to share the link. Compression is not encryption. The app prominently explains this before sharing. No personal family data is checked into this repository.

## Research and libraries

- [MDN: URI fragments](https://developer.mozilla.org/en-US/docs/Web/URI/Reference/Fragment)
- [Unicode ICU: Islamic calendar variants](https://unicode-org.github.io/icu-docs/apidoc/dev/icu4j/com/ibm/icu/util/IslamicCalendar.html)
- [MDN: Service workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers)
- [MDN: Compression Streams API](https://developer.mozilla.org/en-US/docs/Web/API/Compression_Streams_API). Bundled pako was chosen for consistent offline codec support, including browsers without the required native stream formats.
- Vendored pako: MIT/Zlib licenses in `dist/vendor/pako-LICENSE.txt`.
- QRCode: Kazuhiko Arase, MIT; source attribution retained in `dist/vendor/qr.js`.

## Arabic localization and usability (release 2)

- English/Arabic switch with first-visit browser-language detection and a device-local preference. Language never enters the family payload. Existing v1 links remain byte-for-byte compatible.
- Explicit translated messages for the shell, forms, validation, merge/conflict review, sharing, installation and help. Arabic RTL layout uses isolated names and LTR URLs/QR surfaces. Frozen calendar calculations are unchanged; month names, weekday labels, numbers and count phrases are localized at display time.
- Date input accepts Western, Arabic-Indic and Eastern Arabic/Persian digits. Empty, mixed-letter and exponent inputs are rejected.
- Name search ignores Arabic diacritics and tatweel. It only filters the visible cards, not the saved family or sharing selection.
- Removal has a 12-second undo action. Subsequent changes invalidate that action, and another tab's saved edits cannot be silently overwritten by undo.
- Hijri birthday rows now show their Hijri month/day; the upcoming birthday summary still shows the Gregorian date for planning.
- The offline cache includes the complete localization/help resources. New releases provide a reload notice after a worker change, without automatically reloading an open edit form.

Run `node locale-tests.mjs` for localization, number input, plural forms, interpolated-message completeness, payload compatibility and offline asset coverage, alongside `node tests.mjs` for the existing date/codec/merge checks. No browser visual or device installation tests were performed for this release.

## Reliability verification (release 3)

`npm test` runs the full calendar, data, localization and service-worker simulation checks. Gregorian input now rejects short years rather than accepting JavaScript's 1900-offset interpretation. Import planning deduplicates equivalent records within the incoming batch. Compression is imported as a module dependency before app startup; formatters are reused instead of recreated for every visible value.

A save checks the local family revision before writing. If another tab has changed it, the stale save is blocked and the user can review the latest family against their current circle. This is optimistic conflict detection for the device-local convenience copy, not server synchronization or an atomic cross-tab transaction. Each tab's URL still holds its snapshot.

Service-worker installation requests fresh assets as a complete cache. Updates wait for an explicit Reload action before activation. Offline readiness has a timeout instead of staying in a permanent preparing state. Service-worker simulation verifies cached navigation, every runtime dependency, network isolation, installation failure, explicit activation, and old-cache cleanup.

Live browser QA was attempted but the managed preview service was unavailable. The live public URL could not be inspected through the available web reader either. Therefore no claim is made that mobile rendering, install prompts, actual device offline reloads, or live clicks were verified. Vite development tooling and a locked dependency set are included for a repeatable test environment when preview is available.

## Portable backups and unsaved edits (release 4)

Share family → Download backup exports only the selected people to a `.json` file. Merge a link → Or restore a backup file reads it locally and opens the same additive merge/conflict review as a shared URL. The envelope is `{format:"kin-family",version:1,data:"#k1..."}`; it intentionally contains no hosting origin. A compatible Kin app is still required to read it. Files are readable, not encrypted, and should be kept private. Input is limited to 64 KiB and validated before any saved family changes.

Closing a changed person form via Cancel, the close button, Escape, or its backdrop asks before discarding changes. Navigating away uses the browser's unsaved-change warning where supported. Successful saves close without prompting. These warnings do not replace saving and cannot prevent operating-system termination.

`npm test` includes backup round trips, selected-person exports, Unicode names, merge outcomes, corrupt/wrong-version/oversized inputs, and offline asset availability. Browser interaction testing remains unavailable in this environment.

## Birthday agenda and calendar export (release 5)

The People/Birthdays tabs provide an upcoming agenda with 30-, 90-, and 365-day ranges, Gregorian/Hijri/both filters, and name search. The range includes today and ends at today + range - 1. Events are enumerated by calendar year; a 365-day range may correctly contain two Hijri birthdays for one person. Existing month-end clamping rules apply. These display controls add nothing to the URL.

Export calendar downloads only the visible events as UTF-8 `.ics`. Entries are one-time all-day Gregorian DATE events (the Gregorian equivalent of each actual Hijri anniversary), with exclusive next-day end dates, stable per-person/calendar/date UIDs, and localized text. There is no yearly RRULE or remote subscription. Files do not automatically update; users must export future ranges themselves. Some calendar apps may duplicate imported events despite stable UIDs.

Serialization follows [RFC 5545](https://www.rfc-editor.org/rfc/rfc5545.html): CRLF, TEXT escaping and 75-octet folding without splitting Unicode characters. Tests cover year windows, two Hijri birthdays, leap birthdays, date bounds, event identities, all-day end semantics, Unicode folding and injection resistance. Live imports into specific calendar products and visual browser checks remain unverified.


### Refinements (0.6.0)
- Import review lets recipients choose individual new people; conflict choices remain independent. Calendar-only conflicts now show the original input calendar.
- Incomplete dates remain in the editor when switching calendars is attempted; complete dates still convert automatically.
- Form errors focus and identify the affected field. Birthday agenda dates and age labels are available to screen readers.
- Calendar export previews the date range and included names, with a reminder that imports are one-time snapshots and may duplicate events on repeat import.
- Update reloads respect the unsaved-editor guard. These improvements add no fields to family links.
- Automated checks cover selective merging and size limits in addition to calendar, localization, codec, backup, ICS and simulated offline checks. Real browser/device testing remains unavailable because the managed preview service is unavailable.


### Recurring calendar exports (0.7.0)
Gregorian birthdays repeat yearly by default; the export dialog offers a one-time opt-out. The current agenda/search selects the initial birthdays to include, and their series continue beyond that range. Hijri events remain explicit dates. February 29 uses `FREQ=YEARLY;BYMONTH=2;BYMONTHDAY=-1`, preserving the last-day-of-February policy. Recurring descriptions omit static ages. Series UIDs remain stable across export years; imports still do not sync and some calendar apps may duplicate repeated imports. Remove old imported events when replacing them.

Verified against RFC 5545 section 3.3.10, automated mixed-export/UID/deduplication tests, and independent Python dateutil expansion for 2023–2028. Actual Apple/Google/Outlook imports remain untested. No family URL fields were added.
