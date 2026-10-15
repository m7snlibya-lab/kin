# Kin — Family, through time

An installable, static, offline-first SPA for family ages and birthdays in Gregorian and Hijri (Umm al-Qura) calendars. No account, backend database, API calls, analytics, external fonts, or remote QR service are required by the application.

Live app: **[m7snlibya-lab.github.io/kin](https://m7snlibya-lab.github.io/kin/)**

## Run or host

Serve `dist/` from any static HTTPS host. For local development, run `npm ci` and `npm run dev`, or use `python -m http.server 8080 --directory dist`. Localhost and production HTTPS support service workers; plain HTTP on a non-localhost domain does not. There is no production build step; all runtime assets, including the QR generator and compression library, are checked in. `.openai/hosting.json` identifies the Sites deployment.

For a production-like local preview, run `npm start` and open `http://127.0.0.1:4173/kin/`. This serves the unmodified static release at the GitHub Pages subdirectory, including its service worker. Use this preview to test offline behavior; the Vite development server includes development-only resources.

### Verification and GitHub Pages

Run `npm test` for release integrity, calendar, codec, merge, localization, backup, ICS and simulated offline checks. Run `npx playwright install chromium firefox webkit` once, then `npm run test:browser` for Chromium desktop/mobile, Firefox, WebKit and development-server checks. `npm run test:all` runs both suites. Set `KIN_BASE_URL` to an existing deployment URL (including its trailing slash) to run release browser checks against that deployment instead of the local preview. Browser tests use isolated contexts and synthetic names; they do not modify another browser's family data.

The GitHub Actions workflow in `.github/workflows/pages.yml` verifies every pull request and push to `main`. A successful `main` run publishes only `dist/` to GitHub Pages. Select **GitHub Actions** in the repository's **Settings → Pages → Source** when configuring a new copy of this repository. Future pushes publish automatically after verification; failed checks prevent deployment. No custom domain or paid hosting is required.

The browser suite checks person creation/editing/removal/undo, calendar switching, search, Arabic digits and RTL, horizontal layout on a phone, selected family links, QR rendering, backup download/restore, recurring and one-time calendar downloads, unsaved-edit guards, and real service-worker offline reloads at `/kin/`. It supplements the historical release notes below. Native device installation, camera scanning, and imports into Apple/Google/Outlook calendars still require testing in those products.

Run the algorithm checks with `node tests.mjs`. Tests cover 100,406 date conversions against ICU, Hijri/Gregorian leap dates, date-based ages and countdowns, Unicode codec round trips, corruption rejection, size limits, merge conflicts, duplicate detection, and QR generation. Browser installation, offline navigation, and device QR scanning require browser/device verification; these were not tested in this environment.

## Arabic typography and calendar consistency (1.10.0)

- The app now uses self-hosted IBM Plex Sans Arabic (regular, medium and semibold) across headings, names, forms and controls. It retains native text sizing and fallbacks; no font service or npm font package is called. PDF/image exports retain their existing bundled Noto fonts.
- Hijri-only birthday lists use Hijri month headings, day badges and date ranges. Both-calendar lists follow the chosen primary calendar. Every event also shows its actual date in both calendars.
- Table dates carry the same sun/moon symbols and accessible calendar labels; the next-birthday date now matches the selected calendar. Read-only/demo tables omit the unused Edit column.
- Birth entry remembers the calendar used by the last successful save. Existing records keep their own calendar; date exploration starts in the chosen primary calendar.
- Shared snapshots have a Return to my family action that restores the saved local family and previous search/filter/reference context. Cancelling a merge review leaves the snapshot visible, without saving it.
- First-time family review uses plain View/Keep choices without irrelevant conflict statistics. Import/backup wording does not offer a viewing choice where none exists. Keeping an empty selection is disabled on an empty device; sharing is hidden until there are people to share.
- Regression coverage includes real offline font loading, missing-font fallback, Arabic forms, enlarged text, shared-return safety and calendar presentation.

## Clearer actions and recovery (1.14.0)

- Timeline's yearly birthday view always includes both calendars, with an explicit year/count summary. It no longer inherits an invisible calendar filter from Birthdays. Timeline rows open person details; editing returns to the same occurrence, and the selected Timeline mode is remembered locally.
- One shared birthday-scope helper drives browsing and export feedback. A broader-year recovery is offered only if it actually contains birthdays. Empty exports focus the relevant name/group, age or range recovery without changing the user's choices.
- Reference-date errors identify the invalid year, month or day, explain valid calendar bounds, and associate localized feedback with the input. Invalid calendar conversions preserve the entered values; Arabic/Persian/Western digits remain supported.
- Regression tests reproduce the live-audit findings, historical empty ranges, leap-day validation, Timeline navigation and remembered preferences. Family records, link format and export privacy rules remain unchanged.

## Everyday refinements (1.13.1)

- Birthday names open person details directly, including after changing the calendar or range. Editing returns to the same birthday event; shared snapshots remain read-only and unsaved.
- Empty birthday lists distinguish no matching people, no milestone ages and no events in the chosen period. Recovery clears only the relevant restriction; it does not unnecessarily reset the calendar, range or family search.
- Milestones sits beside the birthday summary rather than occupying a full-width row in the date controls. The ordinary family count is a short total; scoped searches and groups keep the shown/total comparison.
- Today’s two dates, offline readiness and app installation have one home in Manage family. The preferred calendar appears first without giving it stronger typography. Backup reminders remain actionable on People and stay visible across views if family storage is unavailable; dismissing a reminder leaves no empty footer panel.

## Task-led navigation (1.13.0)

People now has direct Compare ages, On another date and Timeline actions. Birthdays has direct Print calendar and Add to calendar app actions. The category/chooser dialogs are removed. Manage family replaces the vague Tools destination and contains groups, backup, import, the default date calendar and Help. Existing saved view preferences still work.

Timeline belongs to People, with a visible Back to people action and keyboard focus restoration. The Birthdays page no longer repeats the next-birthday hero. In By month, calendar-app export explicitly covers the next 365 days in the selected calendar, preserves the month view, and still previews its scope before download. First-use printing inherits the active calendar context; saved print preferences remain respected. No family links or birth dates change while browsing. See [UX-NOTES.md](UX-NOTES.md) for the review and limitations.

## Direct family controls (1.12.0, historical)

The expanding Options menu is replaced by one-tap group choices, shown only after groups exist. Group creation/management lives in Tools. The date-calendar preference is a direct sun/moon control in Tools and appears beside birthday sorting, table and timeline views when relevant. Search remains optional and works within the selected group; the selected group, current counts and keyboard focus stay clear without a second group-filter chip.

## Family-first mobile browsing (1.11.0)

Reviewed in **1.11.1**: month rows open details across their full touch target, the selected calendar comes first, ages identify today/reference mode, and historical birth weekdays no longer look like this year's birthday. The compact toolbar keeps search optional on every screen, uses direct layout icons, and returns focus to visible controls after resets. Month grouping preserves leap-day and Hijri day-30 births without changing records. Release checks also verify readable documentation and consistent version metadata.

- The People roster no longer has a birthday-month filter. Birthdays now offers an optional **By month** view with a Gregorian/Hijri choice; each person appears once under their selected calendar's birth month, ordered by day.
- Both birth dates and both age values remain visible in that view. Upcoming celebrations and their date-range/calendar controls remain available in the same Birthdays destination.
- On phones, search is available on demand rather than occupying the first screen. Cards, List and Table are direct icon choices with accessible labels; their selection is a local display preference.

Font provenance: unmodified [IBM Plex Sans Arabic sources at revision 3927691](https://github.com/IBM/plex/tree/39276912b05f700ee1dd491950c35d8697214208/packages/plex-sans-arabic/fonts/complete/woff2), redistributed under [SIL OFL](dist/fonts/OFL-Plex.txt). The UI font files are pinned assets, not a runtime dependency. Automated checks are not a substitute for physical-device and participant testing.

## Print workspace and reusable setups (1.9.0)

- Printable calendars offer A4 year overview, monthly pages and A3 wall presets. Manual changes are recognized as Custom; a preset does not change selected people, year, calendar, language, ages or QR choices.
- Wide dialogs show settings and a sticky preview side by side, mirrored correctly in RTL. Narrow screens and enlarged text fall back to one column.
- Section shortcuts reach Preview, People and Print settings without hiding any settings. Narrow layouts use a compact labelled section menu; focus and scroll positions account for sticky controls.
- Single-page outputs omit disabled page navigation. Selection, paper and layout are summarized beside the preview; page counts remain explicit for multi-page and QR outputs.
- Calendar and birthday-image preferences are separate. Ink and turning-age choices are remembered in their own flow; QR is never included automatically on reopening.
- Tools tiles describe their destination in Arabic and English. Core data, no-zoom behavior, dual ages and existing reading preferences are unchanged.

## Calmer app navigation and purpose-led flows (1.8.0)

- Phone navigation is now People, Birthdays and Tools. Add person stays in the header; occasional utilities no longer take a row above every family. Desktop uses the same destinations without fixed bottom navigation.
- Cards and Table are preserved. A remembered List option shows both complete calendar ages and the next birthday, with a focused person-detail dialog.
- Incoming links always offer View only or Keep/Merge, including on an empty device. Viewing does not save a family. Demo state cannot leak into a shared snapshot, and read-only views hide editing and backup actions.
- Share family opens at link/QR actions and privacy guidance, with selection below. Backup files have a separate Tools destination. Printing opens at a visible preview with year/calendar controls, before people and paper settings; phone printing fills the viewport.
- All UI icons use the pinned, bundled Lucide source and license. System typography is consistent across headings and controls; warm surfaces remain. The name stays Kin pending a separate naming decision.
- Save failures remain visible with the draft available for retry. Remove is separated from Save. Update app replaces Reload, Help identifies the release, and local-save status does not claim cloud synchronization.
- Added regressions for compact reading, first-screen access, explicit link ownership, demo/shared transitions, preview placement, separate sharing/backup and persistent errors. Physical-device text settings, keyboard/Back behavior and testing with relatives remain release follow-ups.

## Balanced calendars, feedback and Arabic polish (1.7.0)

- Today/reference dates share one component with equal font size, weight, color and line height; both calendars have explicit labels and their established sun/moon icons. Narrow layouts stack both rather than treating Hijri as a secondary date.
- Startup uses an accessible localized Loading indicator (جارٍ التحميل…) with a reduced-motion-safe spinner; failure replaces it with a retry message. Saved-language pre-paint behavior remains intact.
- Save and lazy export actions show their working state, restore their labels after failures, and keep duplicate actions disabled. Preview/export work shows progress, with explicit export cancellation. Copy feedback is also visible inside its dialog.
- Arabic selection counts and editable dates use localized digits; export text previews follow their own selected language, independently of interface language. RTL keyboard tab navigation follows visual order. Search selections explain an empty match without losing checked people.
- New app-navigation and workflow ideas are recommendations in UX-NOTES.md, not changes to the existing navigation in this release.

## Native text sizing and mobile reflow (1.6.2)

- Removed the app-specific Larger text control and ignore its legacy preference without changing family data or other preferences.
- Browser-relative type and font-relative container layouts adapt to enlarged text automatically. Touch Safari opts into system Dynamic Type; desktop Safari retains its normal text size. Android text enlargement depends on the browser's exposure of accessibility settings.
- Mobile viewport requests no pinch zoom, as a product choice. Browsers can override this for accessibility; disabling zoom limits an accessibility fallback and is not a claim of WCAG conformance.
- Automated tests approximate enlarged text at 100%, 150%, and 200%, in Arabic/English portrait and landscape, including forms, sharing, printing, and comparisons. Actual phone OS settings require device testing.

## Embedded information, fewer expanders (1.6.0–1.6.1)

Person cards show the birth weekday beside the name and days lived in a quiet footer, without More details. The table includes both facts in existing cells; future reference dates before birth do not show negative days lived. Both calendar ages and upcoming birthdays remain visible.

Today's dates are directly visible in a compact two-calendar strip. Offline status and Install app are direct controls; long repeated guidance lives in the existing Help. Sharing embeds its QR preview and uses a single-line portable-link field, with privacy guidance before the QR. Printable calendars show their people selection and keyboard-scrollable text preview directly, with bounded lists and sticky export actions. Filters retain their purposeful control toggle; informational show-more disclosures are removed. Sharing and printing open at their people-selection area without auto-scrolling to a later action or activating the phone keyboard.

## Context-aware controls (1.5.0)

Comparisons identify the older person regardless of selection order and show only their age when the younger person was born, in both calendars. Same-day births receive a neutral message. The second picker excludes the first person; changing the first person preserves the pair where possible. A restrictive family filter no longer blocks comparison: the dialog explains when it includes everyone, without changing the filters.

Group selection is hidden until a group exists. Create group opens the first group form directly; Manage groups appears after creation. Comparison and sorting are hidden for a one-person family, while reference dates remain available. These changes do not alter family links or backups.

## Lower-friction browsing (1.4.0)

Sorting and a matching-person count are visible without opening filters. Each active group, calendar-specific month, or search has its own removable chip; removing one preserves the rest and keyboard focus. Empty-list recovery resets all family filters. Cards/Table and sorting remain remembered device preferences.

On phones, family views precede occasional tools in both visual and reading order. Tool explanations are part of their large clickable buttons. Empty birthday agendas offer a one-step broader range when settings are restrictive; active milestones are labeled. Calendar exports explain an empty selection rather than failing silently, and keyboard focus stays with the birthday controls.

The 1.4.1 refinement keeps filter chips readable with very long Arabic searches and larger text, and updates the reset label immediately when languages change.

Read [UX decisions and prioritized next ideas](UX-NOTES.md). Existing family links, backups, dual-calendar ages, language startup, official Sun/Moon icons, offline behavior, and export privacy controls remain compatible.

## Startup language and simpler menus (1.3.2)

A small blocking startup script resolves the saved language and direction before the HTML shell can paint. The localized app reveals after its first render. Delayed module loading shows a short message in the chosen language; failed or very slow loading offers a localized retry. Explicit English/Arabic preferences override the browser language. Offline installation includes the startup script.

All calendar symbols use the official [Lucide Moon](https://lucide.dev/icons/moon) and [Sun](https://lucide.dev/icons/sun) SVGs, pinned to source revision dab294f313897bacaa968b725b3259fa37c17bd1. The original geometry is retained, and the Lucide/Feather license is bundled in dist/vendor/lucide-LICENSE.txt. Copy, sharing, backup, import/restore, calendar export, installation, text size and offline status use distinct icons with text labels; offline status changes its symbol with its actual state.

Menus now have clear responsibilities:

- Ages & dates: comparison and past/future reference dates.
- Calendars: printable calendars and calendar-app exports.
- Share & backup: copy/share links, optional QR, and selected-family backups.
- Import & restore: incoming links and backup files.
- Filter & organize: groups and family filters.
- Birthday agenda: birthday-image creation beside the actual event.

Duplicate calendar export, generic birthday-card, backup, group, footer-help and sidebar-copy entry points were removed. The sharing dialog has a single selection count and keeps its actions accessible while scrolling. Recovery reminders link to the existing sharing dialog. Existing family links and backups remain compatible.

## Calendar symbols and table readability (1.2.1)

Gregorian and Hijri card headings now pair sun/crescent SVGs with explicit labels. Main actions, tabs, search, filters, editing and tool choices use consistent local SVG icons alongside text; no icon library or network request is required.

Table names stay on one line without truncation. The table scrolls within its own region, with a localized hint and keyboard focus only when horizontal scrolling is needed. Birth dates remain on separate, intact lines. Mixed-direction names and countdowns in the birthday summary are isolated so Arabic and English display in the intended order.

Regression checks cover maximum-length English names, Arabic names, contained phone scrolling, calendar symbols, and labels surviving language/view switches.

## Design revision (1.2.0)

The 1.2 design restores an editorial hierarchy with warm ivory surfaces, plum and sage calendar accents, quieter borders and compact dual-calendar age cards. Add and Share are the main actions; comparison, print/export and import remain in the workspace toolbar. A visible next-birthday summary opens an unfiltered-by-milestone, full-year, both-calendar agenda. Family filters still apply.

Both calendar ages and dates remain visible, while large touch targets, remembered larger text, clear keyboard focus, Arabic layouts and saved-data protection remain intact. No payload format, dependencies or tracking were added.

Read the [UI/UX review](design-review/README.md), or open [the visual report](design-review/report.html) locally for the interactive three-version comparison. Screenshots use synthetic data. The report distinguishes measured layout changes from recommendations requiring participant testing.

## User behavior

- Add and edit a name and birth date using either calendar. Switching calendars converts a complete valid date.
- Both calendar ages, birth dates, total days lived, birth weekday, and both next-birthday countdowns appear together.
- The main URL updates after each save. Bookmark/copy a fresh link after edits: bookmarks and previously shared links are immutable snapshots, not synchronization channels.
- The app keeps a best-effort local copy to reopen from an installed app icon. The full URL is the portable source of truth.
- Sharing selects a subset and generates its URL and QR entirely offline. Large links receive a warning; links above 2,000 characters use copy/share instead of a dense QR.
- Opening an incoming link with an existing local family requires a merge review, with a view-only alternative. Explicit imports always show a review. Merge is additive; conflicts default to local values. No shared deletion propagation.
- Up to 150 people per link; Unicode names up to 120 UTF-8 bytes; birth dates from 1900-01-01 through the current local date.

## Family tools and printable exports (1.0.0)

- People supports compact cards and a horizontally scrollable table, primary-calendar selection, birth-month filtering, name search, and device-only groups. Sorting, view, calendar and export layout preferences are remembered where browser storage is available.
- Tools → Compare people shows each person's age when the other was born, in both calendars, with explicit “not born yet” and same-date behavior. Tools → Family on this date temporarily changes ages, countdowns, sorting and the overview. A persistent banner returns to today; family dates and URLs are never changed.
- Timeline provides birth history and the selected reference year's birthdays. The agenda offers selectable milestone ages and a birthday-card action for each actual birthday event.
- Export & print → Printable calendar supports complete Gregorian or Hijri years, either/both birthday types, annual month-by-month overview or month-per-page layouts, A4/A3, both orientations, English/Arabic, ink-friendly output, and optional turning ages.
- PDF and PNG share a browser-canvas page model with locally bundled Noto fonts. PDF pages use 300-dpi-equivalent images at the physical paper size; text is not selectable or tagged. An accessible text preview remains available in the app. Dense months spill into labeled continuation pages without losing names. PNG exports one page at a time; PDF includes every page.
- A selected-family QR is optional and off by default. QR links contain full selected names and birth dates even when the printed calendar hides ages; the dialog explains this. Overlarge QR payloads are rejected before export.
- Birthday cards reuse the renderer, with celebratory/minimal designs, square 1080×1080 or portrait 1080×1350 PNG output, chosen language and optional age. File sharing uses the device share sheet where supported, otherwise download.
- Groups stay in this installation's device metadata and are deliberately excluded from family links and JSON backups. Membership survives edits by stable person ID. Clearing browser storage loses groups; restored family data does not restore them.
- Save status distinguishes the device copy, copied link and initiated backup download. Only a successful full-family clipboard copy or full-family backup export satisfies the latest-family reminder. Kin cannot confirm that a downloaded file was kept safely.
- No accounts, server-side synchronization, background notifications, relationship inference, custom life events, photos or external rendering services were introduced.

### Architecture and verification

The application state is shared by the views; protected family storage, device metadata, dialog/selection controls, date/event services, people views, workspace tools, document layout/rendering and export interaction are separate modules. All saved-family changes still use cross-tab conflict checks and Web Locks; display/export operations never rewrite the portable payload. Existing v1 links and backups remain compatible.

The additional tests cover comparison/reference boundaries, device metadata isolation, preference/group preservation across tabs, 32 dense calendar-layout combinations, PDF page sizes, PNG dimensions, Arabic/RTL, export cancellation/retry, milestone filtering and real offline PDF generation. Bundled fonts and PDF runtime are included in release integrity and service-worker coverage. Native OS sharing, physical printers and imports into Apple/Google/Outlook calendars require device/product-specific checks; browser-engine testing is not a claim to have tested those integrations.

Bundled export assets: [PDF-LIB 1.17.1](https://github.com/Hopding/pdf-lib/releases/tag/v1.17.1), MIT (license under dist/vendor), and Noto Sans / Noto Sans Arabic from [Google Fonts](https://github.com/google/fonts), SIL OFL (licenses under dist/fonts). Exporting uses only these local assets and makes no third-party requests.

## Readable, age-first interface (1.1.0)

- Every person card shows Gregorian **and** Hijri years, months, days and birth dates without expanding anything. Both next birthdays and countdowns are visible together. More details only contains secondary information such as the birth weekday and total days lived.
- Everyday controls stay visible: add, share, age tools, export, search and cards/table. Sorting, groups and month filtering are under a labeled Filter & organize section. Active filters remain visible when collapsed and can be cleared with one action.
- Optional overview/help sections and the noncritical backup reminder appear after the family list. Storage errors, incoming-link warnings and historical-date banners remain prominent. Promotional copy is reduced once a family is present.
- Default text, contrast and control sizes are increased; major controls have a minimum 48-pixel target. The former device-only Larger text toggle was removed in 1.6.2 in favor of native sizing. The layout reflows at narrow widths and increased text sizes.
- Dialogs focus the first usable field/action and restore focus to the launcher, including edited cards that have been re-rendered. Motion is disabled when reduced motion is requested.
- Automated usability coverage checks dual-calendar visibility, active-filter recovery, native text sizing and legacy-preference compatibility, target sizes, focus, important card-text contrast, 320-pixel English/Arabic layouts and doubled root text. These checks supplement, but do not constitute, a complete accessibility conformance audit or usability study with real participants.
- Design references: [WAI target sizing](https://www.w3.org/WAI/WCAG22/Understanding/target-size-enhanced.html) and [text resizing](https://www.w3.org/WAI/WCAG22/Understanding/resize-text.html).

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

A save checks the local family revision before writing. If another tab has changed it, the stale save is blocked and the user can review the latest family against their current circle. Version 0.8.0 serializes this check and write using Web Locks in supporting browsers, including a task checkpoint for Firefox storage propagation. Browsers without Web Locks, or with access denied by privacy settings, retain optimistic conflict detection. This protects the device-local convenience copy, not a shared server database. Each tab's URL still holds its snapshot.

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

### Reliability and deployment hardening (0.8.0)

- Cross-tab saves use a shared Web Lock, check for stale revisions, and keep the lock until storage changes are published. Waiting saves time out after ten seconds, preserve the draft, and allow retry. Storage failures keep the family recoverable from its URL.
- Offline caches are isolated by installation path; updating one Kin installation cannot evict another. Cache read failures fall back to the network. The first installation no longer shows an update banner. Existing v1 family links and backup files remain compatible.
- Development mode avoids caching Vite's transformed assets and retires legacy development workers without forcing an editor reload. The static preview remains the place to verify offline use.
- Invalid years cannot produce non-finite dates; malformed Unicode names are rejected before lossy encoding. Damaged links opened in an existing tab provide the same recovery action as startup failures.
- A localized keyboard skip control focuses the main content without overwriting the family fragment. Invalid years focus the correct field. Static pages restrict scripts, styles and network connections to the hosting origin through a content security policy.
- Release checks verify the package/worker version, offline asset coverage, module imports, page references and install assets. CI audits dependencies, verifies desktop/mobile Chromium and Firefox, and preserves browser failure diagnostics for seven days. Changes to runtime assets require a new package/worker version before publishing.

Native installation prompts, physical camera scanning and external calendar app imports still need device-specific checks. Legacy unscoped caches are left untouched during migration so other older installations on the same origin are not disrupted.
