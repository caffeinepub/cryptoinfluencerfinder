import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BookmarkCheck, ExternalLink, Trash2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import type { Influencer } from "../backend.d";
import { AlignmentBadge } from "../components/AlignmentBadge";
import {
  useGetSavedInfluencers,
  useRemoveInfluencer,
} from "../hooks/useQueries";

function formatFollowers(n: bigint): string {
  const num = Number(n);
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toString();
}

function formatDate(ts: bigint): string {
  const ms = Number(ts);
  if (ms === 0) return "—";
  return new Date(ms).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function SavedPage() {
  const { data: influencers, isLoading } = useGetSavedInfluencers();
  const removeInfluencer = useRemoveInfluencer();

  return (
    <div className="px-4 md:px-8 py-6 max-w-7xl mx-auto">
      {/* ── Header ──────────────────────────────────────── */}
      <header className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
          Saved <span className="text-primary">Influencers</span>
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Your bookmarked influencers for outreach and tracking.
        </p>
      </header>

      {/* ── Loading ─────────────────────────────────────── */}
      {isLoading && (
        <div className="space-y-2" data-ocid="saved.loading_state">
          {(["s1", "s2", "s3", "s4"] as const).map((skId) => (
            <div
              key={skId}
              className="flex gap-3 items-center px-4 py-3 bg-card border border-border rounded-lg"
            >
              <Skeleton className="w-24 h-4 bg-muted/60" />
              <Skeleton className="w-16 h-4 bg-muted/60" />
              <Skeleton className="w-16 h-4 bg-muted/60" />
              <Skeleton className="w-12 h-5 rounded bg-muted/60" />
            </div>
          ))}
        </div>
      )}

      {/* ── Empty State ─────────────────────────────────── */}
      {!isLoading && (!influencers || influencers.length === 0) && (
        <div
          className="text-center py-20 border border-dashed border-border rounded-lg"
          data-ocid="saved.empty_state"
        >
          <div className="w-12 h-12 mx-auto mb-4 rounded-full border border-border flex items-center justify-center">
            <BookmarkCheck className="w-5 h-5 text-muted-foreground/60" />
          </div>
          <p className="text-sm text-muted-foreground font-medium">
            No saved influencers yet.
          </p>
          <p className="text-xs text-muted-foreground/70 mt-1">
            Discover and save influencers from the Discover page.
          </p>
        </div>
      )}

      {/* ── Table ───────────────────────────────────────── */}
      {!isLoading && influencers && influencers.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="bg-card border border-border rounded-lg overflow-hidden"
        >
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              {influencers.length} Saved
            </span>
          </div>

          <div className="overflow-x-auto">
            <Table data-ocid="saved.table">
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-xs text-muted-foreground font-semibold">
                    Handle
                  </TableHead>
                  <TableHead className="text-xs text-muted-foreground font-semibold">
                    Followers
                  </TableHead>
                  <TableHead className="text-xs text-muted-foreground font-semibold">
                    Avg Engagement
                  </TableHead>
                  <TableHead className="text-xs text-muted-foreground font-semibold">
                    Alignment
                  </TableHead>
                  <TableHead className="text-xs text-muted-foreground font-semibold">
                    Niche
                  </TableHead>
                  <TableHead className="text-xs text-muted-foreground font-semibold">
                    Saved
                  </TableHead>
                  <TableHead className="text-xs text-muted-foreground font-semibold text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence initial={false}>
                  {influencers.map((influencer: Influencer, idx: number) => (
                    <motion.tr
                      key={influencer.id}
                      initial={{ opacity: 1 }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      data-ocid={`saved.row.${idx + 1}`}
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
                      <TableCell className="text-xs text-muted-foreground font-mono">
                        {formatDate(influencer.savedAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {influencer.exampleTweetUrls.length > 0 && (
                            <a
                              href={influencer.exampleTweetUrls[0]}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-md text-muted-foreground hover:text-primary transition-colors border border-border hover:border-primary/30"
                              aria-label="View example tweet"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={removeInfluencer.isPending}
                            onClick={() =>
                              removeInfluencer.mutate(influencer.id)
                            }
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            data-ocid={`saved.delete_button.${idx + 1}`}
                            aria-label="Remove influencer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </TableBody>
            </Table>
          </div>
        </motion.div>
      )}
    </div>
  );
}
