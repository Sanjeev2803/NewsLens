"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth/AuthProvider";
import { createClient } from "@/lib/supabase/client";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { IconSettings, IconLogout, IconPencil, IconChartBar, IconMessage, IconSparkles, IconClock, IconCheck } from "@tabler/icons-react";

/* eslint-disable @typescript-eslint/no-explicit-any */

type Tab = "activity" | "scenarios" | "settings";

export default function ProfilePage() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("activity");
  const [profile, setProfile] = useState<any>(null);
  const [displayName, setDisplayName] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [votes, setVotes] = useState<any[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [scenarios, setScenarios] = useState<any[]>([]);
  const [stats, setStats] = useState({ votes: 0, comments: 0, scenarios: 0 });

  useEffect(() => {
    // Wait 2 seconds before redirecting — gives AuthProvider time to
    // process onAuthStateChange after OAuth or email login
    if (!loading && !user) {
      const timer = setTimeout(() => router.push("/auth/login"), 2000);
      return () => clearTimeout(timer);
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    const supabase = createClient();

    // Profile
    supabase.from("profiles").select("username, display_name, avatar_url").eq("id", user.id).single()
      .then(({ data }) => {
        if (data) { setProfile(data); setDisplayName(data.display_name || data.username || ""); }
      });

    // Counts
    supabase.from("votes").select("id", { count: "exact", head: true }).eq("user_id", user.id)
      .then(({ count }) => { if (count !== null) setStats(s => ({ ...s, votes: count })); });
    supabase.from("comments").select("id", { count: "exact", head: true }).eq("user_id", user.id)
      .then(({ count }) => { if (count !== null) setStats(s => ({ ...s, comments: count })); });
    supabase.from("scenarios").select("id", { count: "exact", head: true }).eq("author_id", user.id)
      .then(({ count }) => { if (count !== null) setStats(s => ({ ...s, scenarios: count })); });

    // Votes (last 15)
    supabase.from("votes").select("outcome_id, created_at, outcomes(label, scenario_id, scenarios(title))")
      .eq("user_id", user.id).order("created_at", { ascending: false }).limit(15)
      .then(({ data }) => setVotes(data || []));

    // Comments (last 15)
    supabase.from("comments").select("id, body, created_at, scenario_id, scenarios(title)")
      .eq("user_id", user.id).order("created_at", { ascending: false }).limit(15)
      .then(({ data }) => setComments(data || []));

    // Created scenarios
    supabase.from("scenarios").select("id, title, vote_count, category, created_at")
      .eq("author_id", user.id).order("created_at", { ascending: false }).limit(20)
      .then(({ data }) => setScenarios(data || []));
  }, [user]);

  async function handleSave() {
    if (!user) return;
    setSaving(true);
    const supabase = createClient();
    await supabase.from("profiles").update({ display_name: displayName.trim() || null }).eq("id", user.id);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function handleSignOut() {
    await signOut();
    router.push("/");
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen pt-20 px-6 bg-[#0a0a0a]">
          <div className="max-w-3xl mx-auto py-16 text-center text-mist-gray">Loading...</div>
        </main>
      </>
    );
  }

  if (!user) return null;

  const initials = (profile?.display_name || profile?.username || "?")[0].toUpperCase();
  const name = profile?.display_name || profile?.username || "User";
  const joined = user.created_at ? new Date(user.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : "";

  return (
    <>
      <Navbar />
      <main id="main-content" className="min-h-screen pt-20 px-4 md:px-6 bg-[#0a0a0a] pb-24">
        <div className="max-w-3xl mx-auto py-10">

          {/* ── Profile Header ── */}
          <div className="flex items-start gap-5 mb-8">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-sharingan-red/20 to-chakra-orange/10 border border-white/[0.06] flex items-center justify-center text-3xl text-scroll-cream font-bold flex-shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-scroll-cream truncate">{name}</h1>
              <p className="text-sm text-mist-gray/50">@{profile?.username || "..."}</p>
              <div className="flex items-center gap-4 mt-2 text-xs text-mist-gray/30">
                <span>{user.email}</span>
                {joined && <span>Joined {joined}</span>}
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-500/20 text-red-400/60 text-xs hover:bg-red-500/10 hover:text-red-400 transition-colors flex-shrink-0"
            >
              <IconLogout size={13} /> Sign out
            </button>
          </div>

          {/* ── Stats ── */}
          <div className="grid grid-cols-3 gap-3 mb-8">
            {[
              { label: "Predictions Voted", value: stats.votes, icon: IconChartBar },
              { label: "Comments", value: stats.comments, icon: IconMessage },
              { label: "Scenarios Created", value: stats.scenarios, icon: IconSparkles },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Icon size={14} className="text-mist-gray/30" />
                  <span className="text-[10px] text-mist-gray/40 uppercase tracking-wider">{label}</span>
                </div>
                <div className="text-2xl font-bold text-scroll-cream">{value}</div>
              </div>
            ))}
          </div>

          {/* ── Tab Navigation ── */}
          <div className="flex items-center gap-1 mb-8 border-b border-white/[0.05] pb-px">
            {([
              { key: "activity", label: "Activity", icon: IconClock },
              { key: "scenarios", label: "My Scenarios", icon: IconSparkles },
              { key: "settings", label: "Settings", icon: IconSettings },
            ] as const).map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-heading font-medium transition-all border-b-2 -mb-px ${
                  tab === key
                    ? "text-scroll-cream border-scroll-cream"
                    : "text-mist-gray/40 border-transparent hover:text-mist-gray/60"
                }`}
              >
                <Icon size={14} /> {label}
              </button>
            ))}
          </div>

          {/* ── Tab Content ── */}

          {/* Activity Tab */}
          {tab === "activity" && (
            <div className="space-y-8">
              {/* Voting History */}
              <section>
                <h3 className="text-sm font-semibold text-scroll-cream/70 mb-3">Voting History</h3>
                {votes.length === 0 ? (
                  <p className="text-xs text-mist-gray/30 py-6 text-center">No votes yet. Head to <Link href="/whatif" className="text-scroll-cream/50 hover:underline">What If</Link> to make predictions.</p>
                ) : (
                  <div className="space-y-2">
                    {votes.map((v: any, i: number) => {
                      const outcome = v.outcomes;
                      const scenarioTitle = outcome?.scenarios?.title || "Unknown scenario";
                      const scenarioId = outcome?.scenario_id;
                      return (
                        <div key={i} className="flex items-start gap-3 py-3 px-4 rounded-lg border border-white/[0.04] bg-white/[0.015]">
                          <div className="w-6 h-6 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <IconCheck size={12} className="text-green-400/60" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm text-scroll-cream/80">
                              Predicted <span className="font-medium text-scroll-cream">{outcome?.label || "?"}</span>
                            </div>
                            {scenarioId ? (
                              <Link href={`/whatif/${scenarioId}`} className="text-xs text-mist-gray/35 hover:text-mist-gray/55 transition-colors truncate block">
                                {scenarioTitle}
                              </Link>
                            ) : (
                              <span className="text-xs text-mist-gray/35 truncate block">{scenarioTitle}</span>
                            )}
                          </div>
                          <span className="text-[10px] text-mist-gray/20 flex-shrink-0">
                            {new Date(v.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>

              {/* Comment History */}
              <section>
                <h3 className="text-sm font-semibold text-scroll-cream/70 mb-3">Comment History</h3>
                {comments.length === 0 ? (
                  <p className="text-xs text-mist-gray/30 py-6 text-center">No comments yet.</p>
                ) : (
                  <div className="space-y-2">
                    {comments.map((c: any) => {
                      const scenarioTitle = c.scenarios?.title || "Unknown";
                      return (
                        <Link
                          key={c.id}
                          href={`/whatif/${c.scenario_id}`}
                          className="block py-3 px-4 rounded-lg border border-white/[0.04] bg-white/[0.015] hover:bg-white/[0.03] transition-colors"
                        >
                          <div className="text-sm text-scroll-cream/70 line-clamp-2">{c.body.slice(0, 150)}{c.body.length > 150 ? "..." : ""}</div>
                          <div className="flex items-center justify-between mt-1.5">
                            <span className="text-[10px] text-mist-gray/30 truncate">on {scenarioTitle}</span>
                            <span className="text-[10px] text-mist-gray/20">{new Date(c.created_at).toLocaleDateString()}</span>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </section>
            </div>
          )}

          {/* Scenarios Tab */}
          {tab === "scenarios" && (
            <div>
              {scenarios.length === 0 ? (
                <div className="text-center py-12">
                  <IconSparkles size={32} className="mx-auto mb-3 text-white/10" />
                  <p className="text-sm text-mist-gray/40 mb-4">You haven&apos;t created any scenarios yet</p>
                  <Link
                    href="/whatif/create"
                    className="inline-block px-5 py-2 rounded-lg bg-scroll-cream text-[#0a0a0a] text-sm font-semibold hover:bg-scroll-cream/90 transition-colors"
                  >
                    Create your first prediction
                  </Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {scenarios.map((s: any) => (
                    <Link
                      key={s.id}
                      href={`/whatif/${s.id}`}
                      className="flex items-center justify-between py-4 px-4 rounded-lg border border-white/[0.04] bg-white/[0.015] hover:bg-white/[0.03] transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-scroll-cream truncate">{s.title}</div>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-[10px] text-mist-gray/30 px-1.5 py-0.5 rounded bg-white/[0.03]">{s.category}</span>
                          <span className="text-[10px] text-mist-gray/25">{new Date(s.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 ml-4">
                        <div className="text-sm font-bold text-scroll-cream">{s.vote_count || 0}</div>
                        <div className="text-[9px] text-mist-gray/30">votes</div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Settings Tab */}
          {tab === "settings" && (
            <div className="space-y-8">
              {/* Edit Profile */}
              <section>
                <h3 className="text-sm font-semibold text-scroll-cream/70 mb-4">Profile</h3>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="displayName" className="block text-xs text-scroll-cream/50 mb-1.5">Display Name</label>
                    <div className="flex gap-3">
                      <input
                        id="displayName"
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        maxLength={50}
                        className="flex-1 px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-scroll-cream text-sm focus:outline-none focus:border-white/25 transition-colors"
                      />
                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-scroll-cream text-[#0a0a0a] font-medium text-xs hover:bg-scroll-cream/90 transition-colors disabled:opacity-50"
                      >
                        <IconPencil size={13} />
                        {saving ? "Saving..." : saved ? "Saved" : "Save"}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-scroll-cream/50 mb-1.5">Username</label>
                    <div className="px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/[0.04] text-sm text-mist-gray/50">
                      @{profile?.username || "..."}
                    </div>
                  </div>
                </div>
              </section>

              {/* Account Info */}
              <section>
                <h3 className="text-sm font-semibold text-scroll-cream/70 mb-4">Account</h3>
                <div className="space-y-1">
                  {[
                    { label: "Email", value: user.email || "—" },
                    { label: "Provider", value: user.app_metadata?.provider || "email" },
                    { label: "Joined", value: joined || "—" },
                    { label: "User ID", value: user.id.slice(0, 8) + "..." },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between py-2.5 border-b border-white/[0.03]">
                      <span className="text-xs text-mist-gray/40">{label}</span>
                      <span className="text-xs text-scroll-cream/60">{value}</span>
                    </div>
                  ))}
                </div>
              </section>

              {/* Danger Zone */}
              <section>
                <h3 className="text-sm font-semibold text-red-400/60 mb-4">Danger Zone</h3>
                <button
                  onClick={handleSignOut}
                  className="px-4 py-2 rounded-lg border border-red-500/20 text-red-400/60 text-xs hover:bg-red-500/10 hover:text-red-400 transition-colors"
                >
                  Sign out of all devices
                </button>
              </section>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
