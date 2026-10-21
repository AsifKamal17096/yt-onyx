"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AlertTriangle, Check, Info, X } from "lucide-react";
import { cn } from "@/lib/cn";

type ToastTone = "success" | "error" | "info";

type Toast = {
  id: number;
  tone: ToastTone;
  message: string;
};

type ToastApi = {
  toast: (message: string, tone?: ToastTone) => void;
};

const ToastContext = createContext<ToastApi>({ toast: () => undefined });

export function useToast(): ToastApi {
  return useContext(ToastContext);
}

const ICONS = {
  success: Check,
  error: AlertTriangle,
  info: Info,
} as const;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((item) => item.id !== id));
  }, []);

  const toast = useCallback((message: string, tone: ToastTone = "success") => {
    const id = nextId.current++;
    setToasts((current) => [...current.slice(-3), { id, tone, message }]);
  }, []);

  const api = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="pointer-events-none fixed bottom-5 right-5 z-[60] flex w-[min(22rem,calc(100vw-2.5rem))] flex-col gap-2"
      >
        {toasts.map((item) => (
          <ToastItem key={item.id} toast={item} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: (id: number) => void;
}) {
  // Each toast owns its own timer so a new one does not reset the others.
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), 5000);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  const Icon = ICONS[toast.tone];

  return (
    <div
      role="status"
      className={cn(
        "pointer-events-auto flex items-start gap-3 border px-4 py-3 text-sm shadow-[0_18px_40px_-20px_rgba(10,10,10,0.65)] animate-fade-up",
        toast.tone === "error"
          ? "border-red-300 bg-red-50 text-red-900"
          : toast.tone === "info"
            ? "border-line bg-cream text-ink"
            : "border-green-300 bg-green-50 text-green-900",
      )}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.8} />
      <p className="flex-1 leading-snug">{toast.message}</p>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        aria-label="Dismiss"
        className="-mr-1 p-1 opacity-60 transition-opacity hover:opacity-100"
      >
        <X className="h-3.5 w-3.5" strokeWidth={2} />
      </button>
    </div>
  );
}
