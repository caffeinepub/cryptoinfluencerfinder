# CryptoInfluencerFinder

## Current State

The app has:
- A Discover page with a mock data generator (`mockData.ts`) that produces fake influencer results. Results include placeholder twitter.com URLs but no real X profile or tweet links.
- A Saved page where influencers can be bookmarked.
- A History page with Re-run support.
- A backend in Motoko that stores influencers and search history per user (authorization via Internet Identity).
- No X API integration — all data is simulated.
- No settings page for API credentials.

## Requested Changes (Diff)

### Add
- **Settings page** (`/settings`) with a form to save an X API Bearer Token. Token is stored in the backend canister (admin-level or per-user).
- **Backend `setXApiToken` / `getXApiToken`** functions to store the Bearer Token securely.
- **Backend `searchXInfluencers` function** using HTTP outcalls to the X API v2:
  - `GET /2/users/search` (or `GET /2/tweets/search/recent`) with keywords derived from project descriptions and niches.
  - Returns user public_metrics (followers_count, tweet_count), plus recent tweets with public_metrics (like_count, retweet_count, reply_count).
  - Computes alignment score, avg engagement rate on the backend, returns typed `Influencer` array.
- **Navigation link to Settings** in the Layout.
- **Live data status badge** (green "Live — X API") replacing the yellow simulated-data warning when real data is returned.
- **Real X profile URLs** in results: `https://x.com/<username>` as clickable links on handles.
- **Real tweet URLs**: `https://x.com/<username>/status/<tweet_id>` in the expanded tweet rows.

### Modify
- **DiscoverPage `handleSearch`**: Call backend `searchXInfluencers` instead of `generateMockInfluencers`. Fall back to mock data with a warning if no token is configured.
- **Layout**: Add Settings nav item with a gear icon.
- **`backend.d.ts`**: Add `setXApiToken`, `getXApiToken`, `searchXInfluencers` function signatures.

### Remove
- The yellow "Results are simulated" warning banner (replace with live/offline badge depending on token state).

## Implementation Plan

1. Update `main.mo` to:
   - Store a single X API Bearer Token (admin sets it, visible to backend).
   - Implement `setXApiToken(token: Text)` and `getXApiToken()` functions.
   - Implement `searchXInfluencers(params)` using IC HTTP outcalls to X API v2 user/tweet search.
   - Parse JSON response, compute engagement + alignment scores, return `[Influencer]`.
2. Regenerate `backend.d.ts` to expose the new functions.
3. Add `SettingsPage.tsx` with a Bearer Token input form calling `setXApiToken`.
4. Add `/settings` route in `App.tsx` and nav link in `Layout.tsx`.
5. Update `DiscoverPage.tsx` to call `searchXInfluencers` (via backend actor), render real X profile links on handles, and render real tweet URLs in expanded rows. Show live badge when token is set; show simulated warning + use mock fallback when it is not.
