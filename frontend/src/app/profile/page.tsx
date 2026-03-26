"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth/AuthProvider";
import { createClient } from "@/lib/supabase/client";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

interface Profile {
  username: string;
  display_name: string | null;
  avatar_url: string | null;
}

interface VoteRecord {
  outcome_id: string;
  created_at: string;
  outcomes: { label: string; scenario_id: string; scenarios: { title: string } } | null;
}

interface CommentRecord {
  id: string;
  body: string;
  created_at: string;
  scenario_id: string;
  scenarios: { title: string } | null;
}

interface ScenarioRecord {
  id: string;
  title: string;
  vote_count: number;
  category: string;
  created_at: string;
}

export default function ProfilePage() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [votes, setVotes] = useState<VoteRecord[]>([]);
  const [comments, setComments] = useState<CommentRecord[]>([]);
  const [scenarios, setScenarios] = useState<ScenarioRecord[]>([]);
  const [stats, setStats] = useState({ votes: 0, comments: 0, scenarios: 0 });

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    const supabase = createClient();

    // Fetch profile
    supabase
      .from("profiles")
      .select("username, display_name, avatar_url")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setProfile(data);
          setDisplayName(data.display_name || data.username || "");
        }
      });

    // Fetch vote history (last 10)
    supabase
      .from("votes")
      .select("outcome_id, created_at, outcomes(label, scenario_id, scenarios(title))")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10)
      .then(({ data, count }) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setVotes((data as any[]) || []);
        if (count !== null) setStats(s => ({ ...s, votes: count }));
      });

    // Fetch comment history (last 10)
    supabase
      .from("comments")
      .select("id, body, created_at, scenario_id, scenarios(title)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10)
      .then(({ data, count }) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setComments((data as any[]) || []);
        if (count !== null) setStats(s => ({ ...s, comments: count }));
      });

    // Fetch user's created scenarios
    supabase
      .from("scenarios")
      .select("id, title, vote_count, category, created_at")
      .eq("author_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10)
      .then(({ data, count }) => {
        setScenarios(data || []);
        if (count !== null) setStats(s => ({ ...s, scenarios: count }));
      });

    // Get total counts
    supabase.from("votes").select("id", { count: "exact", head: true }).eq("user_id", user.id)
      .then(({ count }) => { if (count !== null) setStats(s => ({ ...s, votes: count })); });
    supabase.from("comments").select("id", { count: "exact", head: true }).eq("user_id", user.id)
      .then(({ count }) => { if (count !== null) setStats(s => ({ ...s, comments: count })); });
    supabase.from("scenarios").select("id", { count: "exact", head: true }).eq("author_id", user.id)
      .then(({ count }) => { if (count !== null) setStats(s => ({ ...s, scenarios: count })); });
  }, [user]);

  async function handleSave() {
    if (!user) return;
    setSaving(true);
    const supabase = createClient();
    await supabase
      .from("profiles")
      .update({ display_name: displayName.trim() || null })
      .eq("id", user.id);
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
          <div className="max-w-2xl mx-auto py-16 text-center text-mist-gray">Loading...</div>
        </main>
      </>
    );
  }

  if (!user) return null;

  return (
    <>
      <Navbar />
      <main id="main-content" className="min-h-screen pt-20 px-6 bg-[#0a0a0a] pb-24">
        <div className="max-w-2xl mx-auto py-12">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center text-2xl text-scroll-cream font-bold">
              {(profile?.display_name || profile?.username || "?")[0].toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-scroll-cream">
                {profile?.display_name || profile?.username || "User"}
              </h1>
              <p className="text-mist-gray text-sm">@{profile?.username || "..."}</p>
              <p className="text-mist-gray/60 text-xs mt-0.5">{user.email}</p>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-4 mb-10">
            {[
              { label: "Votes", value: stats.votes },
              { label: "Comments", value: stats.comments },
              { label: "Scenarios", value: stats.scenarios },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-center">
                <div className="text-2xl font-bold text-scroll-cream">{value}</div>
                <div className="text-xs text-mist-gray/50 mt-1">{label}</div>
              </div>
            ))}
          </div>

          {/* Edit profile */}
          <section className="mb-10">
            <h2 className="text-lg font-semibold text-scroll-cream mb-4">Edit Profile</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="displayName" className="block text-sm text-scroll-cream/70 mb-1">Display Name</label>
                <input
                  id="displayName"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  maxLength={50}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-scroll-cream text-sm focus:outline-none focus:border-white/30 transition-colors"
                />
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-2 rounded-lg bg-scroll-cream text-[#0a0a0a] font-medium text-sm hover:bg-scroll-cream/90 transition-colors disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save"}
                </button>
                {saved && <span className="text-green-400 text-sm">Saved</span>}
              </div>
            </div>
          </section>

          {/* Created Scenarios */}
          {scenarios.length > 0 && (
            <section className="mb-10">
              <h2 className="text-lg font-semibold text-scroll-cream mb-4">Your Scenarios</h2>
              <div className="space-y-2">
                {scenarios.map((s) => (
                  <Link
                    key={s.id}
                    href={`/whatif/${s.id}`}
                    className="flex items-center justify-between py-3 px-4 rounded-lg border border-white/[0.04] bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-sm text-scroll-cream truncate">{s.title}</div>
                      <div className="text-xs text-mist-gray/40 mt-0.5">{s.category} — {new Date(s.created_at).toLocaleDateString()}</div>
                    </div>
                    <span className="text-xs text-mist-gray/50 flex-shrink-0 ml-3">{s.vote_count} votes</span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Voting History */}
          {votes.length > 0 && (
            <section className="mb-10">
              <h2 className="text-lg font-semibold text-scroll-cream mb-4">Voting History</h2>
              <div className="space-y-2">
                {votes.map((v, i) => {
                  const outcome = v.outcomes as VoteRecord["outcomes"];
                  const scenarioTitle = outcome?.scenarios?.title || "Unknown scenario";
                  const outcomeLabel = outcome?.label || "Unknown";
                  const scenarioId = outcome?.scenario_id;
                  return (
                    <div key={i} className="py-3 px-4 rounded-lg border border-white/[0.04] bg-white/[0.02]">
                      <div className="text-sm text-scroll-cream/80">
                        Predicted <span className="text-scroll-cream font-medium">{outcomeLabel}</span>
                      </div>
                      {scenarioId ? (
                        <Link href={`/whatif/${scenarioId}`} className="text-xs text-mist-gray/40 hover:text-mist-gray/60 transition-colors">
                          {scenarioTitle}
                        </Link>
                      ) : (
                        <span className="text-xs text-mist-gray/40">{scenarioTitle}</span>
                      )}
                      <div className="text-[10px] text-mist-gray/25 mt-1">{new Date(v.created_at).toLocaleDateString()}</div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Comment History */}
          {comments.length > 0 && (
            <section className="mb-10">
              <h2 className="text-lg font-semibold text-scroll-cream mb-4">Comment History</h2>
              <div className="space-y-2">
                {comments.map((c) => {
                  const scenarioTitle = (c.scenarios as CommentRecord["scenarios"])?.title || "Unknown";
                  return (
                    <Link
                      key={c.id}
                      href={`/whatif/${c.scenario_id}`}
                      className="block py-3 px-4 rounded-lg border border-white/[0.04] bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
                    >
                      <div className="text-sm text-scroll-cream/80 line-clamp-2">{c.body.slice(0, 120)}{c.body.length > 120 ? "..." : ""}</div>
                      <div className="text-xs text-mist-gray/40 mt-1">on {scenarioTitle}</div>
                      <div className="text-[10px] text-mist-gray/25 mt-0.5">{new Date(c.created_at).toLocaleDateString()}</div>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}

          {/* Account info */}
          <section className="mb-10">
            <h2 className="text-lg font-semibold text-scroll-cream mb-4">Account</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-2 border-b border-white/5">
                <span className="text-mist-gray">Email</span>
                <span className="text-scroll-cream">{user.email}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-white/5">
                <span className="text-mist-gray">Provider</span>
                <span className="text-scroll-cream">{user.app_metadata?.provider || "email"}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-white/5">
                <span className="text-mist-gray">Joined</span>
                <span className="text-scroll-cream">
                  {user.created_at ? new Date(user.created_at).toLocaleDateString() : "--"}
                </span>
              </div>
            </div>
          </section>

          {/* Sign out */}
          <button
            onClick={handleSignOut}
            className="px-4 py-2 rounded-lg border border-red-500/30 text-red-400 text-sm hover:bg-red-500/10 transition-colors"
          >
            Sign out
          </button>
        </div>
      </main>
      <Footer />
    </>
  );
}
