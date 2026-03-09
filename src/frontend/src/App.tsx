import { Toaster } from "@/components/ui/sonner";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { createRootRoute, createRoute } from "@tanstack/react-router";
import Layout from "./components/Layout";
import DiscoverPage from "./pages/DiscoverPage";
import HistoryPage from "./pages/HistoryPage";
import SavedPage from "./pages/SavedPage";

/* ── Discover search params schema ───────────────────── */
export type DiscoverSearch = {
  descriptions?: string;
  niches?: string;
  minFollowers?: string;
  minEngagement?: string;
  autoRun?: string;
};

/* ── Routes ───────────────────────────────────────────── */
const rootRoute = createRootRoute({
  component: Layout,
});

const discoverRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: DiscoverPage,
  validateSearch: (search: Record<string, unknown>): DiscoverSearch => ({
    descriptions:
      typeof search.descriptions === "string" ? search.descriptions : undefined,
    niches: typeof search.niches === "string" ? search.niches : undefined,
    minFollowers:
      typeof search.minFollowers === "string" ? search.minFollowers : undefined,
    minEngagement:
      typeof search.minEngagement === "string"
        ? search.minEngagement
        : undefined,
    autoRun: typeof search.autoRun === "string" ? search.autoRun : undefined,
  }),
});

const savedRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/saved",
  component: SavedPage,
});

const historyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/history",
  component: HistoryPage,
});

const routeTree = rootRoute.addChildren([
  discoverRoute,
  savedRoute,
  historyRoute,
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

/* ── App ──────────────────────────────────────────────── */
export default function App() {
  return (
    <>
      <RouterProvider router={router} />
      <Toaster theme="dark" position="bottom-right" richColors />
    </>
  );
}
