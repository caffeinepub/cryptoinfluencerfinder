import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useSearch } from "@tanstack/react-router";
import {
  AlertCircle,
  BarChart2,
  Bookmark,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Loader2,
  Plus,
  Search,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  CartesianGrid,
  Cell,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  XAxis,
  YAxis,
} from "recharts";
import type { Influencer } from "../backend.d";
import { AlignmentBadge } from "../components/AlignmentBadge";
import {
  useGetSavedInfluencers,
  useSaveInfluencer,
  useSaveSearchQuery,
} from "../hooks/useQueries";
import { generateMockInfluencers } from "../utils/mockData";

const NICHES = ["DeFi", "Memes", "AI Crypto", "GameFi", "NFTs", "L2", "Web3"];

function formatFollowers(n: bigint): string {
  const num = Number(n);
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toString();
}

type DescEntry = { id: string; text: string };
let descCounter = 0;
function newDescEntry(text = ""): DescEntry {
  descCounter += 1;
  return { id: `desc-${descCounter}`, text };
}

type SortCol = "handle" | "followers" | "avgEngagement" | "alignmentScore";
type SortDir = "asc" | "desc";

function dotColor(score: number): string {
  if (score >= 70) return "#22c55e";
  if (score >= 40) return "#f59e0b";
  return "#ef4444";
}

interface ChartTooltipPayload {
  handle: string;
  alignmentScore: number;
  avgEngagement: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: ChartTooltipPayload }>;
}

function CustomChartTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-card border border-border rounded-lg px-3 py-2 text-xs shadow-lg">
      <p className="font-mono font-semibold text-primary mb-1">{d.handle}</p>
      <p className="text-muted-foreground">
        Alignment:{" "}
        <span className="text-foreground font-mono">{d.alignmentScore}</span>
      </p>
      <p className="text-muted-foreground">
        Engagement:{" "}
        <span className="text-foreground font-mono">
          {d.avgEngagement.toFixed(1)}%
        </span>
      </p>
    </div>
  );
}

export default function DiscoverPage() {
  const searchParams = useSearch({ from: "/" });

  const [descEntries, setDescEntries] = useState<DescEntry[]>(() => {
    if (searchParams.descriptions) {
      const parts = searchParams.descriptions
        .split("||")
        .filter(Boolean)
        .map((text) => newDescEntry(text));
      return parts.length > 0 ? parts : [newDescEntry()];
    }
    return [newDescEntry()];
  });
  const [selectedNiches, setSelectedNiches] = useState<string[]>(() => {
    if (searchParams.niches) {
      return searchParams.niches.split(",").filter(Boolean);
    }
    return [];
  });
  const [minFollowers, setMinFollowers] = useState(
    searchParams.minFollowers ?? "8000",
  );
  const [minEngagement, setMinEngagement] = useState(
    searchParams.minEngagement ?? "1.5",
  );
  const [results, setResults] = useState<Influencer[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [expandedTweets, setExpandedTweets] = useState<Set<number>>(new Set());
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  // Auto-run flag: fires handleSearch once when re-run params are present
  const shouldAutoRun = useRef(searchParams.autoRun === "1");

  // Sorting state
  const [sortCol, setSortCol] = useState<SortCol>("alignmentScore");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  // Filtering state
  const [filterHandle, setFilterHandle] = useState("");
  const [filterNiche, setFilterNiche] = useState("");

  // View toggle: table vs chart
  const [activeView, setActiveView] = useState<"table" | "chart">("table");

  const descriptions = descEntries.map((e) => e.text);

  const saveInfluencer = useSaveInfluencer();
  const saveSearchQuery = useSaveSearchQuery();
  const { data: savedInfluencers } = useGetSavedInfluencers();

  // Track already-saved influencers from backend
  const savedBackendIds = new Set(savedInfluencers?.map((inf) => inf.id) ?? []);

  // Unique niches from current results
  const availableNiches = useMemo(() => {
    const niches = new Set(results.map((r) => r.niche));
    return Array.from(niches).sort();
  }, [results]);

  // Derived: filtered + sorted results
  const displayResults = useMemo(() => {
    let filtered = results;

    if (filterHandle.trim()) {
      const q = filterHandle.toLowerCase();
      filtered = filtered.filter((r) => r.handle.toLowerCase().includes(q));
    }

    if (filterNiche) {
      filtered = filtered.filter((r) => r.niche === filterNiche);
    }

    const sorted = [...filtered].sort((a, b) => {
      let valA: number | string;
      let valB: number | string;

      switch (sortCol) {
        case "handle":
          valA = a.handle.toLowerCase();
          valB = b.handle.toLowerCase();
          break;
        case "followers":
          valA = Number(a.followers);
          valB = Number(b.followers);
          break;
        case "avgEngagement":
          valA = a.avgEngagement;
          valB = b.avgEngagement;
          break;
        default:
          valA = Number(a.alignmentScore);
          valB = Number(b.alignmentScore);
          break;
      }

      if (valA < valB) return sortDir === "asc" ? -1 : 1;
      if (valA > valB) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [results, filterHandle, filterNiche, sortCol, sortDir]);

  // Chart data
  const chartData = useMemo(
    () =>
      displayResults.map((r) => ({
        handle: r.handle,
        alignmentScore: Number(r.alignmentScore),
        avgEngagement: r.avgEngagement,
      })),
    [displayResults],
  );

  const handleSortChange = (col: SortCol) => {
    if (sortCol === col) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortCol(col);
      setSortDir("asc");
    }
    // Reset expanded tweets on sort
    setExpandedTweets(new Set());
  };

  const addDescription = () => {
    if (descEntries.length < 3)
      setDescEntries([...descEntries, newDescEntry()]);
  };

  const removeDescription = (id: string) => {
    setDescEntries(descEntries.filter((e) => e.id !== id));
  };

  const updateDescription = (id: string, value: string) => {
    setDescEntries(
      descEntries.map((e) => (e.id === id ? { ...e, text: value } : e)),
    );
  };

  const toggleNiche = (niche: string) => {
    setSelectedNiches((prev) =>
      prev.includes(niche) ? prev.filter((n) => n !== niche) : [...prev, niche],
    );
  };

  const toggleTweetExpand = (idx: number) => {
    setExpandedTweets((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const handleSearch = useCallback(async () => {
    const validDescriptions = descriptions.filter((d) => d.trim().length > 0);
    if (validDescriptions.length === 0) return;

    setIsSearching(true);
    setHasSearched(false);
    setFilterHandle("");
    setFilterNiche("");

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 1800));

    const mockResults = generateMockInfluencers(
      validDescriptions,
      selectedNiches,
      Number(minFollowers) || 8000,
      Number(minEngagement) || 1.5,
      10,
    );

    setResults(mockResults);
    setHasSearched(true);
    setIsSearching(false);
    setSavedIds(new Set());

    // Save search query to backend
    saveSearchQuery.mutate({
      id: `sq_${Date.now()}`,
      projectDescriptions: validDescriptions,
      niches: selectedNiches,
      minFollowers: BigInt(Number(minFollowers) || 8000),
      minEngagement: Number(minEngagement) || 1.5,
      createdAt: BigInt(Date.now()),
    });
  }, [
    descriptions,
    selectedNiches,
    minFollowers,
    minEngagement,
    saveSearchQuery,
  ]);

  // Trigger auto-run once when navigating from history Re-run button
  useEffect(() => {
    if (shouldAutoRun.current) {
      shouldAutoRun.current = false;
      handleSearch();
    }
  }, [handleSearch]);

  const handleSave = (influencer: Influencer) => {
    const toSave = { ...influencer, savedAt: BigInt(Date.now()) };
    saveInfluencer.mutate(toSave, {
      onSuccess: () => {
        setSavedIds((prev) => new Set([...prev, influencer.id]));
      },
    });
  };

  const isSaved = (id: string) => savedIds.has(id) || savedBackendIds.has(id);

  function SortIcon({ col }: { col: SortCol }) {
    if (sortCol !== col) return null;
    return sortDir === "asc" ? (
      <ChevronUp className="inline w-3 h-3 ml-0.5 text-primary" />
    ) : (
      <ChevronDown className="inline w-3 h-3 ml-0.5 text-primary" />
    );
  }

  return (
    <div className="px-4 md:px-8 py-6 max-w-7xl mx-auto">
      {/* ── Header ──────────────────────────────────────── */}
      <header className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
          Influencer <span className="text-primary">Discovery</span>
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Describe your crypto project and we'll surface the most aligned voices
          on X/Twitter.
        </p>
      </header>

      {/* ── Search Form ─────────────────────────────────── */}
      <div className="bg-card border border-border rounded-lg p-5 md:p-6 mb-6">
        <div className="space-y-5">
          {/* Project Descriptions */}
          <div className="space-y-3">
            <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Project Descriptions
            </Label>
            <AnimatePresence initial={false}>
              {descEntries.map((entry, idx) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="relative"
                >
                  <div className="flex items-start gap-2">
                    <div className="flex-1">
                      <Label
                        htmlFor={entry.id}
                        className="text-xs text-muted-foreground mb-1.5 block"
                      >
                        Project Description {idx + 1}
                      </Label>
                      <Textarea
                        id={entry.id}
                        value={entry.text}
                        onChange={(e) =>
                          updateDescription(entry.id, e.target.value)
                        }
                        placeholder={
                          idx === 0
                            ? "e.g. Layer-2 on Solana for high-speed meme trading with 0.0001 fees..."
                            : "e.g. AI agent launchpad with on-chain personality NFTs..."
                        }
                        className="min-h-[80px] text-sm bg-muted/50 border-border resize-none focus:ring-primary/30"
                        data-ocid={
                          idx === 0 ? "discover.search_input" : undefined
                        }
                      />
                    </div>
                    {idx > 0 && (
                      <button
                        type="button"
                        onClick={() => removeDescription(entry.id)}
                        className="mt-6 p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        aria-label="Remove description"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {descEntries.length < 3 && (
              <button
                type="button"
                onClick={addDescription}
                className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors font-medium"
              >
                <Plus className="w-3.5 h-3.5" />
                Add another project description
              </button>
            )}
          </div>

          {/* Niches */}
          <div className="space-y-2.5">
            <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Target Niches
            </Label>
            <div className="flex flex-wrap gap-2">
              {NICHES.map((niche) => (
                <label
                  key={niche}
                  htmlFor={`niche-${niche}`}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-md border text-xs font-medium cursor-pointer transition-all duration-150",
                    selectedNiches.includes(niche)
                      ? "bg-primary/15 border-primary/40 text-primary"
                      : "bg-muted/40 border-border text-muted-foreground hover:border-primary/30 hover:text-foreground",
                  )}
                >
                  <Checkbox
                    id={`niche-${niche}`}
                    checked={selectedNiches.includes(niche)}
                    onCheckedChange={() => toggleNiche(niche)}
                    className="w-3 h-3"
                  />
                  {niche}
                </label>
              ))}
            </div>
          </div>

          {/* Min Followers + Min Engagement */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label
                htmlFor="min-followers"
                className="text-xs text-muted-foreground"
              >
                Min Followers
              </Label>
              <Input
                id="min-followers"
                type="number"
                value={minFollowers}
                onChange={(e) => setMinFollowers(e.target.value)}
                min={0}
                className="bg-muted/50 border-border h-9 text-sm font-mono"
                data-ocid="discover.min_followers.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label
                htmlFor="min-engagement"
                className="text-xs text-muted-foreground"
              >
                Min Avg Engagement (%)
              </Label>
              <Input
                id="min-engagement"
                type="number"
                value={minEngagement}
                onChange={(e) => setMinEngagement(e.target.value)}
                min={0}
                step={0.1}
                className="bg-muted/50 border-border h-9 text-sm font-mono"
                data-ocid="discover.min_engagement.input"
              />
            </div>
          </div>

          {/* CTA */}
          <Button
            onClick={handleSearch}
            disabled={isSearching || descriptions.every((d) => d.trim() === "")}
            className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90 font-semibold shadow-glow-cyan transition-all duration-200"
            data-ocid="discover.primary_button"
          >
            {isSearching ? (
              <>
                <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                Scanning X/Twitter...
              </>
            ) : (
              <>
                <Search className="mr-2 w-4 h-4" />
                Discover Influencers
              </>
            )}
          </Button>
        </div>
      </div>

      {/* ── Loading State ────────────────────────────────── */}
      <AnimatePresence>
        {isSearching && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-2"
            data-ocid="discover.loading_state"
          >
            {(["s1", "s2", "s3", "s4", "s5"] as const).map((skId) => (
              <div
                key={skId}
                className="flex gap-3 items-center px-4 py-3 bg-card border border-border rounded-lg"
              >
                <Skeleton className="w-24 h-4 bg-muted/60" />
                <Skeleton className="w-16 h-4 bg-muted/60" />
                <Skeleton className="w-16 h-4 bg-muted/60" />
                <Skeleton className="w-12 h-5 rounded bg-muted/60" />
                <Skeleton className="w-14 h-4 bg-muted/60" />
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Results ─────────────────────────────────────── */}
      <AnimatePresence>
        {hasSearched && !isSearching && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Simulated data notice */}
            <div className="flex items-start gap-2 p-3 mb-4 rounded-lg bg-score-mid/10 border border-score-mid/25 text-xs text-score-mid">
              <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              <span>
                Results are simulated. Connect real X API keys for live data.
              </span>
            </div>

            {/* ── Filter bar ──────────────────────────────── */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <div className="relative flex-1 min-w-[160px] max-w-xs">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                <Input
                  value={filterHandle}
                  onChange={(e) => setFilterHandle(e.target.value)}
                  placeholder="Filter by handle…"
                  className="pl-8 h-8 text-xs bg-muted/50 border-border font-mono"
                  data-ocid="discover.filter.input"
                />
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setFilterNiche("")}
                  className={cn(
                    "px-2.5 py-1 rounded text-xs font-medium border transition-all duration-150",
                    filterNiche === ""
                      ? "bg-primary/15 border-primary/40 text-primary"
                      : "bg-muted/40 border-border text-muted-foreground hover:border-primary/30 hover:text-foreground",
                  )}
                  data-ocid="discover.filter.niche.all"
                >
                  All
                </button>
                {availableNiches.map((niche, idx) => (
                  <button
                    key={niche}
                    type="button"
                    onClick={() =>
                      setFilterNiche((prev) => (prev === niche ? "" : niche))
                    }
                    className={cn(
                      "px-2.5 py-1 rounded text-xs font-medium border transition-all duration-150",
                      filterNiche === niche
                        ? "bg-primary/15 border-primary/40 text-primary"
                        : "bg-muted/40 border-border text-muted-foreground hover:border-primary/30 hover:text-foreground",
                    )}
                    data-ocid={`discover.filter.niche.${idx + 1}`}
                  >
                    {niche}
                  </button>
                ))}
              </div>
            </div>

            {/* ── View toggle + count header ───────────────── */}
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <div className="px-4 py-3 border-b border-border flex items-center justify-between scan-line">
                <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  {displayResults.length} Influencers Found
                </span>

                {/* Table / Chart toggle */}
                <div className="flex items-center gap-1 bg-muted/50 rounded-md p-0.5">
                  <button
                    type="button"
                    onClick={() => setActiveView("table")}
                    className={cn(
                      "flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-medium transition-all duration-150",
                      activeView === "table"
                        ? "bg-card text-foreground shadow-sm border border-border/60"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                    data-ocid="discover.results.table.tab"
                  >
                    <BarChart2 className="w-3 h-3 rotate-90" />
                    Table
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveView("chart")}
                    className={cn(
                      "flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-medium transition-all duration-150",
                      activeView === "chart"
                        ? "bg-card text-foreground shadow-sm border border-border/60"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                    data-ocid="discover.results.chart.tab"
                  >
                    <BarChart2 className="w-3 h-3" />
                    Chart
                  </button>
                </div>
              </div>

              {/* ── TABLE VIEW ──────────────────────────────── */}
              {activeView === "table" && (
                <div className="overflow-x-auto">
                  <Table data-ocid="discover.results.table">
                    <TableHeader>
                      <TableRow className="border-border hover:bg-transparent">
                        <TableHead
                          className="text-xs text-muted-foreground font-semibold cursor-pointer select-none hover:text-foreground transition-colors"
                          onClick={() => handleSortChange("handle")}
                        >
                          Handle <SortIcon col="handle" />
                        </TableHead>
                        <TableHead
                          className="text-xs text-muted-foreground font-semibold cursor-pointer select-none hover:text-foreground transition-colors"
                          onClick={() => handleSortChange("followers")}
                        >
                          Followers <SortIcon col="followers" />
                        </TableHead>
                        <TableHead
                          className="text-xs text-muted-foreground font-semibold cursor-pointer select-none hover:text-foreground transition-colors"
                          onClick={() => handleSortChange("avgEngagement")}
                        >
                          Avg Engagement <SortIcon col="avgEngagement" />
                        </TableHead>
                        <TableHead
                          className="text-xs text-muted-foreground font-semibold cursor-pointer select-none hover:text-foreground transition-colors"
                          onClick={() => handleSortChange("alignmentScore")}
                        >
                          Alignment <SortIcon col="alignmentScore" />
                        </TableHead>
                        <TableHead className="text-xs text-muted-foreground font-semibold">
                          Niche
                        </TableHead>
                        <TableHead className="text-xs text-muted-foreground font-semibold text-right">
                          Actions
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {displayResults.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={6}
                            className="text-center py-10 text-sm text-muted-foreground"
                            data-ocid="discover.results.empty_state"
                          >
                            No influencers match your filters.
                          </TableCell>
                        </TableRow>
                      ) : (
                        displayResults.map((influencer, idx) => (
                          <Fragment key={influencer.id}>
                            <TableRow
                              data-ocid={`discover.results.item.${idx + 1}`}
                              className="border-border hover:bg-muted/20 transition-colors"
                            >
                              <TableCell className="font-mono text-sm text-primary font-semibold">
                                {influencer.handle}
                              </TableCell>
                              <TableCell className="font-mono text-sm text-foreground">
                                {formatFollowers(influencer.followers)}
                              </TableCell>
                              <TableCell className="font-mono text-sm text-foreground">
                                {influencer.avgEngagement.toFixed(1)}%
                              </TableCell>
                              <TableCell>
                                <AlignmentBadge
                                  score={Number(influencer.alignmentScore)}
                                />
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant="secondary"
                                  className="text-[11px] bg-secondary/60 text-secondary-foreground border-none"
                                >
                                  {influencer.niche}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    type="button"
                                    onClick={() => toggleTweetExpand(idx)}
                                    className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-primary transition-colors px-2 py-1 rounded border border-border hover:border-primary/30"
                                    aria-label="View tweets"
                                  >
                                    Tweets
                                    {expandedTweets.has(idx) ? (
                                      <ChevronUp className="w-3 h-3" />
                                    ) : (
                                      <ChevronDown className="w-3 h-3" />
                                    )}
                                  </button>
                                  <Button
                                    size="sm"
                                    variant={
                                      isSaved(influencer.id)
                                        ? "secondary"
                                        : "outline"
                                    }
                                    disabled={
                                      isSaved(influencer.id) ||
                                      saveInfluencer.isPending
                                    }
                                    onClick={() => handleSave(influencer)}
                                    className={cn(
                                      "h-7 text-[11px] px-2.5 border",
                                      isSaved(influencer.id)
                                        ? "bg-primary/15 text-primary border-primary/30"
                                        : "border-border hover:border-primary/40 hover:text-primary",
                                    )}
                                    data-ocid={`discover.save_button.${idx + 1}`}
                                  >
                                    <Bookmark
                                      className={cn(
                                        "w-3 h-3 mr-1",
                                        isSaved(influencer.id) &&
                                          "fill-current",
                                      )}
                                    />
                                    {isSaved(influencer.id) ? "Saved" : "Save"}
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>

                            {/* Expanded tweet URLs row */}
                            {expandedTweets.has(idx) && (
                              <TableRow className="border-border bg-muted/10">
                                <TableCell colSpan={6} className="py-2 px-4">
                                  <div className="flex flex-wrap gap-2">
                                    {influencer.exampleTweetUrls.map(
                                      (url, tIdx) => (
                                        <a
                                          key={url}
                                          href={url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="flex items-center gap-1 text-[11px] text-primary/80 hover:text-primary transition-colors font-mono"
                                        >
                                          <ExternalLink className="w-3 h-3 shrink-0" />
                                          Tweet #{tIdx + 1}
                                        </a>
                                      ),
                                    )}
                                  </div>
                                </TableCell>
                              </TableRow>
                            )}
                          </Fragment>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* ── CHART VIEW ──────────────────────────────── */}
              {activeView === "chart" && (
                <div
                  className="p-4"
                  data-ocid="discover.results.chart.canvas_target"
                >
                  {displayResults.length === 0 ? (
                    <div
                      className="flex items-center justify-center h-[320px] text-sm text-muted-foreground"
                      data-ocid="discover.results.empty_state"
                    >
                      No influencers match your filters.
                    </div>
                  ) : (
                    <>
                      {/* Legend */}
                      <div className="flex items-center gap-4 mb-4 text-[11px] text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#22c55e]" />
                          High alignment (≥70)
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#f59e0b]" />
                          Mid alignment (≥40)
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#ef4444]" />
                          Low alignment
                        </span>
                      </div>

                      <ResponsiveContainer width="100%" height={320}>
                        <ScatterChart
                          margin={{ top: 10, right: 20, bottom: 30, left: 10 }}
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="rgba(255,255,255,0.06)"
                          />
                          <XAxis
                            type="number"
                            dataKey="alignmentScore"
                            domain={[0, 100]}
                            tick={{
                              fontSize: 11,
                              fill: "hsl(var(--muted-foreground))",
                            }}
                            label={{
                              value: "Alignment Score",
                              position: "insideBottom",
                              offset: -15,
                              fontSize: 11,
                              fill: "hsl(var(--muted-foreground))",
                            }}
                            tickLine={{ stroke: "rgba(255,255,255,0.1)" }}
                            axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
                          />
                          <YAxis
                            type="number"
                            dataKey="avgEngagement"
                            tick={{
                              fontSize: 11,
                              fill: "hsl(var(--muted-foreground))",
                            }}
                            label={{
                              value: "Engagement %",
                              angle: -90,
                              position: "insideLeft",
                              offset: 15,
                              fontSize: 11,
                              fill: "hsl(var(--muted-foreground))",
                            }}
                            tickLine={{ stroke: "rgba(255,255,255,0.1)" }}
                            axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
                          />
                          <RechartsTooltip
                            content={<CustomChartTooltip />}
                            cursor={{
                              strokeDasharray: "3 3",
                              stroke: "rgba(255,255,255,0.15)",
                            }}
                          />
                          <Scatter data={chartData} isAnimationActive={true}>
                            {chartData.map((entry) => (
                              <Cell
                                key={entry.handle}
                                fill={dotColor(entry.alignmentScore)}
                                fillOpacity={0.85}
                                stroke={dotColor(entry.alignmentScore)}
                                strokeOpacity={0.4}
                                strokeWidth={1}
                                r={6}
                              />
                            ))}
                          </Scatter>
                        </ScatterChart>
                      </ResponsiveContainer>
                    </>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Empty state before first search ─────────────── */}
      {!hasSearched && !isSearching && (
        <div className="text-center py-16 text-muted-foreground">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full border border-border flex items-center justify-center">
            <Search className="w-5 h-5 text-muted-foreground/60" />
          </div>
          <p className="text-sm">
            Describe your project above to discover aligned influencers.
          </p>
        </div>
      )}
    </div>
  );
}
