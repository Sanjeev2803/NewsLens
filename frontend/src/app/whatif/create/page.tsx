"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useToast } from "@/components/ui/Toast";
import Navbar from "@/components/layout/Navbar";
import { IconArrowLeft, IconArrowRight, IconPlus, IconTrash, IconCheck, IconPencil, IconSparkles, IconLoader2 } from "@tabler/icons-react";

const TONES = [
  { value: "analytical", label: "Analytical", desc: "Data-driven, structured reasoning" },
  { value: "fanboy", label: "Fanboy", desc: "Passionate, high energy, bold claims" },
  { value: "personified", label: "Personified", desc: "Written as the topic itself" },
  { value: "dramatic", label: "Dramatic", desc: "Thriller-style, builds tension" },
  { value: "satirical", label: "Satirical", desc: "Witty, ironic, The Onion meets news" },
  { value: "neutral", label: "Neutral", desc: "Balanced journalism, no opinion" },
  { value: "custom", label: "Custom", desc: "Write your own tone" },
];

const CATEGORIES = [
  { value: "general", label: "General" },
  { value: "politics", label: "Politics" },
  { value: "economy", label: "Economy" },
  { value: "tech", label: "Technology" },
  { value: "society", label: "Society" },
  { value: "sports", label: "Sports" },
  { value: "entertainment", label: "Entertainment" },
];

const STEPS = [
  { number: 1, label: "Prediction" },
  { number: 2, label: "Story" },
  { number: 3, label: "Outcomes" },
  { number: 4, label: "Review" },
];

interface Outcome {
  label: string;
  description: string;
}

// ── Step Progress Bar ──
function StepProgress({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-10">
      {STEPS.map((step, i) => (
        <div key={step.number} className="flex items-center">
          <div className="flex flex-col items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                current > step.number
                  ? "bg-green-500/20 text-green-400 border border-green-500/30"
                  : current === step.number
                  ? "bg-scroll-cream text-[#0a0a0a] shadow-[0_0_16px_rgba(245,230,200,0.15)]"
                  : "bg-white/5 text-mist-gray/30 border border-white/[0.06]"
              }`}
            >
              {current > step.number ? <IconCheck size={14} /> : step.number}
            </div>
            <span
              className={`text-[10px] mt-1.5 font-heading transition-colors ${
                current >= step.number ? "text-scroll-cream/70" : "text-mist-gray/25"
              }`}
            >
              {step.label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div
              className={`w-12 md:w-20 h-px mx-2 mb-5 transition-colors duration-300 ${
                current > step.number ? "bg-green-500/30" : "bg-white/[0.06]"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// ── Step 1: Your Prediction ──
function StepPrediction({
  title, setTitle, category, setCategory, onNext,
}: {
  title: string; setTitle: (v: string) => void;
  category: string; setCategory: (v: string) => void;
  onNext: () => void;
}) {
  const valid = title.trim().length >= 5;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-scroll-cream mb-1">Your Prediction</h2>
        <p className="text-sm text-mist-gray/50">What scenario do you want to explore?</p>
      </div>

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
          autoFocus
          placeholder="What if India bans single-use plastics by 2027?"
          className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-scroll-cream placeholder-mist-gray/30 text-sm focus:outline-none focus:border-white/25 transition-colors"
        />
        {title.length > 0 && title.trim().length < 5 && (
          <p className="text-xs text-red-400/60 mt-1">At least 5 characters</p>
        )}
      </div>

      <div>
        <label htmlFor="cat" className="block text-sm font-medium text-scroll-cream/70 mb-2">Category</label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {CATEGORIES.map(c => (
            <button
              key={c.value}
              type="button"
              onClick={() => setCategory(c.value)}
              className={`px-3 py-2.5 rounded-lg text-xs font-heading font-medium transition-all border ${
                category === c.value
                  ? "bg-scroll-cream/10 text-scroll-cream border-scroll-cream/20"
                  : "bg-white/[0.02] text-mist-gray/50 border-white/[0.04] hover:border-white/10 hover:text-mist-gray/70"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <div className="pt-4 flex justify-end">
        <button
          onClick={onNext}
          disabled={!valid}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-scroll-cream text-[#0a0a0a] font-semibold text-sm hover:bg-scroll-cream/90 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Next <IconArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}

// ── Step 2: The Story (AI-powered) ──
function StepStory({
  title, description, setDescription, body, setBody, tone, setTone, customTone, setCustomTone, onBack, onNext,
}: {
  title: string;
  description: string; setDescription: (v: string) => void;
  body: string; setBody: (v: string) => void;
  tone: string; setTone: (v: string) => void;
  customTone: string; setCustomTone: (v: string) => void;
  onBack: () => void; onNext: () => void;
}) {
  const toast = useToast();
  const [preview, setPreview] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const valid = description.trim().length >= 10;

  async function handleGenerate() {
    setGenerating(true);
    setGenError(null);
    toast("Generating with AI...", "loading");
    try {
      const res = await fetch("/api/whatif/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description: description.trim(),
          tone,
          customTone: tone === "custom" ? customTone : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setGenError(data.error || "Generation failed");
        toast("Generation failed", "error");
      } else {
        setBody(data.body);
        toast("Article generated", "success");
      }
    } catch {
      setGenError("Network error");
      toast("Generation failed", "error");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-scroll-cream mb-1">The Story</h2>
        <p className="text-sm text-mist-gray/50">Write it yourself or let AI generate based on your tone.</p>
      </div>

      <div>
        <label htmlFor="desc" className="block text-sm font-medium text-scroll-cream/70 mb-2">
          Hook <span className="text-mist-gray/30">({description.length}/300)</span>
        </label>
        <textarea
          id="desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={300}
          autoFocus
          rows={2}
          placeholder="A one-liner that makes people stop scrolling"
          className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-scroll-cream placeholder-mist-gray/30 text-sm focus:outline-none focus:border-white/25 transition-colors resize-none"
        />
      </div>

      {/* Tone selector */}
      <div>
        <label className="block text-sm font-medium text-scroll-cream/70 mb-2">Writing Tone</label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {TONES.map(t => (
            <button
              key={t.value}
              type="button"
              onClick={() => setTone(t.value)}
              className={`px-3 py-2 rounded-lg text-left transition-all border ${
                tone === t.value
                  ? "bg-scroll-cream/10 border-scroll-cream/20"
                  : "bg-white/[0.02] border-white/[0.04] hover:border-white/10"
              }`}
            >
              <div className={`text-xs font-heading font-medium ${tone === t.value ? "text-scroll-cream" : "text-mist-gray/50"}`}>
                {t.label}
              </div>
              <div className="text-[9px] text-mist-gray/30 mt-0.5">{t.desc}</div>
            </button>
          ))}
        </div>
        {tone === "custom" && (
          <input
            type="text"
            value={customTone}
            onChange={(e) => setCustomTone(e.target.value)}
            maxLength={200}
            placeholder="Describe your tone — e.g. 'like a cricket commentator in the last over'"
            className="w-full mt-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-scroll-cream placeholder-mist-gray/30 text-xs focus:outline-none focus:border-white/25 transition-colors"
          />
        )}
      </div>

      {/* AI Generate button */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleGenerate}
          disabled={generating || !title.trim() || !description.trim()}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600/80 to-blue-600/80 text-white text-xs font-semibold hover:from-purple-600 hover:to-blue-600 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        >
          {generating ? (
            <><IconLoader2 size={14} className="animate-spin" /> Generating...</>
          ) : (
            <><IconSparkles size={14} /> Generate with AI</>
          )}
        </button>
        <span className="text-[10px] text-mist-gray/30">Uses your title + hook + selected tone</span>
      </div>
      {genError && <p className="text-xs text-red-400/60">{genError}</p>}

      {/* Body editor */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label htmlFor="body" className="block text-sm font-medium text-scroll-cream/70">
            Analysis <span className="text-mist-gray/30">({body.length}/5000)</span>
          </label>
          {body.length > 0 && (
            <button
              type="button"
              onClick={() => setPreview(!preview)}
              className="text-xs text-mist-gray/40 hover:text-mist-gray/60 transition-colors"
            >
              {preview ? "Edit" : "Preview"}
            </button>
          )}
        </div>
        {preview ? (
          <div className="w-full min-h-[160px] px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-scroll-cream/80 text-sm leading-relaxed whitespace-pre-wrap">
            {body}
          </div>
        ) : (
          <textarea
            id="body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            maxLength={5000}
            rows={8}
            placeholder="Write your analysis or click 'Generate with AI' above..."
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-scroll-cream placeholder-mist-gray/30 text-sm focus:outline-none focus:border-white/25 transition-colors resize-y"
          />
        )}
      </div>

      <div className="pt-4 flex justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-mist-gray/50 text-sm hover:text-mist-gray/80 transition-colors"
        >
          <IconArrowLeft size={16} /> Back
        </button>
        <button
          onClick={onNext}
          disabled={!valid}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-scroll-cream text-[#0a0a0a] font-semibold text-sm hover:bg-scroll-cream/90 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Next <IconArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}

// ── Step 3: Outcomes ──
function StepOutcomes({
  outcomes, setOutcomes, onBack, onNext,
}: {
  outcomes: Outcome[]; setOutcomes: (v: Outcome[]) => void;
  onBack: () => void; onNext: () => void;
}) {
  function update(index: number, field: keyof Outcome, value: string) {
    setOutcomes(outcomes.map((o, i) => i === index ? { ...o, [field]: value } : o));
  }
  function add() {
    if (outcomes.length < 4) setOutcomes([...outcomes, { label: "", description: "" }]);
  }
  function remove(index: number) {
    if (outcomes.length > 2) setOutcomes(outcomes.filter((_, i) => i !== index));
  }

  const valid = outcomes.length >= 2 && outcomes.every(o => o.label.trim().length > 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-scroll-cream mb-1">Outcomes</h2>
        <p className="text-sm text-mist-gray/50">What could happen? Add 2-4 options for people to vote on.</p>
      </div>

      <div className="space-y-4">
        {outcomes.map((outcome, i) => (
          <div key={i} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-heading text-mist-gray/40">Outcome {i + 1}</span>
              {outcomes.length > 2 && (
                <button
                  type="button"
                  onClick={() => remove(i)}
                  className="p-1 rounded text-mist-gray/25 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                >
                  <IconTrash size={14} />
                </button>
              )}
            </div>
            <input
              type="text"
              value={outcome.label}
              onChange={(e) => update(i, "label", e.target.value)}
              maxLength={100}
              placeholder={i === 0 ? 'e.g. "Yes, it happens by 2027"' : i === 1 ? 'e.g. "No, delayed indefinitely"' : 'Another possibility...'}
              className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/[0.08] text-scroll-cream placeholder-mist-gray/25 text-sm focus:outline-none focus:border-white/20 transition-colors mb-2"
            />
            <input
              type="text"
              value={outcome.description}
              onChange={(e) => update(i, "description", e.target.value)}
              maxLength={200}
              placeholder="Brief reasoning (optional)"
              className="w-full px-3 py-2 rounded-lg bg-white/[0.02] border border-white/[0.04] text-scroll-cream/60 placeholder-mist-gray/20 text-xs focus:outline-none focus:border-white/15 transition-colors"
            />
          </div>
        ))}
      </div>

      {outcomes.length < 4 && (
        <button
          type="button"
          onClick={add}
          className="flex items-center gap-1.5 text-xs text-mist-gray/40 hover:text-mist-gray/60 transition-colors"
        >
          <IconPlus size={14} /> Add another outcome
        </button>
      )}

      <div className="pt-4 flex justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-mist-gray/50 text-sm hover:text-mist-gray/80 transition-colors"
        >
          <IconArrowLeft size={16} /> Back
        </button>
        <button
          onClick={onNext}
          disabled={!valid}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-scroll-cream text-[#0a0a0a] font-semibold text-sm hover:bg-scroll-cream/90 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Next <IconArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}

// ── Step 4: Review & Publish ──
function StepReview({
  title, category, description, body, outcomes, onBack, onEdit, onPublish, submitting, error,
}: {
  title: string; category: string; description: string; body: string;
  outcomes: Outcome[]; onBack: () => void; onEdit: (step: number) => void;
  onPublish: () => void; submitting: boolean; error: string | null;
}) {
  const catLabel = CATEGORIES.find(c => c.value === category)?.label || category;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-scroll-cream mb-1">Review & Publish</h2>
        <p className="text-sm text-mist-gray/50">Everything look right? You can edit any section.</p>
      </div>

      {/* Title + Category */}
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-heading text-mist-gray/30 uppercase tracking-wider">Prediction</span>
          <button onClick={() => onEdit(1)} className="text-mist-gray/30 hover:text-scroll-cream transition-colors">
            <IconPencil size={13} />
          </button>
        </div>
        <h3 className="text-lg font-bold text-scroll-cream leading-snug">{title}</h3>
        <span className="inline-block mt-2 px-2 py-0.5 rounded text-[10px] font-heading bg-white/5 text-mist-gray/50 border border-white/[0.04]">
          {catLabel}
        </span>
      </div>

      {/* Description + Body */}
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-heading text-mist-gray/30 uppercase tracking-wider">Story</span>
          <button onClick={() => onEdit(2)} className="text-mist-gray/30 hover:text-scroll-cream transition-colors">
            <IconPencil size={13} />
          </button>
        </div>
        <p className="text-sm text-scroll-cream/80 mb-3">{description}</p>
        {body && (
          <div className="text-xs text-mist-gray/40 leading-relaxed whitespace-pre-wrap border-t border-white/[0.04] pt-3 max-h-40 overflow-y-auto">
            {body.slice(0, 500)}{body.length > 500 ? "..." : ""}
          </div>
        )}
      </div>

      {/* Outcomes */}
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-heading text-mist-gray/30 uppercase tracking-wider">Outcomes</span>
          <button onClick={() => onEdit(3)} className="text-mist-gray/30 hover:text-scroll-cream transition-colors">
            <IconPencil size={13} />
          </button>
        </div>
        <div className="space-y-2">
          {outcomes.map((o, i) => (
            <div key={i} className="flex items-center gap-3 py-2 px-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
              <div className="w-5 h-5 rounded-full border border-white/10 flex items-center justify-center text-[9px] text-mist-gray/40">
                {String.fromCharCode(65 + i)}
              </div>
              <div>
                <div className="text-sm text-scroll-cream/80">{o.label}</div>
                {o.description && <div className="text-[10px] text-mist-gray/30">{o.description}</div>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <div className="pt-4 flex justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-mist-gray/50 text-sm hover:text-mist-gray/80 transition-colors"
        >
          <IconArrowLeft size={16} /> Back
        </button>
        <button
          onClick={onPublish}
          disabled={submitting}
          className="flex items-center gap-2 px-8 py-3 rounded-xl bg-scroll-cream text-[#0a0a0a] font-bold text-sm hover:bg-scroll-cream/90 transition-colors disabled:opacity-50"
        >
          {submitting ? "Publishing..." : "Publish Prediction"}
        </button>
      </div>
    </div>
  );
}

// ── Main Page ──
export default function CreateScenarioPage() {
  const { user, loading } = useAuth();
  const toast = useToast();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("general");
  const [description, setDescription] = useState("");
  const [body, setBody] = useState("");
  const [tone, setTone] = useState("analytical");
  const [customTone, setCustomTone] = useState("");
  const [outcomes, setOutcomes] = useState<Outcome[]>([
    { label: "", description: "" },
    { label: "", description: "" },
  ]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handlePublish() {
    setError(null);
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
        const errMsg = data.error || "Failed to create scenario";
        setError(errMsg);
        toast(errMsg, "error");
        setSubmitting(false);
        return;
      }

      toast("Prediction published!", "success");
      router.push(`/whatif/${data.id}`);
    } catch {
      setError("Network error — try again");
      toast("Network error — try again", "error");
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
        <div className="max-w-xl mx-auto py-8">
          {/* Back link */}
          <Link href="/whatif" className="inline-flex items-center gap-1.5 text-sm text-mist-gray/40 hover:text-mist-gray transition-colors mb-8">
            <IconArrowLeft size={16} /> Back to What If
          </Link>

          {/* Progress bar */}
          <StepProgress current={step} />

          {/* Step content with animation */}
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {step === 1 && (
                <StepPrediction
                  title={title} setTitle={setTitle}
                  category={category} setCategory={setCategory}
                  onNext={() => setStep(2)}
                />
              )}
              {step === 2 && (
                <StepStory
                  title={title}
                  description={description} setDescription={setDescription}
                  body={body} setBody={setBody}
                  tone={tone} setTone={setTone}
                  customTone={customTone} setCustomTone={setCustomTone}
                  onBack={() => setStep(1)}
                  onNext={() => setStep(3)}
                />
              )}
              {step === 3 && (
                <StepOutcomes
                  outcomes={outcomes} setOutcomes={setOutcomes}
                  onBack={() => setStep(2)}
                  onNext={() => setStep(4)}
                />
              )}
              {step === 4 && (
                <StepReview
                  title={title} category={category} description={description}
                  body={body} outcomes={outcomes}
                  onBack={() => setStep(3)}
                  onEdit={(s) => setStep(s)}
                  onPublish={handlePublish}
                  submitting={submitting}
                  error={error}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </>
  );
}
