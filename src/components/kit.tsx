import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, Inbox, Printer, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

/* ------------------------------ primitives ------------------------------ */
export function Btn({
  children, variant = "default", size = "md", className, icon: Icon, ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "primary" | "ghost" | "danger" | "success" | "outline";
  size?: "sm" | "md" | "lg";
  icon?: React.ComponentType<{ className?: string }>;
}) {
  const variants: Record<string, string> = {
    default: "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-xs",
    outline: "bg-transparent border border-slate-200 text-slate-700 hover:bg-slate-50",
    primary: "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-sm hover:from-purple-700 hover:to-indigo-700 active:scale-[0.98] border border-transparent font-semibold",
    ghost: "bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-900 border border-transparent",
    danger: "bg-rose-600 text-white hover:bg-rose-700 border border-transparent font-medium",
    success: "bg-emerald-600 text-white hover:bg-emerald-700 border border-transparent font-medium",
  };
  const sizes: Record<string, string> = {
    sm: "h-8 px-3 text-xs gap-1.5 rounded-lg",
    md: "h-9.5 px-4 text-sm gap-2 rounded-xl",
    lg: "h-11 px-6 text-sm gap-2 rounded-xl",
  };
  return (
    <button
      {...props}
      className={cn(
        "inline-flex items-center justify-center font-medium transition-all duration-150 disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/40",
        variants[variant], sizes[size], className,
      )}
    >
      {Icon ? <Icon className="h-4 w-4 shrink-0" /> : null}
      {children}
    </button>
  );
}

export const TONES: Record<string, string> = {
  success: "bg-emerald-50 text-emerald-700 border-emerald-200",
  danger: "bg-rose-50 text-rose-700 border-rose-200",
  warning: "bg-amber-50 text-amber-800 border-amber-200",
  info: "bg-blue-50 text-blue-700 border-blue-200",
  primary: "bg-purple-50 text-purple-700 border-purple-200",
  muted: "bg-slate-100 text-slate-600 border-slate-200",
};

export function Badge({ tone = "muted", children, className }: { tone?: string; children: ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold whitespace-nowrap", TONES[tone] ?? TONES["muted"], className)}>
      {children}
    </span>
  );
}

export function Dot({ tone = "muted" }: { tone?: string }) {
  const map: Record<string, string> = {
    success: "bg-emerald-500", danger: "bg-rose-500", warning: "bg-amber-500",
    info: "bg-blue-500", primary: "bg-purple-600", muted: "bg-slate-400",
  };
  return <span className={cn("inline-block h-2 w-2 rounded-full", map[tone] ?? map["muted"])} />;
}

export function Card({ children, className, title, action, dense }: { children: ReactNode; className?: string; title?: ReactNode; action?: ReactNode; dense?: boolean }) {
  return (
    <section className={cn("card-surface rounded-2xl bg-white border border-slate-100 shadow-xs", className)}>
      {title ? (
        <header className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <h3 className="text-sm font-bold text-slate-900 tracking-tight">{title}</h3>
          {action}
        </header>
      ) : null}
      <div className={dense ? "" : "p-5"}>{children}</div>
    </section>
  );
}

export function PageHeader({ title, subtitle, actions, children }: { title: string; subtitle?: string; actions?: ReactNode; children?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">{title}</h1>
        {subtitle ? <p className="mt-1 text-[13px] font-medium text-slate-500">{subtitle}</p> : null}
        {children}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function StatCard({
  label, value, sub, tone = "muted", trend, onClick, icon: Icon,
}: {
  label: string; value: ReactNode; sub?: ReactNode; tone?: string;
  trend?: number; onClick?: () => void; icon?: React.ComponentType<{ className?: string }>;
}) {
  const Comp = onClick ? "button" : "div";
  return (
    <Comp
      onClick={onClick}
      className={cn(
        "card-surface rounded-2xl bg-white border border-slate-100 p-5 text-left transition-all duration-200 hover:shadow-md hover:border-slate-200",
        onClick && "cursor-pointer",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{label}</span>
        {Icon ? (
          <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
            <Icon className="h-4 w-4" />
          </div>
        ) : null}
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-2xl font-bold tracking-tight text-slate-900 tabular-nums">{value}</span>
        {typeof trend === "number" ? (
          <span className={cn("text-xs font-bold", trend >= 0 ? "text-emerald-600" : "text-rose-600")}>
            {trend >= 0 ? "▲" : "▼"} {Math.abs(trend).toFixed(1)}%
          </span>
        ) : null}
      </div>
      {sub ? <div className="mt-1 text-xs text-slate-500 font-medium">{sub}</div> : null}
    </Comp>
  );
}

/* ------------------------------ overlays ------------------------------ */
export function Modal({ open, onClose, title, children, footer, wide }: { open: boolean; onClose: () => void; title: ReactNode; children: ReactNode; footer?: ReactNode; wide?: boolean }) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    if (open) window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-foreground/30 p-4 backdrop-blur-[2px] animate-in fade-in duration-150">
      <div className={cn("mt-10 w-full rounded-xl border border-border bg-card shadow-[var(--shadow-pop)] animate-in zoom-in-95 duration-150", wide ? "max-w-4xl" : "max-w-lg")}>
        <header className="flex items-center justify-between border-b border-border px-4 py-3">
          <h3 className="text-sm font-semibold">{title}</h3>
          <button aria-label="Close dialog" onClick={onClose} className="rounded-md p-1 text-muted-foreground hover:bg-secondary">
            <X className="h-4 w-4" />
          </button>
        </header>
        <div className="max-h-[70vh] overflow-y-auto p-4">{children}</div>
        {footer ? <footer className="flex justify-end gap-2 border-t border-border px-4 py-3">{footer}</footer> : null}
      </div>
    </div>
  );
}

export function Drawer({ open, onClose, title, subtitle, children, footer, width = "max-w-xl" }: { open: boolean; onClose: () => void; title: ReactNode; subtitle?: ReactNode; children: ReactNode; footer?: ReactNode; width?: string }) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    if (open) window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-foreground/30 backdrop-blur-[2px] animate-in fade-in duration-150">
      <div className="flex-1" onClick={onClose} />
      <aside className={cn("flex h-full w-full flex-col border-l border-border bg-card shadow-[var(--shadow-pop)] animate-in slide-in-from-right duration-200", width)}>
        <header className="flex items-start justify-between gap-3 border-b border-border px-4 py-3">
          <div>
            <h3 className="text-sm font-semibold">{title}</h3>
            {subtitle ? <p className="text-xs text-muted-foreground">{subtitle}</p> : null}
          </div>
          <button aria-label="Close panel" onClick={onClose} className="rounded-md p-1 text-muted-foreground hover:bg-secondary">
            <X className="h-4 w-4" />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto p-4">{children}</div>
        {footer ? <footer className="flex flex-wrap justify-end gap-2 border-t border-border px-4 py-3">{footer}</footer> : null}
      </aside>
    </div>
  );
}

export function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmLabel = "Confirm", tone = "danger" }: { open: boolean; onClose: () => void; onConfirm: () => void; title: string; message: string; confirmLabel?: string; tone?: "danger" | "primary" }) {
  return (
    <Modal
      open={open} onClose={onClose} title={title}
      footer={
        <>
          <Btn onClick={onClose}>Keep</Btn>
          <Btn variant={tone === "danger" ? "danger" : "primary"} onClick={() => { onConfirm(); onClose(); }}>{confirmLabel}</Btn>
        </>
      }
    >
      <p className="text-sm text-muted-foreground">{message}</p>
    </Modal>
  );
}

/* ------------------------------ form fields ------------------------------ */
export function Field({ label, children, hint, required, className }: { label: string; children: ReactNode; hint?: string; required?: boolean; className?: string }) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1 block text-xs font-medium text-muted-foreground">
        {label} {required ? <span className="text-danger">*</span> : null}
      </span>
      {children}
      {hint ? <span className="mt-1 block text-[11px] text-muted-foreground">{hint}</span> : null}
    </label>
  );
}

const fieldCls =
  "h-9.5 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition-all placeholder:text-slate-400 text-slate-900 focus:border-purple-500 focus:ring-2 focus:ring-purple-100";

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(fieldCls, props.className)} />;
}
export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cn(fieldCls, "h-auto min-h-[72px] py-2.5", props.className)} />;
}
export function Select({ options, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { options: { value: string; label: string }[] }) {
  return (
    <div className="relative">
      <select {...props} className={cn(fieldCls, "appearance-none pr-8 cursor-pointer", props.className)}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-3 h-4 w-4 text-slate-400" />
    </div>
  );
}

export function SearchInput({ value, onChange, placeholder = "Search…", className }: { value: string; onChange: (v: string) => void; placeholder?: string; className?: string }) {
  return (
    <div className={cn("relative", className)}>
      <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
      <input
        aria-label={placeholder} value={value} placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={cn(fieldCls, "pl-9")}
      />
    </div>
  );
}

export function Tabs({ tabs, value, onChange, className }: { tabs: { value: string; label: string; count?: number }[]; value: string; onChange: (v: string) => void; className?: string }) {
  return (
    <div className={cn("flex flex-wrap gap-1 border-b border-slate-200", className)}>
      {tabs.map((t) => (
        <button
          key={t.value} onClick={() => onChange(t.value)}
          className={cn(
            "-mb-px border-b-2 px-3.5 py-2.5 text-sm font-semibold transition-all duration-150 cursor-pointer",
            value === t.value ? "border-purple-600 text-purple-700 font-bold" : "border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300",
          )}
        >
          {t.label}
          {typeof t.count === "number" ? (
            <span className={cn(
              "ml-1.5 rounded-full px-2 py-0.5 text-[11px] tabular-nums font-bold",
              value === t.value ? "bg-purple-100 text-purple-800" : "bg-slate-100 text-slate-600",
            )}>
              {t.count}
            </span>
          ) : null}
        </button>
      ))}
    </div>
  );
}

export function Shimmer({ className }: { className?: string }) {
  return <div className={cn("shimmer-skeleton rounded-md", className)} />;
}

export function StatSkeleton() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mb-5">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="card-surface p-4 rounded-xl border border-border/60 space-y-3">
          <div className="flex justify-between items-center">
            <div className="h-3.5 w-24 shimmer-skeleton rounded" />
            <div className="h-4 w-4 shimmer-skeleton rounded-full" />
          </div>
          <div className="h-7 w-28 shimmer-skeleton rounded-md" />
          <div className="h-3 w-36 shimmer-skeleton rounded" />
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="card-surface rounded-xl border border-border/60 overflow-hidden">
      <div className="p-3 border-b border-border/60 flex items-center justify-between gap-3">
        <div className="h-9 w-64 shimmer-skeleton rounded-lg" />
        <div className="flex gap-2">
          <div className="h-9 w-24 shimmer-skeleton rounded-lg" />
          <div className="h-9 w-28 shimmer-skeleton rounded-lg" />
        </div>
      </div>
      <div className="divide-y divide-border/40 p-2 space-y-2">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center justify-between p-3 gap-4">
            <div className="flex items-center gap-3 flex-1">
              <div className="h-9 w-9 rounded-full shimmer-skeleton flex-shrink-0" />
              <div className="space-y-1.5 flex-1 max-w-sm">
                <div className="h-4 w-3/4 shimmer-skeleton rounded" />
                <div className="h-3 w-1/2 shimmer-skeleton rounded" />
              </div>
            </div>
            <div className="h-5 w-20 shimmer-skeleton rounded-full hidden sm:block" />
            <div className="h-4 w-24 shimmer-skeleton rounded hidden md:block" />
            <div className="h-8 w-20 shimmer-skeleton rounded-md" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="card-surface rounded-xl border border-border/60 p-5 space-y-4">
      <div className="flex justify-between items-center border-b border-border/50 pb-3">
        <div className="h-5 w-40 shimmer-skeleton rounded" />
        <div className="h-4 w-16 shimmer-skeleton rounded-full" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="h-10 shimmer-skeleton rounded-lg" />
        <div className="h-10 shimmer-skeleton rounded-lg" />
        <div className="h-10 shimmer-skeleton rounded-lg" />
        <div className="h-10 shimmer-skeleton rounded-lg" />
      </div>
      <div className="h-24 shimmer-skeleton rounded-lg mt-2" />
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* Header Skeleton */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
        <div className="space-y-2">
          <div className="h-6 w-48 shimmer-skeleton rounded-md" />
          <div className="h-3.5 w-72 shimmer-skeleton rounded" />
        </div>
        <div className="flex gap-2">
          <div className="h-9 w-28 shimmer-skeleton rounded-lg" />
          <div className="h-9 w-32 shimmer-skeleton rounded-lg" />
        </div>
      </div>

      {/* Stat Cards Skeleton */}
      <StatSkeleton />

      {/* Table Skeleton */}
      <TableSkeleton rows={5} />
    </div>
  );
}

export function EmptyState({ title, message, action, icon: Icon = Inbox }: { title: string; message?: string; action?: ReactNode; icon?: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-14 text-center">
      <div className="rounded-full bg-secondary p-3">
        <Icon className="h-5 w-5 text-muted-foreground" />
      </div>
      <p className="text-sm font-medium">{title}</p>
      {message ? <p className="max-w-sm text-xs text-muted-foreground">{message}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}

export function LoadingState({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2.5 p-4">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-12 shimmer-skeleton rounded-lg border border-border/40" />
      ))}
    </div>
  );
}

/* ------------------------------ success celebration modal ------------------------------ */
export function SuccessModal({
  open,
  onClose,
  title = "Success!",
  subtitle = "Action completed successfully",
  details,
  primaryAction,
  secondaryAction,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  details?: { label: string; value: ReactNode }[];
  primaryAction?: { label: string; onClick: () => void; icon?: React.ComponentType<{ className?: string }> };
  secondaryAction?: { label: string; onClick: () => void };
}) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    if (open) window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-foreground/40 p-4 backdrop-blur-[4px] animate-in fade-in duration-200">
      <div className="celebrate-pop relative w-full max-w-md overflow-hidden rounded-2xl border border-primary/25 bg-card p-6 shadow-2xl">
        {/* Top Gold/Emerald Glow */}
        <div className="pointer-events-none absolute -top-16 left-1/2 h-32 w-64 -translate-x-1/2 rounded-full bg-primary/20 blur-2xl" />

        {/* Animated Checkmark Circle */}
        <div className="relative mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success/15 success-halo">
          <svg className="h-8 w-8 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <div className="text-center">
          <h3 className="text-xl font-bold tracking-tight text-foreground">{title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        </div>

        {details && details.length > 0 && (
          <div className="mt-5 rounded-xl border border-border/80 bg-secondary/50 p-3.5 space-y-2 text-xs">
            {details.map((d, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-muted-foreground">{d.label}</span>
                <span className="font-semibold text-foreground text-right">{d.value}</span>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 flex flex-col gap-2">
          {primaryAction && (
            <Btn
              variant="primary"
              size="lg"
              className="w-full shadow-md font-semibold text-sm"
              icon={primaryAction.icon}
              onClick={() => {
                primaryAction.onClick();
              }}
            >
              {primaryAction.label}
            </Btn>
          )}
          {secondaryAction ? (
            <Btn
              variant="outline"
              size="md"
              className="w-full text-xs"
              onClick={() => {
                secondaryAction.onClick();
              }}
            >
              {secondaryAction.label}
            </Btn>
          ) : (
            <Btn
              variant="ghost"
              size="sm"
              className="w-full text-xs text-muted-foreground"
              onClick={onClose}
            >
              Close Window
            </Btn>
          )}
        </div>
      </div>
    </div>
  );
}


/* ------------------------------ data table ------------------------------ */
export interface Column<T> {
  key: string;
  label: string;
  render?: (row: T) => ReactNode;
  value?: (row: T) => string | number;
  align?: "left" | "right" | "center";
  width?: string;
  sortable?: boolean;
}

export function DataTable<T>({
  columns, rows, searchKeys, toolbar, pageSize = 12, empty, onRowClick, dense, rowKey,
}: {
  columns: Column<T>[];
  rows: T[];
  searchKeys?: (keyof T | ((row: T) => string))[];
  toolbar?: ReactNode;
  pageSize?: number;
  empty?: ReactNode;
  onRowClick?: (row: T) => void;
  dense?: boolean;
  rowKey?: (row: T, i: number) => string;
}) {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<{ key: string; dir: 1 | -1 } | null>(null);

  const filtered = useMemo(() => {
    let out = rows;
    if (q && searchKeys?.length) {
      const t = q.toLowerCase();
      out = out.filter((r) =>
        searchKeys.some((k) => {
          const v = typeof k === "function" ? k(r) : (r[k] as unknown);
          return String(v ?? "").toLowerCase().includes(t);
        }),
      );
    }
    if (sort) {
      const col = columns.find((c) => c.key === sort.key);
      out = [...out].sort((a, b) => {
        const av = col?.value ? col.value(a) : ((a as Record<string, unknown>)[sort.key] as string | number);
        const bv = col?.value ? col.value(b) : ((b as Record<string, unknown>)[sort.key] as string | number);
        if (typeof av === "number" && typeof bv === "number") return (av - bv) * sort.dir;
        return String(av ?? "").localeCompare(String(bv ?? "")) * sort.dir;
      });
    }
    return out;
  }, [rows, q, sort, columns, searchKeys]);

  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = Math.min(page, pages);
  const slice = filtered.slice((current - 1) * pageSize, current * pageSize);

  return (
    <div className="card-surface rounded-2xl bg-white border border-slate-100 shadow-xs overflow-hidden">
      {(searchKeys || toolbar) && (
        <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 p-4">
          {searchKeys ? <SearchInput value={q} onChange={(v) => { setQ(v); setPage(1); }} className="w-full sm:w-72" /> : null}
          <div className="flex flex-1 flex-wrap items-center gap-2">{toolbar}</div>
          <span className="text-xs font-semibold text-slate-400 tabular-nums">{filtered.length} record(s)</span>
        </div>
      )}
      <div className="overflow-x-auto w-full">
        <table className={cn("w-full border-collapse", dense ? "text-xs" : "text-sm")}>
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/80">
              {columns.map((c) => (
                <th
                  key={c.key}
                  style={c.width ? { width: c.width } : undefined}
                  onClick={() => c.sortable !== false && setSort((s) => (s?.key === c.key ? { key: c.key, dir: s.dir === 1 ? -1 : 1 } : { key: c.key, dir: 1 }))}
                  className={cn(
                    dense ? "px-3 py-2.5 text-[10.5px]" : "px-4 py-3 text-[11px]",
                    "font-bold uppercase tracking-wider text-slate-400 select-none whitespace-nowrap",
                    c.align === "right" ? "text-right" : c.align === "center" ? "text-center" : "text-left",
                    c.sortable !== false && "cursor-pointer hover:text-purple-600 transition-colors",
                  )}
                >
                  {c.label}
                  {sort?.key === c.key ? <span className="ml-1 text-purple-600 font-extrabold">{sort.dir === 1 ? "↑" : "↓"}</span> : null}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {slice.map((row, i) => (
              <tr
                key={rowKey ? rowKey(row, i) : ((row as { id?: string }).id ?? i)}
                onClick={() => onRowClick?.(row)}
                className={cn("transition-colors hover:bg-purple-50/30", onRowClick && "cursor-pointer")}
              >
                {columns.map((c) => (
                  <td
                    key={c.key}
                    className={cn(
                      dense ? "px-3 py-2 text-xs" : "px-4 py-3",
                      c.align === "right" ? "text-right tabular-nums" : c.align === "center" ? "text-center" : "text-left",
                      "whitespace-nowrap font-medium text-slate-700",
                    )}
                  >
                    {c.render ? c.render(row) : String((row as Record<string, unknown>)[c.key] ?? "—")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {!slice.length ? (empty ?? <EmptyState title="No records found" message="Try changing the search text or filters." action={q ? <Btn size="sm" onClick={() => setQ("")}>Clear search</Btn> : undefined} />) : null}
      </div>
      {pages > 1 ? (
        <div className="flex items-center justify-between gap-2 border-t border-slate-100 px-4 py-3 bg-slate-50/40">
          <span className="text-xs font-semibold text-slate-500">Page {current} of {pages}</span>
          <div className="flex gap-1.5">
            <Btn size="sm" onClick={() => setPage(Math.max(1, current - 1))} disabled={current === 1} aria-label="Previous page"><ChevronLeft className="h-4 w-4" /></Btn>
            <Btn size="sm" onClick={() => setPage(Math.min(pages, current + 1))} disabled={current === pages} aria-label="Next page"><ChevronRight className="h-4 w-4" /></Btn>
          </div>
        </div>
      ) : null}
    </div>
  );
}

/* ------------------------------ misc ------------------------------ */
export function KV({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 py-1.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}

export function Tip({ label, children }: { label: string; children: ReactNode }) {
  return (
    <span className="group relative inline-flex">
      {children}
      <span className="pointer-events-none absolute -top-8 left-1/2 z-40 -translate-x-1/2 whitespace-nowrap rounded-md bg-foreground px-2 py-1 text-[11px] text-background opacity-0 transition-opacity group-hover:opacity-100">
        {label}
      </span>
    </span>
  );
}

export function PrintButton({ label = "Print" }: { label?: string }) {
  return <Btn icon={Printer} onClick={() => window.print()} className="no-print">{label}</Btn>;
}

export function Table({ children, className, ...props }: React.TableHTMLAttributes<HTMLTableElement>) {
  return (
    <table className={cn("w-full text-left border-collapse", className)} {...props}>
      {children}
    </table>
  );
}

export function exportCSV(filename: string, rows: Record<string, unknown>[]) {
  if (!rows.length) return;
  const keys = Object.keys(rows[0]!);
  const csv = [
    keys.join(","),
    ...rows.map((r) => keys.map((k) => `"${String(r[k] ?? "").replace(/"/g, '""')}"`).join(",")),
  ].join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
