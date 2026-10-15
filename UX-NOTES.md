# Kin: lower-friction UX decisions

## Design principle

Make the next useful action obvious without making the family list feel like a settings screen. Keep readable labels alongside icons; both calendar ages remain equally visible. Do not change family links or saved data when someone changes how they browse.

## Implemented in 1.4.0–1.4.1

- **Find and understand:** search stays direct, the matching-person count is visible, and sorting no longer requires opening filters. Cards/Table stays a remembered choice.
- **Recover without starting over:** group, calendar-specific month, and search filters appear as separate removable chips. Removing one preserves the others and keyboard focus. On narrow screens chips stack at full width; long search summaries use two lines with the complete query retained in the accessible name and tooltip. Resetting an empty list clears all family filters, not only the search text.
- **Browse before managing:** People, Birthdays, and Timeline come before occasional tools in mobile visual order and document reading order. Add person and Share & backup remain direct actions.
- **Tools explain themselves:** each tool's title and description form a single large clickable target. Printing, calendar imports, comparisons, and reference dates retain their distinct homes rather than acquiring duplicate shortcuts.
- **No silent dead ends:** exporting an empty birthday agenda explains what needs changing. A restrictive empty agenda offers a one-step 365-day, both-calendar reset while preserving the family search/group/month selection. Active milestone filtering is explicitly labeled.
- **Preserve comfort:** no change to dual ages, intact table names, the remembered language before first paint, official Lucide Sun/Moon icons, larger text, offline support, or export privacy choices.

## Context-aware controls in 1.5.0

- Identify older/younger automatically and show one useful age-at-birth answer in both calendars; do not show the reverse “not born yet” result. Same-day births do not assign an older person.
- Prevent same-person comparisons without error messages. Preserve the pair when changing selection order.
- Allow comparison even if fewer than two people match the family filters, explaining the broader scope without clearing the filters.
- Hide empty group selection and open first-group creation directly. Restore the empty-group state when the last group is deleted. Keep group names, membership, and family links unchanged by browsing.
- Hide comparison and sorting in a one-person family, but retain the useful reference-date tool.

## Embedded content in 1.6.0–1.6.1

- Birth weekdays belong beside names; days lived are a quiet card footer. The table embeds these facts in existing cells instead of adding more columns. No generic More details action is needed.
- Today's calendar dates and offline/installation status are directly visible. Long explanations remain in the existing Help rather than in a second footer disclosure.
- Sharing includes a direct QR preview and keeps the encoded URL to a single line. Privacy guidance precedes the QR; copying and backup remain the primary actions.
- Printable calendars expose their selected people and readable text preview directly. Bounded, keyboard-accessible scroll regions keep large families manageable without show-more toggles.
- Sharing and printing focus the initial selection checkbox and reset the dialog to the top, so embedding content does not cause a jump to a lower action or open the phone keyboard.
- The family filter toggle remains: it controls optional tools, not essential reading content. Dual ages, reference-date behavior, and portable data are unchanged.

## Native sizing and mobile behavior in 1.6.2

- Remove a second text-size preference from the header; use relative text sizes and automatic, font-relative reflow instead. Legacy largeText values no longer override native settings; other saved preferences and family links remain intact.
- Touch Safari opts into Dynamic Type through its system-body style. Do not apply that style to desktop Safari, which has a smaller system-body baseline. Allow browser text adjustment; Android system font settings are browser-dependent.
- Container queries respond to actual text size, stacking dual ages and controls only when their space requires it. Do not hide either calendar.
- At the user's explicit request, the viewport disables mobile pinch zoom where the browser honors it. Browser accessibility overrides may still allow zoom. This removes an accessibility fallback and should not be represented as WCAG conformance.
- Automated enlarged-root tests are a layout approximation, not proof of real iOS/Android settings. Physical phone accessibility settings remain a device-specific verification item.

## Calendar equality, feedback and Arabic in 1.7.0

- Legacy today-g styling was semantically promoting Gregorian dates. Replace both variants with identical date-value typography and explicit, equally styled calendar labels. Preserve both date values in reference mode as well.
- Use a real live-status loading indicator rather than a family-specific startup sentence. Stop the spinner for reduced motion and remove it on success or failure; retain pre-paint language selection and retry recovery.
- Give save/export work a visible status rather than only a disabled button. Restore labels on failure, announce results inside active dialogs, and preserve drafts, cancellation, duplicate-save protection, and undo.
- Localize selection counts and editable dates, use neutral Arabic count headings where plural grammar would otherwise be wrong, and keep Arabic terminology consistent around family members.
- Make RTL keyboard movement mirror the visual tab order; use logical spacing and isolate preview content according to its selected language. Explain selection searches with no matches without clearing checked people.

## Print refinement in 1.9.0

Purpose-led presets reduce repetitive setup without changing who or what is shared. Preview, people and settings remain available as sections rather than generic Show more disclosures. A compact section menu avoids three stacked navigation buttons at enlarged phone text sizes. Desktop uses a mirrored side-by-side workspace only when font-relative space permits it.

Calendar and birthday-image preferences must not overwrite each other. Turning-age disclosure is remembered separately for each task; a calendar age preference does not silently reveal ages on a birthday image. QR remains an explicit choice for every new print session.

## Earlier app-like direction (implemented in 1.8.0 where noted above)

The compact app shell, List/person detail, plain edit titles, purpose-led sharing/backup and preview-first printing are now implemented. Direct group choices were added in 1.12.0. The items below preserve the original rationale; participant/physical-device testing remains future work.

### Original recommended order

1. **A compact phone app shell.** Explore bottom navigation with People, Birthdays, and Tools, plus one clearly labeled Add person action. Replace the existing mobile navigation/tool rows rather than duplicating them. Put occasional timeline/export/group operations in Tools. Respect safe areas and the on-screen keyboard; keep desktop navigation appropriate to desktop. Validate with younger and older relatives before shipping.
2. **A compact family list with a person sheet.** Name, both ages, and the next birthday make the list scannable; tap a person for their full details and edit/share actions. Keep both ages visible and preserve existing card/table choices. Do not make swipe or long-press the only way to find an action.
3. **One calm add/edit flow.** Use plain labels, calendar choice beside the date, and a converted-date confirmation beside Save. Reduce repeated explanations; use inline errors and explicit save success. Do not add mandatory multi-step onboarding or guess a person's calendar from their name/language.
4. **Purpose-led sharing.** Present clear destinations: send a family link, print a year, or send one birthday image. Replace overlapping existing entries, preserve selected people across the flow, and show the privacy review before sharing. No silent cloud upload.
5. **Useful filters only when needed.** Keep search direct; add quick group switching once groups exist and a clear current selection. Retain result counts and removable filter chips. Hide irrelevant controls without silently changing saved choices.

Test each prototype with a younger and an older relative: add a date, find a person, compare ages, share a link, and print a year. Measure wrong turns and completion before adding gestures, reminders, accounts, or new preferences.

## Deliberate exclusions

No new account, cloud sync, automatic notifications, hidden icon-only actions, destructive bulk editing, or automatic view switching. Those add permissions, complexity, or data risk and need a separate product decision.

## Corrective review in 1.10.0

A visually consistent screen can still mislead. The review found calendar semantics diverging from the selection: a Hijri-only agenda grouped events under Gregorian months, and the table calculated a Hijri next birthday but formatted its date as Gregorian. Calendar selection must affect grouping, date badges and ranges together. Events now include both dates, while the selected calendar governs their organization.

Typography now uses a single self-hosted IBM Plex Sans Arabic family with real regular, medium and semibold files. This replaces the Arabic Tahoma fallback, including form controls and headings, without overriding native root text sizing. Both ages and both current dates retain equal prominence. Export typography is unchanged.

Shared-family reading is reversible: Return to my family restores the local family and previous reading context without writing shared people to storage. A cancelled merge review stays in shared-view mode. On an empty device, recipients see plain View/Keep choices rather than zero-valued conflict summaries; pasted imports/backups have appropriate saving language. Empty-selection saving and empty-family sharing no longer present misleading actions.

Remembering the last successfully used birth-entry calendar removes repeated switching without guessing from the person's name or interface language. Existing records retain their own calendar; the reference-date tool begins in the preferred calendar.

Remaining evidence gaps: physical iOS/Android accessibility settings, browser/hardware Back with modal drafts, live Arabic VoiceOver/TalkBack, and task completion with younger/older relatives. These are not certified by viewport emulation. Keep the requested no-zoom viewport, but do not call this accessibility conformance. Product naming, notifications and cloud sync remain separate decisions, not features to add during this corrective pass.

## Family-first browsing in 1.11.0

- People is the default focus; on phones, search opens only when requested and stays visible while a query is active. Cards, List, and Table use direct, labelled icon buttons instead of a layout dropdown.
- Remove month as a roster filter. The Birthdays destination keeps its upcoming agenda and adds a By month mode, with an explicit Gregorian/Hijri choice. Each family member appears once in the selected calendar's birth month; both birth dates and both current/reference ages remain visible.
- Month sections are ordered by calendar month, omit empty months, and order people by day then localized name. Filtered family/group/search scope is preserved when browsing.
- Keep the mode and calendar choice as local display preferences only; they do not alter family records, links, or exports. Calendar exports remain in the Upcoming agenda.

## Review refinements in 1.11.1

- Group birth months in the domain layer and render them with the other family views. Grouping retains the original birth day (including Gregorian February 29 and Hijri day 30), sorts without mutating records, and uses localized names with stable tie-breaking.
- Show the chosen calendar first in both birth dates and ages. Label ages as today or the reference date, remove historical weekdays from recurring month browsing, and make the complete person row a keyboard-accessible details button. Saving an edit preserves the reading view and returns focus to the visible updated row.
- Announce the small month summary rather than rereading the entire family. Localize month help headings, counts, search controls and calendar choices; use the existing sun/moon icon system.
- Keep search optional on desktop as well as phones. Put search, layout, options and sorting in one toolbar, remove the superseded layout select, explain the calendar setting accurately, and restore visible focus after resetting either searches or groups. Escape closes search and restores the complete family.
- Reflow month controls and both calendar facts with enlarged text, without fixed minimum widths that overflow phones. Keep filters and calendar exports scoped to the same people, and preserve family links across browsing changes.
- Restore readable repository documentation and check its encoding and release metadata before deployment.

## Direct family controls in 1.12.0

- Remove the expanding Options/filter menu. Existing groups appear directly above People, Birthdays and Timeline as wrapping, one-tap buttons with a clear Everyone choice. Counts include only current family members; long names remain readable with enlarged text and RTL.
- Group creation and management have one home in Tools. A family without groups has no empty browsing controls. Creating the first group still opens its editor directly; group metadata stays on the device.
- Replace the calendar dropdown with the shared sun/moon segmented control. It is directly visible in Tools and moves into context for birthday sorting, the table or timeline, where it changes the displayed dates. Ordinary dual-age cards retain their uncluttered presentation. Only one calendar-preference control exists.
- Show group selection through its pressed button rather than a duplicate removable group chip. Search remains optional, can be cleared independently of the group, and retains visible keyboard focus. Empty-view recovery resets both scopes without changing family links.
- Fix long month headings overflowing at doubled text size on narrow phones. Preserve local preference storage, both ages, shared-view safeguards and scoped exports.

## Verification

Regression checks cover English/Arabic, RTL, narrow screens, larger text, keyboard focus, remembered preferences, filtered sharing/exports, and unchanged family links. Unit checks additionally cover date conversion, backup/import safety, offline caching, and dense printable layouts. Deployment is gated by the complete automated suite.
