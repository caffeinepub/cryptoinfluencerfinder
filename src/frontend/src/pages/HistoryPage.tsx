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
import { useNavigate } from "@tanstack/react-router";
import { Clock, History, RefreshCw } from "lucide-react";
import { motion } from "motion/react";
import type { SearchQuery } from "../backend.d";
import { useGetSearchHistory } from "../hooks/useQueries";

function formatDate(ts: bigint): string {
  const ms = Number(ts);
  if (ms === 0) return "—";
  return new Date(ms).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function truncate(text: string, max = 60): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max)}…`;
}

export default function HistoryPage() {
  const { data: history, isLoading } = useGetSearchHistory();
  const navigate = useNavigate();

  return (
    <div className="px-4 md:px-8 py-6 max-w-7xl mx-auto">
      {/* ── Header ──────────────────────────────────────── */}
      <header className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
          Search <span className="text-primary">History</span>
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Your past influencer discovery queries.
        </p>
      </header>

      {/* ── Loading ─────────────────────────────────────── */}
      {isLoading && (
        <div className="space-y-2" data-ocid="history.loading_state">
          {(["s1", "s2", "s3", "s4"] as const).map((skId) => (
            <div
              key={skId}
              className="flex gap-3 items-center px-4 py-3 bg-card border border-border rounded-lg"
            >
              <Skeleton className="w-48 h-4 bg-muted/60" />
              <Skeleton className="w-20 h-4 bg-muted/60" />
              <Skeleton className="w-16 h-4 bg-muted/60" />
            </div>
          ))}
        </div>
      )}

      {/* ── Empty State ─────────────────────────────────── */}
      {!isLoading && (!history || history.length === 0) && (
        <div
          className="text-center py-20 border border-dashed border-border rounded-lg"
          data-ocid="history.empty_state"
        >
          <div className="w-12 h-12 mx-auto mb-4 rounded-full border border-border flex items-center justify-center">
            <History className="w-5 h-5 text-muted-foreground/60" />
          </div>
          <p className="text-sm text-muted-foreground font-medium">
            No search history yet.
          </p>
          <p className="text-xs text-muted-foreground/70 mt-1">
            Your discovery searches will appear here.
          </p>
        </div>
      )}

      {/* ── Table ───────────────────────────────────────── */}
      {!isLoading && history && history.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="bg-card border border-border rounded-lg overflow-hidden"
        >
          <div className="px-4 py-3 border-b border-border">
            <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              {history.length} Searches
            </span>
          </div>

          <div className="overflow-x-auto">
            <Table data-ocid="history.table">
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-xs text-muted-foreground font-semibold">
                    Project Descriptions
                  </TableHead>
                  <TableHead className="text-xs text-muted-foreground font-semibold">
                    Niches
                  </TableHead>
                  <TableHead className="text-xs text-muted-foreground font-semibold">
                    Min Followers
                  </TableHead>
                  <TableHead className="text-xs text-muted-foreground font-semibold">
                    Min Engagement
                  </TableHead>
                  <TableHead className="text-xs text-muted-foreground font-semibold">
                    Date
                  </TableHead>
                  <TableHead className="text-xs text-muted-foreground font-semibold text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((query: SearchQuery, idx: number) => (
                  <TableRow
                    key={query.id}
                    data-ocid={`history.row.${idx + 1}`}
                    className="border-border hover:bg-muted/20 transition-colors"
                  >
                    <TableCell className="max-w-xs">
                      <div className="space-y-1">
                        {query.projectDescriptions.map((desc) => (
                          <p
                            key={desc}
                            className="text-xs text-foreground leading-relaxed"
                            title={desc}
                          >
                            {truncate(desc, 70)}
                          </p>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {query.niches.length > 0 ? (
                          query.niches.map((niche) => (
                            <Badge
                              key={niche}
                              variant="secondary"
                              className="text-[10px] py-0 px-1.5 bg-secondary/60 text-secondary-foreground border-none"
                            >
                              {niche}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            All niches
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-foreground">
                      {Number(query.minFollowers).toLocaleString()}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-foreground">
                      {query.minEngagement.toFixed(1)}%
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
                        <Clock className="w-3 h-3 shrink-0" />
                        {formatDate(query.createdAt)}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          navigate({
                            to: "/",
                            search: {
                              descriptions:
                                query.projectDescriptions.join("||"),
                              niches: query.niches.join(","),
                              minFollowers: String(Number(query.minFollowers)),
                              minEngagement: String(query.minEngagement),
                              autoRun: "1",
                            },
                          })
                        }
                        className="h-7 text-[11px] px-2.5 border border-border hover:border-primary/40 hover:text-primary transition-colors"
                        data-ocid={`history.rerun_button.${idx + 1}`}
                      >
                        <RefreshCw className="w-3 h-3 mr-1" />
                        Re-run
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </motion.div>
      )}
    </div>
  );
}
