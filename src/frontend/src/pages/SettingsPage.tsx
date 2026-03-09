import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  KeyRound,
  Loader2,
  ShieldAlert,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useActor } from "../hooks/useActor";
import { useGetXApiTokenStatus, useSetXApiToken } from "../hooks/useQueries";

export default function SettingsPage() {
  const { actor, isFetching } = useActor();
  const { data: tokenConfigured, isLoading: tokenLoading } =
    useGetXApiTokenStatus();
  const setXApiToken = useSetXApiToken();

  const [token, setToken] = useState("");
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [adminChecking, setAdminChecking] = useState(true);

  // Check admin status
  useEffect(() => {
    if (!actor || isFetching) return;
    setAdminChecking(true);
    actor
      .isCallerAdmin()
      .then((result) => {
        setIsAdmin(result);
      })
      .catch(() => {
        setIsAdmin(false);
      })
      .finally(() => {
        setAdminChecking(false);
      });
  }, [actor, isFetching]);

  const handleSave = () => {
    if (!token.trim()) return;
    setXApiToken.mutate(token.trim(), {
      onSuccess: () => {
        setToken("");
      },
    });
  };

  return (
    <div className="px-4 md:px-8 py-6 max-w-3xl mx-auto">
      {/* ── Header ──────────────────────────────────────── */}
      <header className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
          <span className="text-primary">Settings</span>
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Configure your X API integration for live influencer data.
        </p>
      </header>

      {/* ── X API Configuration Card ─────────────────────── */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-md bg-primary/15 border border-primary/30 flex items-center justify-center">
                <KeyRound className="w-4 h-4 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold text-foreground">
                  X API Configuration
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground mt-0.5">
                  Connect your X (Twitter) API token for live influencer data
                </CardDescription>
              </div>
            </div>

            {/* Token status badge */}
            {tokenLoading ? (
              <Skeleton className="w-20 h-6 bg-muted/60 rounded-full" />
            ) : tokenConfigured ? (
              <Badge
                className="bg-score-high/15 text-score-high border-score-high/30 gap-1.5 font-medium text-xs"
                data-ocid="settings.token.success_state"
              >
                <CheckCircle2 className="w-3 h-3" />
                Connected
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="border-border text-muted-foreground gap-1.5 text-xs"
                data-ocid="settings.token.error_state"
              >
                <AlertCircle className="w-3 h-3" />
                Not Connected
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-5">
          {/* Admin warning */}
          {!adminChecking && isAdmin === false && (
            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-score-mid/10 border border-score-mid/25 text-xs text-score-mid">
              <ShieldAlert className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              <span>
                Only admins can save the API token. You&apos;re currently logged
                in as a non-admin user. Contact the project admin to configure
                the API token.
              </span>
            </div>
          )}

          {/* Token input */}
          <div className="space-y-2">
            <Label
              htmlFor="bearer-token"
              className="text-xs font-semibold text-foreground"
            >
              X API Bearer Token
            </Label>
            <div className="flex gap-2">
              <Input
                id="bearer-token"
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder={
                  tokenConfigured
                    ? "●●●●●●●●●●●●●●●● (token is saved — paste new to replace)"
                    : "Paste your Bearer Token here…"
                }
                className="flex-1 bg-muted/50 border-border text-sm font-mono h-9"
                data-ocid="settings.token.input"
                disabled={setXApiToken.isPending}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSave();
                }}
              />
              <Button
                onClick={handleSave}
                disabled={!token.trim() || setXApiToken.isPending}
                className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold h-9 px-4 shadow-glow-cyan transition-all"
                data-ocid="settings.save_button"
              >
                {setXApiToken.isPending ? (
                  <>
                    <Loader2 className="mr-2 w-3.5 h-3.5 animate-spin" />
                    Saving…
                  </>
                ) : (
                  "Save"
                )}
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Token is stored securely in the backend canister and never exposed
              to the browser after saving.
            </p>
          </div>

          {setXApiToken.isPending && (
            <div
              className="flex items-center gap-2 text-xs text-muted-foreground"
              data-ocid="settings.loading_state"
            >
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Saving token to canister…
            </div>
          )}

          <Separator className="bg-border/60" />

          {/* How-to section */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              How to Get Your Bearer Token
            </h3>

            <div className="space-y-2.5">
              {[
                {
                  step: 1,
                  text: (
                    <>
                      Go to{" "}
                      <a
                        href="https://developer.twitter.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:text-primary/80 transition-colors inline-flex items-center gap-0.5"
                      >
                        developer.twitter.com
                        <ExternalLink className="w-3 h-3 ml-0.5" />
                      </a>{" "}
                      and sign in with your X account.
                    </>
                  ),
                },
                {
                  step: 2,
                  text: "Create a project and app. Select Basic Access tier ($100/mo) — this is required to use the search endpoint.",
                },
                {
                  step: 3,
                  text: (
                    <>
                      In your app&apos;s{" "}
                      <span className="font-mono text-[11px] bg-muted px-1 py-0.5 rounded text-foreground">
                        Keys and Tokens
                      </span>{" "}
                      page, generate a{" "}
                      <span className="font-mono text-[11px] bg-muted px-1 py-0.5 rounded text-foreground">
                        Bearer Token
                      </span>{" "}
                      under &quot;Authentication Tokens.&quot;
                    </>
                  ),
                },
                {
                  step: 4,
                  text: "Paste the Bearer Token in the field above and click Save.",
                },
              ].map(({ step, text }) => (
                <div key={step} className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center mt-0.5">
                    <span className="text-[10px] font-bold text-primary">
                      {step}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed flex-1">
                    {text}
                  </p>
                </div>
              ))}
            </div>

            <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/40 border border-border text-xs text-muted-foreground mt-2">
              <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0 text-score-mid" />
              <span>
                <strong className="text-score-mid font-semibold">
                  Basic Access ($100/mo) or higher
                </strong>{" "}
                is required for the{" "}
                <span className="font-mono text-[11px] bg-muted px-1 py-0.5 rounded text-foreground">
                  tweets/search/recent
                </span>{" "}
                endpoint used to find influencers. Free tier does not include
                this endpoint.
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
