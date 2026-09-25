import {
  BookOpen,
  Check,
  ChevronRight,
  FileText,
  Folder,
  LayoutGrid,
  Package,
  PanelLeft,
  PlayCircle,
  Tag,
  Wallet,
} from "lucide-react";

// Illustrative Creator Studio — a picture of the product, not live data.
const SIDEBAR = [
  { icon: BookOpen, label: "Excel for Accountants", active: true },
  { icon: BookOpen, label: "Loksewa GK Prep" },
  { icon: BookOpen, label: "Photoshop Basics" },
  { icon: BookOpen, label: "Spoken English" },
  { icon: BookOpen, label: "Guitar in 30 Days" },
];

const SIDEBAR_TOOLS = [
  { icon: Package, label: "Products" },
  { icon: Tag, label: "Discounts" },
  { icon: LayoutGrid, label: "Sales" },
  { icon: Wallet, label: "Payouts" },
];

const LESSONS = [
  { title: "Welcome & course files", kind: "Video", preview: true },
  { title: "Formatting a ledger", kind: "Video" },
  { title: "VAT formulas that don't break", kind: "Video", active: true },
  { title: "Practice workbook", kind: "PDF" },
  { title: "Pivot tables for month-end", kind: "Video" },
  { title: "Bank reconciliation", kind: "Video" },
  { title: "Final assignment", kind: "PDF" },
];

const SALES = [
  { via: "eSewa", amount: "1,499", when: "2m ago", color: "bg-[#60BB46]" },
  { via: "Khalti", amount: "1,499", when: "18m ago", color: "bg-[#5C2D91]" },
  { via: "Fonepay", amount: "2,499", when: "1h ago", color: "bg-[#C8102E]" },
  { via: "eSewa", amount: "1,499", when: "3h ago", color: "bg-[#60BB46]" },
];

const BARS = [38, 52, 44, 70, 58, 86, 74];

export function StudioWindow() {
  return (
    <div className="window relative z-10 text-left" aria-hidden="true">
      <div className="grid md:grid-cols-[220px_1fr] lg:grid-cols-[220px_1fr_300px]">
        {/* Sidebar */}
        <aside className="hidden border-r bg-surface md:block">
          <div className="flex h-12 items-center justify-between px-4">
            <div className="flex gap-1.5">
              <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
              <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
              <span className="h-3 w-3 rounded-full bg-[#28c840]" />
            </div>
            <PanelLeft className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="px-2 pb-4">
            <p className="flex items-center gap-1 px-2 py-2 text-xs font-medium text-muted-foreground">
              <ChevronRight className="h-3 w-3 rotate-90" /> Courses
            </p>
            {SIDEBAR.map(({ icon: Icon, label, active }) => (
              <div
                key={label}
                className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] ${
                  active ? "bg-accent font-medium text-foreground" : "text-foreground/75"
                }`}
              >
                <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <span className="truncate">{label}</span>
              </div>
            ))}
            <p className="flex items-center gap-1 px-2 pb-2 pt-4 text-xs font-medium text-muted-foreground">
              <ChevronRight className="h-3 w-3 rotate-90" /> Studio
            </p>
            {SIDEBAR_TOOLS.map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] text-foreground/75"
              >
                <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                {label}
              </div>
            ))}
          </div>
        </aside>

        {/* Lessons */}
        <section className="min-w-0 border-r-0 lg:border-r">
          <div className="flex h-12 items-center gap-3 border-b px-4">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg border">
              <Folder className="h-3.5 w-3.5 text-muted-foreground" />
            </span>
            <div className="min-w-0 leading-tight">
              <p className="truncate text-[13px] font-semibold">Excel for Accountants</p>
              <p className="text-[11px] text-muted-foreground">Published · NPR 1,499</p>
            </div>
          </div>
          <div className="flex items-center justify-between px-4 pb-1 pt-3 text-xs">
            <span className="font-medium">
              Lessons <span className="ml-1 text-muted-foreground">7</span>
            </span>
            <span className="rounded-full bg-success/10 px-2 py-0.5 text-[11px] font-medium text-success">
              Live
            </span>
          </div>
          <ul className="px-2 pb-3">
            {LESSONS.map(({ title, kind, preview, active }) => (
              <li
                key={title}
                className={`flex items-center gap-3 rounded-lg px-2.5 py-2 text-[13px] ${
                  active ? "bg-accent" : ""
                }`}
              >
                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded bg-primary text-primary-foreground">
                  <Check className="h-3 w-3" strokeWidth={3} />
                </span>
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded text-[10px] font-bold text-white ${
                    kind === "PDF" ? "bg-emerald-500" : "bg-primary"
                  }`}
                >
                  {kind === "PDF" ? <FileText className="h-3 w-3" /> : <PlayCircle className="h-3 w-3" />}
                </span>
                <span className="min-w-0 flex-1 truncate">{title}</span>
                {preview && (
                  <span className="hidden rounded-full border px-2 py-0.5 text-[10px] text-muted-foreground sm:inline">
                    Free preview
                  </span>
                )}
              </li>
            ))}
          </ul>
        </section>

        {/* Sales */}
        <section className="hidden bg-background lg:block">
          <div className="flex h-12 items-center justify-between border-b px-4">
            <p className="text-[13px] font-semibold">This week</p>
            <span className="text-[11px] text-muted-foreground">Sales</span>
          </div>
          <div className="px-4 pt-4">
            <p className="text-[11px] text-muted-foreground">Earnings</p>
            <p className="text-2xl font-semibold tracking-tight">NPR 18,740</p>
            <div className="mt-4 flex h-20 items-end gap-2">
              {BARS.map((h, i) => (
                <div
                  key={i}
                  className={`flex-1 rounded-t ${i === BARS.length - 2 ? "bg-primary" : "bg-primary/20"}`}
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
          </div>
          <ul className="mt-4 border-t px-2 py-2">
            {SALES.map(({ via, amount, when, color }, i) => (
              <li key={i} className="flex items-center gap-3 rounded-lg px-2 py-2 text-[13px]">
                <span className={`h-2 w-2 shrink-0 rounded-full ${color}`} />
                <span className="flex-1 text-foreground/80">{via}</span>
                <span className="font-mono text-[12px]">+{amount}</span>
                <span className="w-12 text-right text-[11px] text-muted-foreground">{when}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
