# CryptoInfluencerFinder

## Current State
- DiscoverPage: project description form, niche checkboxes, min followers/engagement inputs, sortable/filterable results table, engagement vs. alignment scatter chart (table/chart toggle), save influencer to backend.
- HistoryPage: read-only table of past search queries (descriptions, niches, min followers, min engagement, date).
- SavedPage: lists bookmarked influencers.
- Backend: saveInfluencer, saveSearchQuery, getSavedInfluencers, getSearchHistory.

## Requested Changes (Diff)

### Add
- "Re-run" button on each row in HistoryPage that navigates to DiscoverPage and pre-fills the search form with the saved query parameters (project descriptions, niches, min followers, min engagement) and auto-triggers the search.

### Modify
- HistoryPage: add a "Re-run" action column with a button per row.
- DiscoverPage: accept optional URL search params (or shared state) to pre-fill and auto-run the search when navigated from History.

### Remove
- Nothing.

## Implementation Plan
1. Use TanStack Router's `navigate` with search params to pass the history query from HistoryPage to DiscoverPage.
2. In HistoryPage, add a Re-run button column. On click, serialize the query params (descriptions, niches, minFollowers, minEngagement) and navigate to `/` with those as search params.
3. In DiscoverPage, read the search params on mount. If present, pre-fill the form fields and auto-trigger handleSearch.
4. Ensure the Re-run flow resets prior results before running.
