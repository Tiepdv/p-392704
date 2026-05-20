import React, { useEffect, useMemo, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SearchableSelect } from "@/components/SearchableSelect";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Loader2,
  ChevronLeft,
  ChevronDown,
  ChevronRight,
  Search,
  Download,
  TrendingUp,
  AlertTriangle,
  Globe,
} from "lucide-react";

const API_URL = "https://europe-west3-showheroes-bi.cloudfunctions.net/test_json";

interface AdsTxtLine {
  ads_txt_line: string;
  ads_txt_type?: string | null;
  weight?: number | null;
}

interface ResultRow {
  company_name: string;
  country?: string;
  demand_partner: string;
  market_division?: string;
  market_division_supply: string;
  ads_txt_type?: string | null;
  weight?: number | null;
  imps_bid_ops_pct?: number | null;
  advertiser_cpm?: number | null;
  revenue_forecast?: number | null;
  domains_count?: number | null;
  domains?: string[];
  ads_txt_lines?: AdsTxtLine[];
  gap_type?: string;
  domain_revenues?: Record<string, number>;
}

interface ApiResponse {
  job_id?: string;
  job?: {
    status?: string;
    progress?: number;
    total?: number;
    completed?: number;
    results?: ResultRow[];
  };
  results?: ResultRow[];
}

const GAP_TYPES = new Set(["not_found", "ads_txt_missing"]);

const fmtEuro = (v: number) => {
  const abs = Math.abs(v);
  const sign = v < 0 ? "-" : "";
  if (abs >= 1000) return `${sign}€${(abs / 1000).toFixed(1)}K`;
  return `${sign}€${abs.toFixed(2)}`;
};

const fmtRiskEuro = (v: number) => `-${fmtEuro(v).replace(/^-/, "")}`;
const fmtPct = (v: number) => `${v.toFixed(1)}%`;

const csvEscape = (val: any) => {
  const s = String(val ?? "");
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
};

const downloadCsv = (filename: string, rows: any[][]) => {
  const csv = rows.map((r) => r.map(csvEscape).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

/* ---------------- Root ---------------- */

const Recommended: React.FC = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<ResultRow[]>([]);
  const [subTab, setSubTab] = useState<"lines" | "adoption">("lines");

  useEffect(() => {
    void fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setResults([]);
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: ApiResponse = await res.json();
      const rows = data.job?.results || data.results || [];
      setResults(rows);
    } catch (e: any) {
      console.error(e);
      toast({ title: "Error", description: "Failed to load Recommended data.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const gapRows = useMemo(
    () => results.filter((r) => r.gap_type && GAP_TYPES.has(r.gap_type)),
    [results]
  );

  const totalDomains = useMemo(() => {
    const s = new Set<string>();
    results.forEach((r) => (r.domains || []).forEach((d) => s.add(d)));
    return s.size;
  }, [results]);

  const totalRevenueRisk = useMemo(
    () => gapRows.reduce((s, r) => s + Number(r.revenue_forecast || 0), 0),
    [gapRows]
  );

  const totalPartners = useMemo(() => {
    const s = new Set<string>();
    gapRows.forEach((r) => r.demand_partner && s.add(r.demand_partner));
    return s.size;
  }, [gapRows]);

  return (
    <div className="min-h-screen bg-[#0f1429]">
      <div className="container mx-auto px-4 py-6">
        {/* Sub-tabs + inline stats on the same row */}
        <div className="mb-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <Tabs value={subTab} onValueChange={(v) => setSubTab(v as any)}>
            <TabsList className="bg-white/5 border border-white/10 backdrop-blur p-1 h-auto rounded-xl">
              <TabsTrigger
                value="lines"
                className="px-5 py-2 text-slate-300 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg"
              >
                Recommended Lines
              </TabsTrigger>
              <TabsTrigger
                value="adoption"
                className="px-5 py-2 text-slate-300 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg"
              >
                Adoption Rate
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="grid grid-cols-3 gap-3">
            <HeroStat icon={<Globe className="h-4 w-4" />} label="Domains" value={totalDomains.toLocaleString()} />
            <HeroStat icon={<TrendingUp className="h-4 w-4" />} label="Partners" value={totalPartners.toLocaleString()} />
            <HeroStat
              icon={<AlertTriangle className="h-4 w-4" />}
              label="Revenue at risk"
              value={fmtRiskEuro(totalRevenueRisk)}
              tone="danger"
            />
          </div>
        </div>

        {isLoading ? (
          <Panel>
            <div className="p-16 text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-3" />
              <p className="text-slate-500">Loading recommended data…</p>
            </div>
          </Panel>
        ) : subTab === "lines" ? (
          <RecommendedLines rows={gapRows} onRefresh={fetchData} />
        ) : (
          <AdoptionRate allRows={results} gapRows={gapRows} onRefresh={fetchData} />
        )}
      </div>
    </div>
  );
};

const HeroStat: React.FC<{ icon: React.ReactNode; label: string; value: string; tone?: "danger" | "default" }> = ({
  icon,
  label,
  value,
  tone,
}) => (
  <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur px-4 py-3 min-w-[120px]">
    <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-slate-400">
      {icon}
      {label}
    </div>
    <div className={`text-lg md:text-xl font-bold mt-1 ${tone === "danger" ? "text-rose-400" : "text-white"}`}>
      {value}
    </div>
  </div>
);

const Panel: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = "" }) => (
  <div className={`rounded-lg border border-slate-200 bg-white shadow-md ${className}`}>
    {children}
  </div>
);

/* ---------------- Recommended Lines ---------------- */

const RecommendedLines: React.FC<{ rows: ResultRow[]; onRefresh: () => void }> = ({ rows }) => {
  const [search, setSearch] = useState("");
  const [division, setDivision] = useState<string>("__all__");
  const [selected, setSelected] = useState<{ publisher: string; market: string } | null>(null);

  const divisions = useMemo(() => {
    const s = new Set<string>();
    rows.forEach((r) => r.market_division_supply && s.add(r.market_division_supply));
    return Array.from(s).sort();
  }, [rows]);

  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      if (division !== "__all__" && r.market_division_supply !== division) return false;
      if (search) {
        const q = search.toLowerCase();
        const inName = r.company_name?.toLowerCase().includes(q);
        const inDomain = (r.domains || []).some((d) => d.toLowerCase().includes(q));
        if (!inName && !inDomain) return false;
      }
      return true;
    });
  }, [rows, division, search]);

  const publishers = useMemo(() => {
    const map = new Map<
      string,
      { publisher: string; market: string; missingLines: number; domains: Set<string>; revenue: number }
    >();
    filteredRows.forEach((r) => {
      const key = `${r.company_name}__${r.market_division_supply}`;
      let entry = map.get(key);
      if (!entry) {
        entry = {
          publisher: r.company_name,
          market: r.market_division_supply,
          missingLines: 0,
          domains: new Set<string>(),
          revenue: 0,
        };
        map.set(key, entry);
      }
      entry.missingLines += (r.ads_txt_lines || []).length || 1;
      (r.domains || []).forEach((d) => entry!.domains.add(d));
      entry.revenue += Number(r.revenue_forecast || 0);
    });
    return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue);
  }, [filteredRows]);

  const maxRevenue = publishers[0]?.revenue || 1;
  const quickPicks = publishers.slice(0, 5);

  const exportCsv = () => {
    const rowsOut: any[][] = [
      ["#", "Publisher", "Market Division - Supply", "Missing Lines", "Unique Domains", "Revenue at Risk (€)"],
    ];
    publishers.forEach((p, i) =>
      rowsOut.push([i + 1, p.publisher, p.market, p.missingLines, p.domains.size, p.revenue.toFixed(2)])
    );
    downloadCsv("recommended-lines.csv", rowsOut);
  };

  if (selected) {
    const detailRows = filteredRows.filter(
      (r) => r.company_name === selected.publisher && r.market_division_supply === selected.market
    );
    return (
      <DetailView
        publisher={selected.publisher}
        market={selected.market}
        rows={detailRows}
        onBack={() => setSelected(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <Panel className="p-6">
        <h2 className="text-xl font-bold text-slate-900 mb-1">Recommended Lines</h2>
        <p className="text-sm text-slate-500 mb-5">
          Missing ads.txt lines per publisher — grouped by demand partner and prioritised by weight.
        </p>
        <div className="flex flex-col md:flex-row gap-3 mb-4">
          <div className="relative flex-1 max-w-xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search publisher name or domain…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="md:w-64">
            <SearchableSelect
              value={division}
              onChange={setDivision}
              searchPlaceholder="Search division…"
              options={[
                { value: "__all__", label: "All divisions" },
                ...divisions.map((d) => ({ value: d, label: d })),
              ]}
            />
          </div>
        </div>
        {quickPicks.length > 0 && (
          <div className="text-sm text-slate-500 flex flex-wrap items-center gap-2">
            <span className="text-xs uppercase tracking-wider text-slate-400">Quick pick:</span>
            {quickPicks.map((p) => (
              <button
                key={p.publisher}
                className="px-2.5 py-1 text-xs rounded-full bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 transition-colors"
                onClick={() => setSearch(p.publisher)}
              >
                {p.publisher}
              </button>
            ))}
          </div>
        )}
      </Panel>

      <Panel>
        <div className="flex items-center justify-between p-5 border-b border-slate-200">
          <div>
            <h3 className="font-bold text-slate-900">Publishers by Revenue at Risk</h3>
            <p className="text-sm text-slate-500">
              Click a publisher to see their recommended lines grouped by demand partner
            </p>
          </div>
          <Button variant="outline" size="sm" className="gap-2" onClick={exportCsv}>
            <Download className="h-4 w-4" /> CSV
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[11px] uppercase tracking-wider text-slate-500 bg-slate-50">
                <th className="py-3 px-4 text-left w-12">#</th>
                <th className="py-3 px-4 text-left">Publisher</th>
                <th className="py-3 px-4 text-left">Market Division – Supply</th>
                <th className="py-3 px-4 text-left">Missing Lines</th>
                <th className="py-3 px-4 text-left">Revenue at Risk</th>
                <th className="py-3 px-4" />
              </tr>
            </thead>
            <tbody>
              {publishers.map((p, i) => (
                <tr
                  key={`${p.publisher}-${p.market}`}
                  className="border-t border-slate-200 hover:bg-slate-50 transition-colors"
                >
                  <td className="py-3 px-4 text-slate-400">{i + 1}</td>
                  <td className="py-3 px-4 font-medium text-slate-900">{p.publisher}</td>
                  <td className="py-3 px-4">
                    <span className="inline-block bg-blue-50 text-blue-700 border border-blue-200 text-xs px-2 py-1 rounded-md">

                      {p.market}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-rose-600 font-semibold">{p.missingLines} missing</div>
                    <div className="text-xs text-slate-500">
                      {p.domains.size} domain{p.domains.size !== 1 ? "s" : ""}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-rose-600 font-semibold">{fmtRiskEuro(p.revenue)}</div>
                    <div className="mt-1 h-1.5 bg-slate-100 rounded-full overflow-hidden w-32">
                      <div
                        className="h-full bg-gradient-to-r from-rose-500 to-rose-400"
                        style={{ width: `${Math.max(2, (p.revenue / maxRevenue) * 100)}%` }}
                      />
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => setSelected({ publisher: p.publisher, market: p.market })}
                      className="text-blue-700 hover:text-blue-800 text-sm inline-flex items-center gap-1 font-medium"
                    >
                      View lines <ChevronRight className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {publishers.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-400">
                    No publishers match the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
};

/* ---------------- Detail View ---------------- */

const DetailView: React.FC<{
  publisher: string;
  market: string;
  rows: ResultRow[];
  onBack: () => void;
}> = ({ publisher, market, rows, onBack }) => {
  const [groupBy, setGroupBy] = useState<"partner" | "domain">("partner");
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const toggle = (k: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      next.has(k) ? next.delete(k) : next.add(k);
      return next;
    });

  const totalRevenue = rows.reduce((s, r) => s + Number(r.revenue_forecast || 0), 0);
  const uniqueLines = new Set<string>();
  rows.forEach((r) => (r.ads_txt_lines || []).forEach((l) => uniqueLines.add(l.ads_txt_line)));

  const partnerGroups = useMemo(() => {
    const m = new Map<string, { partner: string; rows: ResultRow[]; revenue: number; lines: AdsTxtLine[] }>();
    rows.forEach((r) => {
      const key = r.demand_partner || "—";
      let g = m.get(key);
      if (!g) {
        g = { partner: key, rows: [], revenue: 0, lines: [] };
        m.set(key, g);
      }
      g.rows.push(r);
      g.revenue += Number(r.revenue_forecast || 0);
      (r.ads_txt_lines || []).forEach((l) => g!.lines.push(l));
    });
    return Array.from(m.values()).sort((a, b) => b.revenue - a.revenue);
  }, [rows]);

  const domainGroups = useMemo(() => {
    const m = new Map<
      string,
      { domain: string; items: { row: ResultRow; revenue: number; line: AdsTxtLine }[]; revenue: number }
    >();
    rows.forEach((r) => {
      const domains = r.domains || [];
      if (domains.length === 0) return;
      const lines = r.ads_txt_lines || [];
      const n = lines.length || 1;
      const rowRev = Number(r.revenue_forecast || 0);
      const perLine = rowRev / n;
      domains.forEach((d) => {
        let g = m.get(d);
        if (!g) {
          g = { domain: d, items: [], revenue: 0 };
          m.set(d, g);
        }
        lines.forEach((line) => {
          g!.items.push({ row: r, revenue: perLine, line });
          g!.revenue += perLine;
        });
      });
    });
    return Array.from(m.values()).sort((a, b) => b.revenue - a.revenue);
  }, [rows]);

  return (
    <div className="space-y-4">
      <Button
        variant="ghost"
        size="sm"
        onClick={onBack}
        className="gap-2 text-slate-200 hover:text-white hover:bg-white/10"
      >
        <ChevronLeft className="h-4 w-4" /> Back to publishers
      </Button>

      <Panel className="p-6">
        <h2 className="text-2xl font-bold text-slate-900">{publisher}</h2>
        <p className="text-sm text-slate-500 mb-5">{market}</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <StatCard label="Total revenue at risk" value={fmtRiskEuro(totalRevenue)} tone="danger" />
          <StatCard label="Unique missing lines" value={String(uniqueLines.size)} />
          <StatCard label="Demand partners" value={String(partnerGroups.length)} />
        </div>
      </Panel>

      <Panel>
        <div className="flex items-center justify-between p-5 border-b border-slate-200">
          <h3 className="font-bold text-slate-900">Recommended lines</h3>
          <Tabs value={groupBy} onValueChange={(v) => setGroupBy(v as any)}>
            <TabsList>
              <TabsTrigger value="partner" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">By Partner</TabsTrigger>
              <TabsTrigger value="domain" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">By Domain</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="divide-y divide-slate-200">
          {groupBy === "partner"
            ? partnerGroups.map((g) => {
                const key = `p:${g.partner}`;
                const isCollapsed = collapsed.has(key);
                return (
                  <div key={key}>
                    <button
                      onClick={() => toggle(key)}
                      className="w-full flex items-center justify-between p-4 hover:bg-slate-50 text-left transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <ChevronDown
                          className={`h-4 w-4 text-slate-400 transition-transform ${isCollapsed ? "-rotate-90" : ""}`}
                        />
                        <span className="font-medium text-slate-900">{g.partner}</span>
                        <span className="text-xs text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
                          {g.lines.length} line{g.lines.length !== 1 ? "s" : ""}
                        </span>
                      </div>
                      <div className="text-rose-600 font-semibold text-sm">{fmtRiskEuro(g.revenue)}</div>
                    </button>
                    {!isCollapsed && (
                      <div className="bg-slate-50 px-4 pb-3">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-[11px] text-slate-500 uppercase tracking-wider">
                              <th className="text-left py-2">Ads.txt Line</th>
                              <th className="text-left py-2">Type</th>
                              <th className="text-left py-2">Weight</th>
                            </tr>
                          </thead>
                          <tbody>
                            {g.lines.map((l, i) => (
                              <tr key={i} className="border-t border-slate-200">
                                <td className="py-2 font-mono text-xs text-emerald-700">{l.ads_txt_line}</td>
                                <td className="py-2 text-slate-700">{l.ads_txt_type || "—"}</td>
                                <td className="py-2 text-slate-700">{l.weight ?? "—"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })
            : domainGroups.map((g) => {
                const key = `d:${g.domain}`;
                const isCollapsed = collapsed.has(key);
                const sorted = [...g.items].sort((a, b) => b.revenue - a.revenue);
                const uniq = new Set(sorted.map((x) => x.line.ads_txt_line));
                return (
                  <div key={key}>
                    <button
                      onClick={() => toggle(key)}
                      className="w-full flex items-center justify-between p-4 hover:bg-slate-50 text-left transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <ChevronDown
                          className={`h-4 w-4 text-slate-400 transition-transform ${isCollapsed ? "-rotate-90" : ""}`}
                        />
                        <span className="font-medium text-slate-900">{g.domain}</span>
                        <span className="text-xs text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
                          {uniq.size} unique line{uniq.size !== 1 ? "s" : ""}
                        </span>
                      </div>
                      <div className="text-rose-600 font-semibold text-sm">{fmtRiskEuro(g.revenue)}</div>
                    </button>
                    {!isCollapsed && (
                      <div className="bg-slate-50 px-4 pb-3">
                        {(() => {
                          const byPartner = new Map<string, { partner: string; items: typeof sorted; revenue: number }>();
                          sorted.forEach((it) => {
                            const k = it.row.demand_partner || "—";
                            let pg = byPartner.get(k);
                            if (!pg) {
                              pg = { partner: k, items: [], revenue: 0 };
                              byPartner.set(k, pg);
                            }
                            pg.items.push(it);
                            pg.revenue += it.revenue;
                          });
                          const partnerList = Array.from(byPartner.values()).sort((a, b) => b.revenue - a.revenue);
                          return (
                            <div className="divide-y divide-slate-200 border border-slate-200 rounded-md bg-white">
                              {partnerList.map((pg) => {
                                const pkey = `${key}::${pg.partner}`;
                                const pOpen = collapsed.has(pkey);
                                return (
                                  <div key={pkey}>
                                    <button
                                      onClick={() => toggle(pkey)}
                                      className="w-full flex items-center justify-between px-3 py-2 hover:bg-slate-50 text-left"
                                    >
                                      <div className="flex items-center gap-2">
                                        <ChevronDown
                                          className={`h-4 w-4 text-slate-400 transition-transform ${pOpen ? "" : "-rotate-90"}`}
                                        />
                                        <span className="font-medium text-slate-800 text-sm">{pg.partner}</span>
                                        <span className="text-[11px] text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
                                          {pg.items.length} line{pg.items.length !== 1 ? "s" : ""}
                                        </span>
                                      </div>
                                      <div className="text-rose-600 font-semibold text-xs">{fmtRiskEuro(pg.revenue)}</div>
                                    </button>
                                    {pOpen && (
                                      <table className="w-full text-sm">
                                        <thead>
                                          <tr className="text-[11px] text-slate-500 uppercase tracking-wider bg-slate-50">
                                            <th className="text-left py-2 pl-9">Ads.txt Line</th>
                                            <th className="text-right py-2 pr-3">Revenue</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {pg.items.map((it, i) => (
                                            <tr key={i} className="border-t border-slate-200">
                                              <td className="py-2 pl-9 font-mono text-xs text-slate-800">{it.line.ads_txt_line}</td>
                                              <td className="py-2 pr-3 text-right text-rose-600">{fmtRiskEuro(it.revenue)}</td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                );
              })}
        </div>
      </Panel>
    </div>
  );
};

const StatCard: React.FC<{ label: string; value: string; tone?: "danger" | "default" }> = ({
  label,
  value,
  tone,
}) => (
  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
    <div className="text-xs uppercase tracking-wider text-slate-500">{label}</div>
    <div className={`text-xl font-bold mt-1 ${tone === "danger" ? "text-rose-600" : "text-slate-900"}`}>{value}</div>
  </div>
);

/* ---------------- Adoption Rate ---------------- */

const AdoptionRate: React.FC<{ allRows: ResultRow[]; gapRows: ResultRow[]; onRefresh: () => void }> = ({
  allRows,
  gapRows,
}) => {
  const [division, setDivision] = useState<string>("__all__");
  const [partnerFilter, setPartnerFilter] = useState<string>("__all__");
  const [expandedDiv, setExpandedDiv] = useState<Set<string>>(new Set());
  const [expandedPub, setExpandedPub] = useState<Set<string>>(new Set());

  const divisions = useMemo(() => {
    const s = new Set<string>();
    allRows.forEach((r) => r.market_division_supply && s.add(r.market_division_supply));
    return Array.from(s).sort();
  }, [allRows]);

  const partners = useMemo(() => {
    const s = new Set<string>();
    allRows.forEach((r) => r.demand_partner && s.add(r.demand_partner));
    return Array.from(s).sort();
  }, [allRows]);

  const scopedAll = useMemo(() => {
    return allRows.filter((r) => {
      if (partnerFilter !== "__all__" && r.demand_partner !== partnerFilter) return false;
      return true;
    });
  }, [allRows, partnerFilter]);

  const scopedGap = useMemo(() => {
    return gapRows.filter((r) => {
      if (partnerFilter !== "__all__" && r.demand_partner !== partnerFilter) return false;
      return true;
    });
  }, [gapRows, partnerFilter]);

  const divisionStats = useMemo(() => {
    const allMap = new Map<string, Set<string>>();
    scopedAll.forEach((r) => {
      const d = r.market_division_supply;
      if (!d) return;
      if (division !== "__all__" && d !== division) return;
      if (!allMap.has(d)) allMap.set(d, new Set());
      allMap.get(d)!.add(r.company_name);
    });

    const gapMap = new Map<
      string,
      Map<string, { publisher: string; market: string; revenue: number; domains: Map<string, number> }>
    >();
    scopedGap.forEach((r) => {
      const d = r.market_division_supply;
      if (!d) return;
      if (division !== "__all__" && d !== division) return;
      if (!gapMap.has(d)) gapMap.set(d, new Map());
      const pubMap = gapMap.get(d)!;
      let p = pubMap.get(r.company_name);
      if (!p) {
        p = { publisher: r.company_name, market: d, revenue: 0, domains: new Map() };
        pubMap.set(r.company_name, p);
      }
      p.revenue += Number(r.revenue_forecast || 0);
      const domains = r.domains || [];
      domains.forEach((dom) => {
        const share =
          r.domain_revenues && r.domain_revenues[dom] !== undefined
            ? Number(r.domain_revenues[dom])
            : Number(r.revenue_forecast || 0) / Math.max(domains.length, 1);
        p!.domains.set(dom, (p!.domains.get(dom) || 0) + share);
      });
    });

    const list = Array.from(allMap.entries()).map(([div, pubs]) => {
      const missingPubs = gapMap.get(div) || new Map();
      const total = pubs.size;
      const missing = missingPubs.size;
      const adopted = total - missing;
      const adoption = total > 0 ? (adopted / total) * 100 : 0;
      const revenue = Array.from(missingPubs.values()).reduce((s, p) => s + p.revenue, 0);
      const publishers = Array.from(missingPubs.values()).sort((a, b) => b.revenue - a.revenue);
      return { division: div, total, missing, adopted, adoption, revenue, publishers };
    });

    return list.filter((d) => d.missing >= 1).sort((a, b) => b.revenue - a.revenue);
  }, [scopedAll, scopedGap, division]);

  const exportCsv = () => {
    const out: any[][] = [
      ["Market Division", "Adoption %", "Adopted", "Missing", "Total Publishers", "Revenue at Risk (€)"],
    ];
    divisionStats.forEach((d) =>
      out.push([d.division, d.adoption.toFixed(1), d.adopted, d.missing, d.total, d.revenue.toFixed(2)])
    );
    downloadCsv("adoption-rate.csv", out);
  };

  const toggleDiv = (k: string) =>
    setExpandedDiv((prev) => {
      const n = new Set(prev);
      n.has(k) ? n.delete(k) : n.add(k);
      return n;
    });
  const togglePub = (k: string) =>
    setExpandedPub((prev) => {
      const n = new Set(prev);
      n.has(k) ? n.delete(k) : n.add(k);
      return n;
    });

  const adoptionColor = (pct: number) => {
    if (pct >= 80) return { text: "text-emerald-600", bar: "from-emerald-500 to-emerald-400" };
    if (pct >= 50) return { text: "text-amber-600", bar: "from-amber-500 to-amber-400" };
    return { text: "text-rose-600", bar: "from-rose-500 to-rose-400" };
  };

  return (
    <div className="space-y-6">
      <Panel className="p-6">
        <h2 className="text-xl font-bold text-slate-900 mb-1">Adoption Rate Analysis</h2>
        <p className="text-sm text-slate-500 mb-5">
          Select a demand partner to see which publishers haven't added their ads.txt lines. Only publishers without
          active revenue for that partner are shown.
        </p>
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-[11px] uppercase tracking-wider text-slate-500 font-semibold mb-1.5">
              Demand Partner
            </label>
            <SearchableSelect
              value={partnerFilter}
              onChange={setPartnerFilter}
              triggerClassName="w-64"
              searchPlaceholder="Search partner…"
              options={[
                { value: "__all__", label: "All partners" },
                ...partners.map((p) => ({ value: p, label: p })),
              ]}
            />
          </div>
          <div>
            <label className="block text-[11px] uppercase tracking-wider text-slate-500 font-semibold mb-1.5">
              Market Division – Supply
            </label>
            <SearchableSelect
              value={division}
              onChange={setDivision}
              triggerClassName="w-64"
              searchPlaceholder="Search division…"
              options={[
                { value: "__all__", label: "All divisions" },
                ...divisions.map((d) => ({ value: d, label: d })),
              ]}
            />
          </div>
          <Button variant="outline" size="sm" className="gap-2" onClick={exportCsv}>
            <Download className="h-4 w-4" /> CSV
          </Button>
        </div>
      </Panel>

      <div className="space-y-3">
        {divisionStats.map((d) => {
          const open = expandedDiv.has(d.division);
          const col = adoptionColor(d.adoption);
          return (
            <Panel key={d.division}>
              <button
                onClick={() => toggleDiv(d.division)}
                className="w-full text-left p-5 flex items-center gap-4 hover:bg-slate-50 transition-colors"
              >
                <ChevronDown
                  className={`h-5 w-5 text-slate-400 transition-transform ${open ? "" : "-rotate-90"}`}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center flex-wrap gap-x-3 gap-y-1">
                    <span className="font-bold text-slate-900">{d.division}</span>
                    <span className={`text-sm font-semibold ${col.text}`}>{fmtPct(d.adoption)} adopted</span>
                    <span className="text-sm text-slate-500">
                      {d.adopted} of {d.total} publishers
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-3">
                    <div className="h-2 w-32 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full bg-gradient-to-r ${col.bar} transition-all`}
                        style={{ width: `${d.adoption}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-500">{d.missing} not adopted</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-rose-600 font-bold text-lg">{fmtRiskEuro(d.revenue)}</div>
                  <div className="text-[11px] uppercase tracking-wider text-slate-400">revenue at risk</div>
                </div>
              </button>

              {open && d.publishers.length > 0 && (
                <div className="border-t border-slate-200 bg-slate-50">
                  <div className="grid grid-cols-12 px-5 py-2.5 text-[11px] uppercase tracking-wider text-slate-500">
                    <div className="col-span-5">Publisher</div>
                    <div className="col-span-3">Market Supply Division</div>
                    <div className="col-span-2 text-right">Revenue at Risk</div>
                    <div className="col-span-2 text-right">Domains</div>
                  </div>
                  {d.publishers.map((p) => {
                    const pkey = `${d.division}::${p.publisher}`;
                    const pOpen = expandedPub.has(pkey);
                    const domList = Array.from(p.domains.entries()).sort((a, b) => b[1] - a[1]);
                    return (
                      <div key={pkey} className="border-t border-slate-200">
                        <button
                          onClick={() => togglePub(pkey)}
                          className="w-full grid grid-cols-12 px-5 py-3 items-center hover:bg-white transition-colors text-left"
                        >
                          <div className="col-span-5 flex items-center gap-2 text-slate-900">
                            <ChevronRight
                              className={`h-4 w-4 text-slate-400 transition-transform ${pOpen ? "rotate-90" : ""}`}
                            />
                            <span className="font-medium">{p.publisher}</span>
                          </div>
                          <div className="col-span-3">
                            <span className="inline-block bg-slate-100 text-slate-800 border border-slate-300 text-xs px-2 py-1 rounded-md">
                              {p.market}
                            </span>
                          </div>
                          <div className="col-span-2 text-right text-rose-600 font-semibold">
                            {fmtRiskEuro(p.revenue)}
                          </div>
                          <div className="col-span-2 text-right text-slate-500 text-sm">
                            {domList.length} domain{domList.length !== 1 ? "s" : ""}
                          </div>
                        </button>
                        {pOpen && (
                          <div className="px-5 pb-4 pl-12 bg-white">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="text-[11px] text-slate-500 uppercase tracking-wider">
                                  <th className="text-left py-2">Domain</th>
                                  <th className="text-right py-2">Revenue at Risk</th>
                                </tr>
                              </thead>
                              <tbody>
                                {domList.map(([dom, rev]) => (
                                  <tr key={dom} className="border-t border-slate-200">
                                    <td className="py-2 text-slate-700">{dom}</td>
                                    <td className="py-2 text-right text-rose-600">{fmtRiskEuro(rev)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </Panel>
          );
        })}

        {divisionStats.length === 0 && (
          <Panel>
            <div className="py-10 text-center text-slate-400">No data matches the current filters.</div>
          </Panel>
        )}
      </div>
    </div>
  );
};

export default Recommended;
