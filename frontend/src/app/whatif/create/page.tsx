"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth/AuthProvider";
import Navbar from "@/components/layout/Navbar";
import { IconPlus, IconTrash, IconArrowLeft } from "@tabler/icons-react";

const CATEGORIES = [
  { value: "general", label: "General" },
  { value: "politics", label: "Politics" },
  { value: "economy", label: "Economy" },
  { value: "tech", label: "Technology" },
  { value: "society", label: "Society" },
  { value: "sports", label: "Sports" },
  { value: "entertainment", label: "Entertainment" },
];

interface Outcome {
  label: string;
  description: string;
}

export default function CreateScenarioPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("general");
  const [body, setBody] = useState("");
  const [outcomes, setOutcomes] = useState<Outcome[]>([
    { label: "", description: "" },
    { label: "", description: "" },
  ]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [preview, setPreview] = useState(false);

  function updateOutcome(index: number, field: keyof Outcome, value: string) {
    setOutcomes(prev => prev.map((o, i) => i === index ? { ...o, [field]: value } : o));
  }

  function addOutcome() {
    if (outcomes.length < 4) {
      setOutcomes(prev => [...prev, { label: "", description: "" }]);
    }
  }

  function removeOutcome(index: number) {
    if (outcomes.length > 2) {
      setOutcomes(prev => prev.filter((_, i) => i !== index));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!title.trim()) { setError("Title is required"); return; }
    if (!description.trim()) { setError("Description is required"); return; }
    if (outcomes.some(o => !o.label.trim())) { setError("All outcomes need a label"); return; }

    setSubmitting(true);

    try {
      const res = await fetch("/api/whatif/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          category,
          body: body.trim(),
          outcomes: outcomes.map(o => ({
            label: o.label.trim(),
            description: o.description.trim() || undefined,
          })),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create scenario");
        setSubmitting(false);
        return;
      }

      router.push(`/whatif/${data.id}`);
    } catch {
      setError("Network error — try again");
      setSubmitting(false);
    }
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

  if (!user) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen pt-20 px-6 bg-[#0a0a0a]">
          <div className="max-w-md mx-auto py-24 text-center">
            <h1 className="text-2xl font-bold text-scroll-cream mb-4">Sign in to create</h1>
            <p className="text-mist-gray text-sm mb-6">
              You need an account to create What-If scenarios.
            </p>
            <Link
              href="/auth/login"
              className="inline-block px-6 py-2.5 rounded-lg bg-scroll-cream text-[#0a0a0a] font-semibold text-sm hover:bg-scroll-cream/90 transition-colors"
            >
              Sign in
            </Link>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-20 px-6 bg-[#0a0a0a] pb-24">
        <div className="max-w-2xl mx-auto py-8">
          {/* Back link */}
          <Link href="/whatif" className="inline-flex items-center gap-1.5 text-sm text-mist-gray/50 hover:text-mist-gray transition-colors mb-8">
            <IconArrowLeft size={16} /> Back to What If
          </Link>

          <h1 className="text-3xl font-bold text-scroll-cream mb-2">Create a Prediction</h1>
          <p className="text-mist-gray text-sm mb-10">
            Write your own What-If scenario. Add outcomes for others to vote on.
          </p>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-scroll-cream/70 mb-2">
                Title <span className="text-mist-gray/30">({title.length}/120)</span>
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={120}
                required
                placeholder="What if India bans single-use plastics by 2027?"
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-scroll-cream placeholder-mist-gray/30 text-sm focus:outline-none focus:border-white/25 transition-colors"
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="desc" className="block text-sm font-medium text-scroll-cream/70 mb-2">
                Short Description <span className="text-mist-gray/30">({description.length}/300)</span>
              </label>
              <textarea
                id="desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={300}
                required
                rows={2}
                placeholder="A brief hook — what makes this scenario interesting?"
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-scroll-cream placeholder-mist-gray/30 text-sm focus:outline-none focus:border-white/25 transition-colors resize-none"
              />
            </div>

            {/* Category */}
            <div>
              <label htmlFor="cat" className="block text-sm font-medium text-scroll-cream/70 mb-2">Category</label>
              <select
                id="cat"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-scroll-cream text-sm focus:outline-none focus:border-white/25 transition-colors appearance-none"
              >
                {CATEGORIES.map(c => (
                  <option key={c.value} value={c.value} className="bg-[#1a1a2e] text-scroll-cream">
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Body (optional) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="body" className="block text-sm font-medium text-scroll-cream/70">
                  Analysis <span className="text-mist-gray/30">(optional, {body.length}/5000)</span>
                </label>
                <button
                  type="button"
                  onClick={() => setPreview(!preview)}
                  className="text-xs text-mist-gray/40 hover:text-mist-gray/60 transition-colors"
                >
                  {preview ? "Edit" : "Preview"}
                </button>
              </div>
              {preview ? (
                <div className="w-full min-h-[200px] px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-scroll-cream/80 text-sm leading-relaxed whitespace-pre-wrap">
                  {body || <span className="text-mist-gray/30">Nothing to preview</span>}
                </div>
              ) : (
                <textarea
                  id="body"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  maxLength={5000}
                  rows={8}
                  placeholder="Write your analysis — explain why this scenario matters, what evidence supports it, and what the implications could be. Markdown supported."
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-scroll-cream placeholder-mist-gray/30 text-sm focus:outline-none focus:border-white/25 transition-colors resize-y"
                />
              )}
            </div>

            {/* Outcomes */}
            <div>
              <label className="block text-sm font-medium text-scroll-cream/70 mb-3">
                Prediction Outcomes <span className="text-mist-gray/30">(2-4 options for voting)</span>
              </label>
              <div className="space-y-3">
                {outcomes.map((outcome, i) => (
                  <div key={i} className="flex gap-3 items-start">
                    <div className="flex-1 space-y-2">
                      <input
                        type="text"
                        value={outcome.label}
                        onChange={(e) => updateOutcome(i, "label", e.target.value)}
                        maxLength={100}
                        required
                        placeholder={`Outcome ${i + 1} — e.g. "Yes, by 2027"`}
                        className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-scroll-cream placeholder-mist-gray/30 text-sm focus:outline-none focus:border-white/25 transition-colors"
                      />
                      <input
                        type="text"
                        value={outcome.description}
                        onChange={(e) => updateOutcome(i, "description", e.target.value)}
                        maxLength={200}
                        placeholder="Brief description (optional)"
                        className="w-full px-4 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06] text-scroll-cream/70 placeholder-mist-gray/20 text-xs focus:outline-none focus:border-white/20 transition-colors"
                      />
                    </div>
                    {outcomes.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeOutcome(i)}
                        className="mt-2 p-1.5 rounded-lg text-mist-gray/30 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                      >
                        <IconTrash size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {outcomes.length < 4 && (
                <button
                  type="button"
                  onClick={addOutcome}
                  className="mt-3 flex items-center gap-1.5 text-xs text-mist-gray/40 hover:text-mist-gray/60 transition-colors"
                >
                  <IconPlus size={14} /> Add outcome
                </button>
              )}
            </div>

            {/* Error */}
            {error && (
              <p className="text-red-400 text-sm">{error}</p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 rounded-xl bg-scroll-cream text-[#0a0a0a] font-semibold text-sm hover:bg-scroll-cream/90 transition-colors disabled:opacity-50"
            >
              {submitting ? "Publishing..." : "Publish Prediction"}
            </button>
          </form>
        </div>
      </main>
    </>
  );
}
