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
    default: "bg-card border border-border text-foreground hover:bg-secondary",
    outline: "bg-transparent border border-border text-foreground hover:bg-secondary",
    primary: "bg-primary text-primary-foreground hover:opacity-90 border border-transparent",
    ghost: "bg-transparent text-muted-foreground hover:bg-secondary hover:text-foreground border border-transparent",
    danger: "bg-danger text-primary-foreground hover:opacity-90 border border-transparent",
    success: "bg-success text-primary-foreground hover:opacity-90 border border-transparent",
  };
  const sizes: Record<string, string> = {
    sm: "h-8 px-2.5 text-xs gap-1.5",
    md: "h-9 px-3 text-sm gap-2",
    lg: "h-11 px-5 text-sm gap-2",
  };
  return (
    <button
      {...props}
      className={cn(
        "inline-flex items-center justify-center rounded-md font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
        variants[variant], sizes[size], className,
      )}
    >
      {Icon ? <Icon className="h-4 w-4" /> : null}
      {children}
    </button>
  );
}

export const TONES: Record<string, string> = {
  success: "bg-success-soft text-success border-success/25",
  danger: "bg-danger-soft text-danger border-danger/25",
  warning: "bg-warning-soft text-warning border-warning/30",
  info: "bg-info-soft text-info border-info/25",
  primary: "bg-primary-soft text-accent-foreground border-primary/30",
  muted: "bg-secondary text-muted-foreground border-border",
};

export function Badge({ tone = "muted", children, className }: { tone?: string; children: ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium whitespace-nowrap", TONES[tone] ?? TONES["muted"], className)}>
      {children}
    </span>
  );
}

export function Dot({ tone = "muted" }: { tone?: string }) {
  const map: Record<string, string> = {
    success: "bg-success", danger: "bg-danger", warning: "bg-warning",
    info: "bg-info", primary: "bg-primary", muted: "bg-muted-foreground",
  };
  return <span className={cn("inline-block h-2 w-2 rounded-full", map[tone] ?? map["muted"])} />;
}

export function Card({ children, className, title, action, dense }: { children: ReactNode; className?: string; title?: ReactNode; action?: ReactNode; dense?: boolean }) {
  return (
    <section className={cn("card-surface", className)}>
      {title ? (
        <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
          <h3 className="text-sm font-semibold">{title}</h3>
          {action}
        </header>
      ) : null}
      <div className={dense ? "" : "p-4"}>{children}</div>
    </section>
  );
}

export function PageHeader({ title, subtitle, actions, children }: { title: string; subtitle?: string; actions?: ReactNode; children?: ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
        {subtitle ? <p className="mt-0.5 text-[13px] text-muted-foreground">{subtitle}</p> : null}
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
        "card-surface p-4 text-left transition-all",
        onClick && "hover:border-primary/40 hover:shadow-[var(--shadow-pop)] cursor-pointer",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-[12px] font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
        {Icon ? <Icon className="h-4 w-4 text-muted-foreground" /> : null}
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-2xl font-semibold tabular-nums">{value}</span>
        {typeof trend === "number" ? (
          <span className={cn("text-xs font-medium", trend >= 0 ? "text-success" : "text-danger")}>
            {trend >= 0 ? "▲" : "▼"} {Math.abs(trend).toFixed(1)}%
          </span>
        ) : null}
      </div>
      {sub ? <div className="mt-1 text-xs text-muted-foreground">{sub}</div> : null}
      {tone !== "muted" ? <div className={cn("mt-3 h-1 rounded-full", TONES[tone]?.split(" ")[0])} /> : null}
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
  "h-9 w-full rounded-md border border-border bg-card px-2.5 text-sm outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-primary focus:ring-2 focus:ring-ring/25";

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(fieldCls, props.className)} />;
}
export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cn(fieldCls, "h-auto min-h-[72px] py-2", props.className)} />;
}
export function Select({ options, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { options: { value: string; label: string }[] }) {
  return (
    <div className="relative">
      <select {...props} className={cn(fieldCls, "appearance-none pr-8", props.className)}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2 top-2.5 h-4 w-4 text-muted-foreground" />
    </div>
  );
}

export function SearchInput({ value, onChange, placeholder = "Search…", className }: { value: string; onChange: (v: string) => void; placeholder?: string; className?: string }) {
  return (
    <div className={cn("relative", className)}>
      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
      <input
        aria-label={placeholder} value={value} placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={cn(fieldCls, "pl-8")}
      />
    </div>
  );
}

export function Tabs({ tabs, value, onChange, className }: { tabs: { value: string; label: string; count?: number }[]; value: string; onChange: (v: string) => void; className?: string }) {
  return (
    <div className={cn("flex flex-wrap gap-1 border-b border-border", className)}>
      {tabs.map((t) => (
        <button
          key={t.value} onClick={() => onChange(t.value)}
          className={cn(
            "-mb-px border-b-2 px-3 py-2 text-sm font-medium transition-colors",
            value === t.value ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground",
          )}
        >
          {t.label}
          {typeof t.count === "number" ? <span className="ml-1.5 rounded-full bg-secondary px-1.5 py-0.5 text-[11px] tabular-nums">{t.count}</span> : null}
        </button>
      ))}
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
    <div className="space-y-2 p-4">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-9 animate-pulse rounded-md bg-secondary" />
      ))}
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

export function DataTable<T extends { id?: string }>({
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
    <div className="card-surface overflow-hidden">
      {(searchKeys || toolbar) && (
        <div className="flex flex-wrap items-center gap-2 border-b border-border p-3">
          {searchKeys ? <SearchInput value={q} onChange={(v) => { setQ(v); setPage(1); }} className="w-full sm:w-64" /> : null}
          <div className="flex flex-1 flex-wrap items-center gap-2">{toolbar}</div>
          <span className="text-xs text-muted-foreground tabular-nums">{filtered.length} record(s)</span>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/60">
              {columns.map((c) => (
                <th
                  key={c.key}
                  style={c.width ? { width: c.width } : undefined}
                  onClick={() => c.sortable !== false && setSort((s) => (s?.key === c.key ? { key: c.key, dir: s.dir === 1 ? -1 : 1 } : { key: c.key, dir: 1 }))}
                  className={cn(
                    "px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground select-none",
                    c.align === "right" ? "text-right" : c.align === "center" ? "text-center" : "text-left",
                    c.sortable !== false && "cursor-pointer hover:text-foreground",
                  )}
                >
                  {c.label}
                  {sort?.key === c.key ? <span className="ml-1">{sort.dir === 1 ? "↑" : "↓"}</span> : null}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {slice.map((row, i) => (
              <tr
                key={rowKey ? rowKey(row, i) : (row.id ?? i)}
                onClick={() => onRowClick?.(row)}
                className={cn("border-b border-border/70 last:border-0 transition-colors hover:bg-secondary/50", onRowClick && "cursor-pointer")}
              >
                {columns.map((c) => (
                  <td
                    key={c.key}
                    className={cn(
                      dense ? "px-3 py-1.5" : "px-3 py-2.5",
                      c.align === "right" ? "text-right tabular-nums" : c.align === "center" ? "text-center" : "text-left",
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
        <div className="flex items-center justify-between gap-2 border-t border-border px-3 py-2">
          <span className="text-xs text-muted-foreground">Page {current} of {pages}</span>
          <div className="flex gap-1">
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
