"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { IconMessageCircle, IconSend, IconCornerDownRight, IconLoader2, IconLock } from "@tabler/icons-react";
import { timeAgo } from "@/lib/utils";
import { useAuth } from "@/lib/auth/AuthProvider";
import Link from "next/link";
import { useToast } from "@/components/ui/Toast";

interface Comment {
  id: string;
  scenario_id: string;
  parent_id: string | null;
  display_name: string;
  body: string;
  created_at: string;
}

interface CommentsProps {
  scenarioId: string;
  category?: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  politics: "text-rose-400 bg-rose-400/10 border-rose-400/20",
  economy: "text-orange-400 bg-orange-400/10 border-orange-400/20",
  tech: "text-cyan-400 bg-cyan-400/10 border-cyan-400/20",
  society: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  sports: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
  entertainment: "text-pink-400 bg-pink-400/10 border-pink-400/20",
  general: "text-mist-gray bg-mist-gray/10 border-mist-gray/20",
};

export default function Comments({ scenarioId, category }: CommentsProps) {
  const { user } = useAuth();
  const toast = useToast();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("whatif-comment-name") || "";
    }
    return "";
  });
  const [body, setBody] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchComments = useCallback(() => {
    fetch(`/api/whatif/${scenarioId}/comments`)
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load");
        return r.json();
      })
      .then((data) => setComments(data.comments || []))
      .catch(() => setError("Could not load comments"))
      .finally(() => setLoading(false));
  }, [scenarioId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = body.trim();
    if (!trimmed || submitting) return;

    setSubmitting(true);
    setError(null);

    const displayName = name.trim() || "Anonymous";
    if (name.trim()) {
      localStorage.setItem("whatif-comment-name", name.trim());
    }

    try {
      const res = await fetch(`/api/whatif/${scenarioId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          display_name: displayName,
          body: trimmed,
          parent_id: replyTo,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Failed to post" }));
        throw new Error(data.error || "Failed to post comment");
      }

      const data = await res.json();
      setComments((prev) => [...prev, data.comment]);
      setBody("");
      setReplyTo(null);
      toast("Comment posted", "success");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to post comment";
      setError(msg);
      toast("Failed to post comment", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // Build thread structure
  const topLevel = comments.filter((c) => !c.parent_id);
  const replies = comments.filter((c) => c.parent_id);
  const repliesByParent = new Map<string, Comment[]>();
  for (const r of replies) {
    const arr = repliesByParent.get(r.parent_id!) || [];
    arr.push(r);
    repliesByParent.set(r.parent_id!, arr);
  }

  const replyingToComment = replyTo ? comments.find((c) => c.id === replyTo) : null;

  return (
    <div className="rounded-xl border border-white/[0.04] bg-[#0c0c14] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.04]">
        <div className="flex items-center gap-2">
          <IconMessageCircle size={14} className="text-amaterasu-purple" />
          <h3 className="font-mono text-[11px] uppercase tracking-widest text-scroll-cream/80">
            Discussion
          </h3>
        </div>
        <span className="text-[10px] font-mono text-mist-gray/40">
          {comments.length} {comments.length === 1 ? "comment" : "comments"}
        </span>
      </div>

      {/* Category context */}
      {category && (
        <div className="px-5 py-2 border-b border-white/[0.04]">
          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-heading border ${CATEGORY_COLORS[category] || CATEGORY_COLORS.general}`}>
            Discussing in {category.charAt(0).toUpperCase() + category.slice(1)}
          </span>
        </div>
      )}

      {/* Comment form — locked if not signed in */}
      {!user ? (
        <div className="px-5 py-6 border-b border-white/[0.04] text-center">
          <IconLock size={20} className="mx-auto mb-2 text-mist-gray/20" />
          <p className="text-sm text-mist-gray/40 mb-3">Sign in to join the discussion</p>
          <Link href="/auth/login" className="inline-block px-4 py-2 rounded-lg bg-scroll-cream text-[#0a0a0a] text-xs font-semibold hover:bg-scroll-cream/90 transition-colors">
            Sign in
          </Link>
        </div>
      ) : (
      <form onSubmit={handleSubmit} className="px-5 py-4 border-b border-white/[0.04]">
        {replyingToComment && (
          <div className="flex items-center gap-2 mb-3 text-[11px] font-mono text-amaterasu-purple/70">
            <IconCornerDownRight size={12} />
            <span>Replying to {replyingToComment.display_name}</span>
            <button
              type="button"
              onClick={() => setReplyTo(null)}
              className="ml-auto text-mist-gray/40 hover:text-scroll-cream transition-colors"
            >
              Cancel
            </button>
          </div>
        )}

        <div className="flex gap-3 mb-3">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name (optional)"
            maxLength={50}
            className="flex-shrink-0 w-36 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06]
              text-[13px] text-scroll-cream/80 placeholder:text-mist-gray/30
              focus:outline-none focus:border-amaterasu-purple/30 transition-colors"
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Share your take on this scenario..."
            maxLength={2000}
            rows={1}
            className="flex-1 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06]
              text-[13px] text-scroll-cream/80 placeholder:text-mist-gray/30 resize-none
              focus:outline-none focus:border-amaterasu-purple/30 transition-colors"
            onInput={(e) => {
              const el = e.currentTarget;
              el.style.height = "auto";
              el.style.height = Math.min(el.scrollHeight, 120) + "px";
            }}
          />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono text-mist-gray/30">
            {body.length}/2000
          </span>
          <button
            type="submit"
            disabled={!body.trim() || submitting}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-[11px] font-mono uppercase tracking-wider
              bg-amaterasu-purple/10 border border-amaterasu-purple/20 text-amaterasu-purple
              hover:bg-amaterasu-purple/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            {submitting ? <IconLoader2 size={12} className="animate-spin" /> : <IconSend size={12} />}
            {submitting ? "Posting..." : "Post"}
          </button>
        </div>

        {error && (
          <p className="mt-2 text-[11px] font-mono text-sharingan-red/70">{error}</p>
        )}
      </form>
      )}

      {/* Comments list */}
      <div className="px-5 py-4">
        {loading ? (
          <div className="flex items-center justify-center py-8 gap-2">
            <IconLoader2 size={14} className="animate-spin text-mist-gray/30" />
            <span className="text-[11px] font-mono text-mist-gray/30">Loading comments...</span>
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-[13px] text-mist-gray/40 font-body">No comments yet. Be the first to share your thoughts.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {topLevel.map((comment) => (
              <CommentThread
                key={comment.id}
                comment={comment}
                replies={repliesByParent.get(comment.id) || []}
                onReply={(id) => setReplyTo(id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CommentThread({
  comment,
  replies,
  onReply,
}: {
  comment: Comment;
  replies: Comment[];
  onReply: (id: string) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <CommentItem comment={comment} onReply={onReply} />
      {replies.length > 0 && (
        <div className="ml-6 mt-2 pl-4 border-l border-white/[0.04] space-y-3">
          {replies.map((reply) => (
            <CommentItem key={reply.id} comment={reply} onReply={onReply} isReply />
          ))}
        </div>
      )}
    </motion.div>
  );
}

function CommentItem({
  comment,
  onReply,
  isReply = false,
}: {
  comment: Comment;
  onReply: (id: string) => void;
  isReply?: boolean;
}) {
  return (
    <div className="group">
      <div className="flex items-center gap-2 mb-1">
        <span className={`font-heading ${isReply ? "text-[12px]" : "text-[13px]"} text-scroll-cream/80`}>
          {comment.display_name}
        </span>
        <span className="text-[10px] font-mono text-mist-gray/30">
          {timeAgo(comment.created_at)}
        </span>
      </div>
      <p className={`text-scroll-cream/70 font-body ${isReply ? "text-[12px]" : "text-[13px]"} leading-relaxed`}>
        {comment.body}
      </p>
      <button
        onClick={() => onReply(comment.id)}
        className="mt-1 text-[10px] font-mono text-mist-gray/30 hover:text-amaterasu-purple transition-colors
          opacity-0 group-hover:opacity-100"
      >
        Reply
      </button>
    </div>
  );
}
