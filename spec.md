# CryptoInfluencerFinder

## Current State
- Discover page: search influencers by project description, niches, min followers, min engagement; sortable/filterable results table + engagement vs. alignment chart
- History page: lists past searches with Re-run button that pre-fills and auto-runs the Discover page
- Saved page: displays bookmarked influencers in a table with remove action

## Requested Changes (Diff)

### Add
- CSV export button on the Saved page that downloads all saved influencers as a `.csv` file
- Columns: Handle, Followers, Avg Engagement (%), Alignment Score, Niche, Saved Date, Example Tweet URL

### Modify
- SavedPage.tsx: add "Export CSV" button in the table header row (top-right), visible only when there are saved influencers

### Remove
- Nothing

## Implementation Plan
1. Add `exportSavedCSV` utility function that converts the influencer array to a CSV string and triggers a browser download
2. Add "Export CSV" button with a Download icon to the header area of the saved table (right side, next to the count label)
3. Wire button to the export utility, passing current `influencers` array
4. Add deterministic marker `saved.export_button` to the new button
