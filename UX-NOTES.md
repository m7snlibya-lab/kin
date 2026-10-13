# Kin: lower-friction UX decisions

## Design principle

Make the next useful action obvious without making the family list feel like a settings screen. Keep readable labels alongside icons; both calendar ages remain equally visible. Do not change family links or saved data when someone changes how they browse.

## Implemented in 1.4.0

- **Find and understand:** search stays direct, the matching-person count is visible, and sorting no longer requires opening filters. Cards/Table stays a remembered choice.
- **Recover without starting over:** group, calendar-specific month, and search filters appear as separate removable chips. Removing one preserves the others and keyboard focus. Resetting an empty list clears all family filters, not only the search text.
- **Browse before managing:** People, Birthdays, and Timeline come before occasional tools in mobile visual order and document reading order. Add person and Share & backup remain direct actions.
- **Tools explain themselves:** each tool's title and description form a single large clickable target. Printing, calendar imports, comparisons, and reference dates retain their distinct homes rather than acquiring duplicate shortcuts.
- **No silent dead ends:** exporting an empty birthday agenda explains what needs changing. A restrictive empty agenda offers a one-step 365-day, both-calendar reset while preserving the family search/group/month selection. Active milestone filtering is explicitly labeled.
- **Preserve comfort:** no change to dual ages, intact table names, the remembered language before first paint, official Lucide Sun/Moon icons, larger text, offline support, or export privacy choices.

## Next ideas, in recommended order (not implemented)

1. **Quick group switching, only when useful.** Show Everyone plus a compact group chooser once a family has groups. Avoid displaying an empty group system to first-time users. Keep all group management in one place and retain device-only labeling.
2. **A more guided first addition.** Put the name first, then an explicitly labeled Gregorian/Hijri birth-date choice, and show the converted date before Save. Test with older family members before adding extra instructions or steps.
3. **A compact large-family list.** Explore a list between full cards and the wide table: name, both ages, and next birthday. Do not remove the existing card detail or silently choose a layout on someone's behalf.
4. **Purpose-led sharing.** Explore clear choices for a family link, a printable year, or one birthday image. Any redesign should replace existing menu entries, not create another sharing menu; selection and privacy review must remain explicit.
5. **Usability testing with real relatives.** Ask a younger and an older person to add a birth date, find someone, compare ages, and print a calendar in Arabic. Measure wrong turns and completion, not just visual preference. These automated checks do not replace that evidence.

## Deliberate exclusions

No new account, cloud sync, automatic notifications, hidden icon-only actions, destructive bulk editing, or automatic view switching. Those add permissions, complexity, or data risk and need a separate product decision.

## Verification

Regression checks cover English/Arabic, RTL, narrow screens, larger text, keyboard focus, remembered preferences, filtered sharing/exports, and unchanged family links. Unit checks additionally cover date conversion, backup/import safety, offline caching, and dense printable layouts. Deployment is gated by the complete automated suite.
