# Manual browser QA checklist

Run with `npm install && npm run dev` on Node 22.12+.

- [ ] Overview renders four metric cards, visual banner, weekly chart, action center and upcoming shift table.
- [ ] Navigation works for all six screens on desktop and mobile.
- [ ] Schedule navigates weeks and filters by department; the Today button returns to the current week.
- [ ] New shift can be created and edited, then deleted.
- [ ] Conflict with an existing shift displays an error; invalid end time displays an error.
- [ ] Smart assistant recommends an eligible person and shows why; individual assign succeeds.
- [ ] Auto-fill previews changes and fills up to four demo open positions.
- [ ] Team directory supports search, department filter, add/edit and archive.
- [ ] Approved leave with overlapping assignments is blocked, then succeeds when shifts are reassigned/deleted.
- [ ] Reports visualize working hours and department allocation.
- [ ] Export CSV opens in spreadsheet apps; exported cells beginning with formula operators are sanitized.
- [ ] Browser refresh preserves changes.
- [ ] Settings export creates a JSON file; import restores validated JSON, rejects malformed data.
- [ ] Reset restores demo workspace.
- [ ] Check keyboard tab navigation and phone-size responsive layout.

This checklist is intended for manual verification in a real browser. An automated browser E2E suite is not part of this version.

- [ ] Export for Excel (Schedule, Team, Reports); double-click the file in Windows Excel and confirm dates, times, names and monetary amounts appear in separate columns.
- [ ] Export CSV (standard); confirm comma-separated values with no `sep=` header.
- [ ] Auto-fit the Date column if Excel shows `#######`; the underlying dates should be present.
