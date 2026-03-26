"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthProvider";
import { createClient } from "@/lib/supabase/client";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

interface Profile {
  username: string;
  display_name: string | null;
  avatar_url: string | null;
}

export default function ProfilePage() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    const supabase = createClient();
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
      <main id="main-content" className="min-h-screen pt-20 px-6 bg-[#0a0a0a]">
        <div className="max-w-2xl mx-auto py-12">
          {/* Header */}
          <div className="flex items-center gap-4 mb-10">
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
                  {user.created_at ? new Date(user.created_at).toLocaleDateString() : "—"}
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
