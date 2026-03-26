"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  useRef,
  type ReactNode,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  IconCheck,
  IconX,
  IconInfoCircle,
  IconLoader2,
} from "@tabler/icons-react";

/* ── Types ── */
type ToastType = "success" | "error" | "info" | "loading";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

type ToastFn = (message: string, type?: ToastType) => void;

/* ── Context ── */
const ToastContext = createContext<ToastFn | null>(null);

export function useToast(): ToastFn {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within <ToastProvider>");
  return ctx;
}

/* ── Styling per type ── */
const TYPE_CONFIG: Record<
  ToastType,
  { border: string; icon: typeof IconCheck; iconClass: string }
> = {
  success: {
    border: "border-l-green-500",
    icon: IconCheck,
    iconClass: "text-green-400",
  },
  error: {
    border: "border-l-red-500",
    icon: IconX,
    iconClass: "text-red-400",
  },
  info: {
    border: "border-l-blue-500",
    icon: IconInfoCircle,
    iconClass: "text-blue-400",
  },
  loading: {
    border: "border-l-amber-500",
    icon: IconLoader2,
    iconClass: "text-amber-400 animate-spin",
  },
};

const MAX_VISIBLE = 3;

/* ── Provider ── */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map(),
  );

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
  }, []);

  const toast: ToastFn = useCallback(
    (message, type = "info") => {
      const id = crypto.randomUUID();
      setToasts((prev) => {
        const next = [...prev, { id, message, type }];
        // Keep only the last MAX_VISIBLE
        return next.slice(-MAX_VISIBLE);
      });

      // Auto-dismiss (skip for loading — caller controls lifecycle)
      if (type !== "loading") {
        const delay = type === "error" ? 5000 : 3000;
        const timer = setTimeout(() => dismiss(id), delay);
        timersRef.current.set(id, timer);
      }
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={toast}>
      {children}

      {/* Toast container */}
      <div
        aria-live="polite"
        className="fixed bottom-6 right-6 z-[9999] flex flex-col-reverse gap-2
          max-sm:right-1/2 max-sm:translate-x-1/2 max-sm:w-[calc(100%-2rem)]
          sm:w-80"
      >
        <AnimatePresence mode="popLayout">
          {toasts.map((t) => {
            const cfg = TYPE_CONFIG[t.type];
            const Icon = cfg.icon;
            return (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, y: 24, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -12, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className={`flex items-start gap-3 rounded-lg border-l-[3px] ${cfg.border}
                  bg-[#141418]/95 backdrop-blur-md border border-white/[0.06]
                  px-4 py-3 shadow-xl`}
              >
                <Icon size={16} className={`mt-0.5 flex-shrink-0 ${cfg.iconClass}`} />
                <span className="flex-1 text-sm text-scroll-cream/90 leading-snug">
                  {t.message}
                </span>
                <button
                  onClick={() => dismiss(t.id)}
                  className="mt-0.5 flex-shrink-0 text-mist-gray/30 hover:text-mist-gray/60 transition-colors"
                  aria-label="Dismiss"
                >
                  <IconX size={14} />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
