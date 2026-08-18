import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, Inbox, Printer, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

/* ------------------------------ primitives ------------------------------ */
export function Btn({
  children, variant = "default", size = "md", className, icon: Icon, ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "primary" | "ghost" | "danger" | "success" | "outline" | "gold";
  size?: "sm" | "md" | "lg";
  icon?: React.ComponentType<{ className?: string }>;
}) {
  const variants: Record<string, string> = {
    default: "bg-[#ffffff] border border-[#d1c4bd] !text-[#170f0a] hover:bg-[#f5f3ee] font-medium",
    outline: "bg-transparent border border-[#d1c4bd] !text-[#170f0a] hover:bg-[#f5f3ee] font-medium",
    primary: "bg-[#170f0a] !text-[#ffffff] hover:bg-[#2d241e] active:scale-[0.99] border border-[#170f0a] font-bold",
    gold: "bg-[#fed65b] !text-[#745c00] hover:bg-[#e9c349] border border-[#e9c349] font-bold",
    ghost: "bg-transparent !text-[#4e4540] hover:bg-[#f0eee9] hover:!text-[#170f0a] border border-transparent font-medium",
    danger: "bg-[#ba1a1a] !text-[#ffffff] hover:bg-[#93000a] border border-[#ba1a1a] font-bold",
    success: "bg-[#285430] !text-[#ffffff] hover:bg-[#1e3f24] border border-[#285430] font-bold",
  };
  const sizes: Record<string, string> = {
    sm: "h-8 px-3 text-xs gap-1.5 rounded-[0.25rem]",
    md: "h-9 px-4 text-xs gap-2 rounded-[0.25rem]",
    lg: "h-10 px-5 text-sm gap-2.5 rounded-[0.25rem]",
  };
  return (
    <button
      {...props}
      className={cn(
        "inline-flex items-center justify-center transition-colors duration-150 disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary cursor-pointer select-none tracking-wide",
        variants[variant], sizes[size], className,
      )}
    >
      {Icon ? <Icon className="h-4 w-4 shrink-0" /> : null}
      {children}
    </button>
  );
}

export const TONES: Record<string, string> = {
  success: "bg-[#e5eedc] text-[#285430] border-[#c0d6b0]",
  danger: "bg-[#ffdad6] text-[#93000a] border-[#ffb4ab]",
  warning: "bg-[#fed65b]/20 text-[#745c00] border-[#fed65b]/60",
  info: "bg-[#e2e8ec] text-[#2c4251] border-[#c5d1d9]",
  primary: "bg-[#f0dfd6] text-[#4f453e] border-[#d3c3ba]",
  muted: "bg-[#f5f3ee] text-[#4e4540] border-[#d1c4bd]",
};

export function Badge({ tone = "muted", children, className }: { tone?: string; children: ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-[0.25rem] border px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wider whitespace-nowrap font-label-caps", TONES[tone] ?? TONES["muted"], className)}>
      {children}
    </span>
  );
}

export function Dot({ tone = "muted" }: { tone?: string }) {
  const map: Record<string, string> = {
    success: "bg-[#285430]", danger: "bg-error", warning: "bg-secondary",
    info: "bg-[#2c4251]", primary: "bg-primary", muted: "bg-outline",
  };
  return <span className={cn("inline-block h-2 w-2 rounded-full", map[tone] ?? map["muted"])} />;
}

export function Card({ children, className, title, action, dense }: { children: ReactNode; className?: string; title?: ReactNode; action?: ReactNode; dense?: boolean }) {
  const hasOverflow = className && /overflow-(hidden|visible|auto|scroll)/.test(className);
  return (
    <section className={cn("bg-surface border border-outline-variant rounded-[0.25rem]", !hasOverflow && "overflow-hidden", className)}>
      {title ? (
        <header className="flex items-center justify-between gap-3 border-b border-outline-variant px-5 py-3.5 bg-surface-container-low">
          <h3 className="font-headline-sm text-sm sm:text-base text-primary font-serif">{title}</h3>
          {action}
        </header>
      ) : null}
      <div className={dense ? "" : "p-5"}>{children}</div>
    </section>
  );
}

export function PageHeader({ title, subtitle, actions, children }: { title: string; subtitle?: string; actions?: ReactNode; children?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl sm:text-3xl font-display-md text-primary">{title}</h1>
        {subtitle ? <p className="mt-1 text-xs font-medium text-on-surface-variant font-sans">{subtitle}</p> : null}
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
        "p-5 border border-outline-variant bg-surface rounded-[0.25rem] text-left transition-colors flex flex-col justify-between h-36",
        onClick && "cursor-pointer hover:bg-surface-container-low",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="font-label-caps text-label-caps text-on-surface-variant">{label}</span>
        {Icon ? (
          <div className="text-outline">
            <Icon className="h-4 w-4" />
          </div>
        ) : null}
      </div>
      <div>
        <div className="font-display-md text-display-md text-primary tabular-nums">{value}</div>
        <div className="flex items-center gap-1 mt-1">
          {typeof trend === "number" ? (
            <span className={cn("text-xs font-semibold tabular-nums", trend >= 0 ? "text-secondary" : "text-error")}>
              {trend >= 0 ? "↗ +" : "↘ -"}{Math.abs(trend).toFixed(1)}% vs last week
            </span>
          ) : sub ? (
            <span className="font-data-tabular text-data-tabular text-outline">{sub}</span>
          ) : null}
        </div>
      </div>
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
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-primary/40 p-4 backdrop-blur-[2px] animate-in fade-in duration-150">
      <div className={cn("mt-12 w-full rounded-[0.25rem] border border-outline-variant bg-surface shadow-2xl animate-in zoom-in-95 duration-150 overflow-hidden", wide ? "max-w-4xl" : "max-w-lg")}>
        <header className="flex items-center justify-between border-b border-outline-variant px-5 py-4 bg-surface-container-low">
          <h3 className="font-headline-sm text-base text-primary font-serif">{title}</h3>
          <button aria-label="Close dialog" onClick={onClose} className="rounded p-1 text-outline hover:bg-surface-container hover:text-primary transition-colors cursor-pointer">
            <X className="h-4 w-4" />
          </button>
        </header>
        <div className="max-h-[72vh] overflow-y-auto p-5 font-sans">{children}</div>
        {footer ? <footer className="flex justify-end gap-2.5 border-t border-outline-variant px-5 py-3.5 bg-surface-container-low">{footer}</footer> : null}
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
    <div className="fixed inset-0 z-50 flex justify-end bg-primary/40 backdrop-blur-[2px] animate-in fade-in duration-150">
      <div className="flex-1" onClick={onClose} />
      <aside className={cn("flex h-full w-full flex-col border-l border-outline-variant bg-surface shadow-2xl animate-in slide-in-from-right duration-200", width)}>
        <header className="flex items-start justify-between gap-3 border-b border-outline-variant px-5 py-4 bg-surface-container-low">
          <div>
            <h3 className="font-headline-sm text-base text-primary font-serif">{title}</h3>
            {subtitle ? <p className="text-xs text-on-surface-variant font-medium mt-0.5">{subtitle}</p> : null}
          </div>
          <button aria-label="Close panel" onClick={onClose} className="rounded p-1 text-outline hover:bg-surface-container hover:text-primary transition-colors cursor-pointer">
            <X className="h-4 w-4" />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto p-5 font-sans">{children}</div>
        {footer ? <footer className="flex flex-wrap justify-end gap-2.5 border-t border-outline-variant px-5 py-3.5 bg-surface-container-low">{footer}</footer> : null}
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
          <Btn onClick={onClose} variant="outline">Cancel</Btn>
          <Btn variant={tone === "danger" ? "danger" : "primary"} onClick={() => { onConfirm(); onClose(); }}>{confirmLabel}</Btn>
        </>
      }
    >
      <p className="text-xs font-medium text-on-surface-variant">{message}</p>
    </Modal>
  );
}

/* ------------------------------ form fields ------------------------------ */
export function Field({ label, children, hint, required, className }: { label: string; children: ReactNode; hint?: string; required?: boolean; className?: string }) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1 block font-label-caps text-label-caps text-on-surface-variant">
        {label} {required ? <span className="text-error">*</span> : null}
      </span>
      {children}
      {hint ? <span className="mt-1 block text-[11px] font-medium text-outline">{hint}</span> : null}
    </label>
  );
}

const fieldCls =
  "h-9 w-full rounded-[0.25rem] border border-outline-variant bg-surface px-3 text-xs sm:text-sm outline-none transition-colors placeholder:text-outline text-primary focus:border-primary focus:ring-1 focus:ring-primary";

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
      <ChevronDown className="pointer-events-none absolute right-2.5 top-2.5 h-4 w-4 text-outline" />
    </div>
  );
}

export function SearchInput({ value, onChange, placeholder = "Search…", className }: { value: string; onChange: (v: string) => void; placeholder?: string; className?: string }) {
  return (
    <div className={cn("relative", className)}>
      <Search className="absolute left-3 top-2.5 h-4 w-4 text-outline" />
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
    <div className={cn("flex flex-wrap gap-2 border-b border-outline-variant", className)}>
      {tabs.map((t) => (
        <button
          key={t.value} onClick={() => onChange(t.value)}
          className={cn(
            "-mb-px border-b-2 px-3.5 py-2 text-xs font-label-caps transition-colors cursor-pointer",
            value === t.value ? "border-primary text-primary font-bold" : "border-transparent text-outline hover:text-primary",
          )}
        >
          {t.label}
          {typeof t.count === "number" ? (
            <span className={cn(
              "ml-1.5 rounded-[0.25rem] px-1.5 py-0.2 text-[10px] tabular-nums font-bold",
              value === t.value ? "bg-primary text-on-primary" : "bg-surface-container text-on-surface-variant",
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
  return <div className={cn("bg-surface-container-high animate-pulse rounded-[0.25rem]", className)} />;
}

export function StatSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="p-5 border border-outline-variant bg-surface rounded-[0.25rem] space-y-3 h-36 flex flex-col justify-between">
          <div className="flex justify-between items-center">
            <div className="h-3 w-20 bg-surface-container-high animate-pulse rounded" />
            <div className="h-5 w-5 bg-surface-container-high animate-pulse rounded-full" />
          </div>
          <div className="h-8 w-24 bg-surface-container-high animate-pulse rounded" />
          <div className="h-3 w-32 bg-surface-container-high animate-pulse rounded" />
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="border border-outline-variant bg-surface rounded-[0.25rem] overflow-hidden">
      <div className="p-4 border-b border-outline-variant flex items-center justify-between gap-3 bg-surface-container-low">
        <div className="h-8 w-60 bg-surface-container-high animate-pulse rounded" />
        <div className="flex gap-2">
          <div className="h-8 w-20 bg-surface-container-high animate-pulse rounded" />
        </div>
      </div>
      <div className="divide-y divide-outline-variant/40 p-2 space-y-2">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center justify-between p-3 gap-4">
            <div className="h-4 w-40 bg-surface-container-high animate-pulse rounded" />
            <div className="h-4 w-20 bg-surface-container-high animate-pulse rounded" />
            <div className="h-4 w-24 bg-surface-container-high animate-pulse rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="border border-outline-variant bg-surface rounded-[0.25rem] p-5 space-y-4">
      <div className="flex justify-between items-center border-b border-outline-variant pb-3">
        <div className="h-5 w-40 bg-surface-container-high animate-pulse rounded" />
        <div className="h-5 w-16 bg-surface-container-high animate-pulse rounded" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="h-10 bg-surface-container-high animate-pulse rounded" />
        <div className="h-10 bg-surface-container-high animate-pulse rounded" />
      </div>
    </div>
  );
}

export function PageSkeleton({ pathname }: { pathname?: string }) {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-7 w-48 bg-surface-container-high animate-pulse rounded" />
          <div className="h-3.5 w-64 bg-surface-container-high animate-pulse rounded" />
        </div>
      </div>
      <StatSkeleton />
      <TableSkeleton rows={6} />
    </div>
  );
}

export function EmptyState({ title, message, action, icon: Icon = Inbox }: { title: string; message?: string; action?: ReactNode; icon?: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-14 text-center">
      <div className="rounded-full bg-surface-container p-3 border border-outline-variant">
        <Icon className="h-5 w-5 text-outline" />
      </div>
      <p className="text-sm font-semibold text-primary font-serif">{title}</p>
      {message ? <p className="max-w-sm text-xs text-on-surface-variant">{message}</p> : null}
      {action ? <div className="mt-3">{action}</div> : null}
    </div>
  );
}

export function LoadingState({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2.5 p-4">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-10 bg-surface-container animate-pulse rounded-[0.25rem] border border-outline-variant/50" />
      ))}
    </div>
  );
}

/* ------------------------------ success celebration modal ------------------------------ */
export function SuccessModal({
  open,
  onClose,
  title = "Success",
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
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-primary/40 p-4 backdrop-blur-[2px] animate-in fade-in duration-200">
      <div className="relative w-full max-w-md overflow-hidden rounded-[0.25rem] border border-outline-variant bg-surface p-6 shadow-2xl">
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#e5eedc] text-[#285430]">
            <span className="material-symbols-outlined text-[24px]">check</span>
          </div>
          <h3 className="font-headline-sm text-xl text-primary">{title}</h3>
          <p className="mt-1 text-xs text-on-surface-variant">{subtitle}</p>
        </div>

        {details && details.length > 0 && (
          <div className="mt-5 rounded-[0.25rem] border border-outline-variant bg-surface-container-low p-3.5 space-y-2 text-xs">
            {details.map((d, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="font-label-caps text-outline">{d.label}</span>
                <span className="font-semibold text-primary text-right font-data-tabular">{d.value}</span>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 flex flex-col gap-2">
          {primaryAction && (
            <Btn
              variant="primary"
              size="md"
              className="w-full"
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
              className="w-full text-xs text-outline"
              onClick={onClose}
            >
              Close
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
    <div className="bg-surface border border-outline-variant rounded-[0.25rem] overflow-hidden">
      {(searchKeys || toolbar) && (
        <div className="flex flex-wrap items-center gap-3 border-b border-outline-variant p-4 bg-surface-container-low">
          {searchKeys ? <SearchInput value={q} onChange={(v) => { setQ(v); setPage(1); }} className="w-full sm:w-72" /> : null}
          <div className="flex flex-1 flex-wrap items-center gap-2">{toolbar}</div>
          <span className="font-label-caps text-label-caps text-outline tabular-nums">{filtered.length} records</span>
        </div>
      )}
      <div className="overflow-x-auto w-full">
        <table className={cn("w-full border-collapse text-left", dense ? "text-xs" : "text-sm")}>
          <thead>
            <tr className="editorial-border-b bg-surface-container-low">
              {columns.map((c) => (
                <th
                  key={c.key}
                  style={c.width ? { width: c.width } : undefined}
                  onClick={() => c.sortable !== false && setSort((s) => (s?.key === c.key ? { key: c.key, dir: s.dir === 1 ? -1 : 1 } : { key: c.key, dir: 1 }))}
                  className={cn(
                    dense ? "px-3.5 py-2.5 text-[10px]" : "px-4 py-3 text-[11px]",
                    "font-label-caps text-on-surface-variant font-normal select-none whitespace-nowrap",
                    c.align === "right" ? "text-right" : c.align === "center" ? "text-center" : "text-left",
                    c.sortable !== false && "cursor-pointer hover:text-primary transition-colors",
                  )}
                >
                  {c.label}
                  {sort?.key === c.key ? <span className="ml-1 text-primary font-bold">{sort.dir === 1 ? "↑" : "↓"}</span> : null}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="font-data-tabular text-data-tabular text-primary divide-y divide-outline-variant/30">
            {slice.map((row, i) => (
              <tr
                key={rowKey ? rowKey(row, i) : ((row as { id?: string }).id ?? i)}
                onClick={() => onRowClick?.(row)}
                className={cn("transition-colors hover:bg-surface-bright editorial-border-b", onRowClick && "cursor-pointer")}
              >
                {columns.map((c) => (
                  <td
                    key={c.key}
                    className={cn(
                      dense ? "px-3.5 py-2.5" : "px-4 py-3.5",
                      c.align === "right" ? "text-right tabular-nums" : c.align === "center" ? "text-center" : "text-left",
                      "whitespace-nowrap",
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
        <div className="flex items-center justify-between gap-2 border-t border-outline-variant px-4 py-3 bg-surface-container-low">
          <span className="font-label-caps text-outline text-xs">Page {current} of {pages}</span>
          <div className="flex gap-1.5">
            <Btn size="sm" variant="outline" onClick={() => setPage(Math.max(1, current - 1))} disabled={current === 1} aria-label="Previous page"><ChevronLeft className="h-4 w-4" /></Btn>
            <Btn size="sm" variant="outline" onClick={() => setPage(Math.min(pages, current + 1))} disabled={current === pages} aria-label="Next page"><ChevronRight className="h-4 w-4" /></Btn>
          </div>
        </div>
      ) : null}
    </div>
  );
}

/* ------------------------------ misc ------------------------------ */
export function KV({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 py-1.5 text-xs font-data-tabular">
      <span className="text-on-surface-variant font-label-caps">{label}</span>
      <span className="text-right font-medium text-primary">{value}</span>
    </div>
  );
}

export function Tip({ label, children }: { label: string; children: ReactNode }) {
  return (
    <span className="group relative inline-flex">
      {children}
      <span className="pointer-events-none absolute -top-8 left-1/2 z-40 -translate-x-1/2 whitespace-nowrap rounded-[0.25rem] bg-primary px-2 py-1 text-[11px] text-on-primary opacity-0 transition-opacity group-hover:opacity-100">
        {label}
      </span>
    </span>
  );
}

export function PrintButton({ label = "Print" }: { label?: string }) {
  return <Btn icon={Printer} onClick={() => window.print()} className="no-print" variant="outline">{label}</Btn>;
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
