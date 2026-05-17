import React, { useEffect, useMemo, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Loader2, ChevronLeft, ChevronDown, ChevronRight, Search, Download } from "lucide-react";

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
  return `${sign}€${abs.toFixed(0)}`;
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

  // Only gap rows
  const gapRows = useMemo(
    () => results.filter((r) => r.gap_type && GAP_TYPES.has(r.gap_type)),
    [results]
  );

  const totalDomains = useMemo(() => {
    const s = new Set<string>();
    results.forEach((r) => (r.domains || []).forEach((d) => s.add(d)));
    return s.size;
  }, [results]);

  return (
    <div className="min-h-screen bg-[#f5f6f8]">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Tabs value={subTab} onValueChange={(v) => setSubTab(v as any)}>
              <TabsList className="bg-white border">
                <TabsTrigger
                  value="lines"
                  className="data-[state=active]:bg-white data-[state=active]:text-green-600 data-[state=active]:border data-[state=active]:border-green-500 rounded-md px-5"
                >
                  Recommended Lines
                </TabsTrigger>
                <TabsTrigger value="adoption" className="px-5">
                  Adoption Rate
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <div className="text-sm text-gray-600">
            <span className="font-semibold">{totalDomains.toLocaleString()}</span> domains
          </div>
        </div>

        {isLoading ? (
          <div className="bg-white rounded-lg p-12 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-3" />
            <p className="text-gray-500">Loading recommended data…</p>
          </div>
        ) : subTab === "lines" ? (
          <RecommendedLines rows={gapRows} onRefresh={fetchData} />
        ) : (
          <AdoptionRate allRows={results} gapRows={gapRows} onRefresh={fetchData} />
        )}
      </div>
    </div>
  );
};

/* ---------------- Recommended Lines ---------------- */

const RecommendedLines: React.FC<{ rows: ResultRow[]; onRefresh: () => void }> = ({ rows, onRefresh }) => {
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

  // group by publisher + market
  const publishers = useMemo(() => {
    const map = new Map<string, { publisher: string; market: string; missingLines: number; domains: Set<string>; revenue: number }>();
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
      // count all lines (including duplicates) per row
      entry.missingLines += (r.ads_txt_lines || []).length || 1;
      (r.domains || []).forEach((d) => entry!.domains.add(d));
      entry.revenue += Number(r.revenue_forecast || 0);
    });
    return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue);
  }, [filteredRows]);

  const maxRevenue = publishers[0]?.revenue || 1;

  const quickPicks = publishers.slice(0, 5);

  const exportCsv = () => {
    const rowsOut: any[][] = [["#", "Publisher", "Market Division - Supply", "Missing Lines", "Unique Domains", "Revenue at Risk (€)"]];
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
      <div className="bg-white rounded-lg p-6 border">
        <h2 className="text-xl font-bold mb-1">Recommended Lines</h2>
        <p className="text-sm text-gray-500 mb-4">
          Missing ads.txt lines per publisher — grouped by demand partner and prioritised by weight.
        </p>
        <div className="flex gap-2 mb-3">
          <Input
            placeholder="Search publisher name or domain…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xl"
          />
          <Button className="bg-green-500 hover:bg-green-600 text-white gap-2">
            <Search className="h-4 w-4" /> Analyse
          </Button>
        </div>
        {quickPicks.length > 0 && (
          <div className="text-sm text-gray-600">
            Quick pick:{" "}
            {quickPicks.map((p, i) => (
              <React.Fragment key={p.publisher}>
                {i > 0 && <span className="mx-1 text-gray-400">·</span>}
                <button
                  className="text-blue-600 hover:underline"
                  onClick={() => setSearch(p.publisher)}
                >
                  {p.publisher}
                </button>
              </React.Fragment>
            ))}
          </div>
        )}
      </div>

      <div>
        <label className="block text-xs uppercase text-gray-500 font-semibold mb-2">
          Market Division – Supply
        </label>
        <Select value={division} onValueChange={setDivision}>
          <SelectTrigger className="max-w-xs bg-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All divisions</SelectItem>
            {divisions.map((d) => (
              <SelectItem key={d} value={d}>
                {d}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="bg-white rounded-lg border">
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h3 className="font-bold">Publishers by Revenue at Risk</h3>
            <p className="text-sm text-gray-500">
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
              <tr className="text-xs uppercase text-gray-500 bg-gray-50">
                <th className="py-3 px-4 text-left w-12">#</th>
                <th className="py-3 px-4 text-left">Publisher</th>
                <th className="py-3 px-4 text-left">Market Division - Supply</th>
                <th className="py-3 px-4 text-left">Missing Lines</th>
                <th className="py-3 px-4 text-left">Revenue at Risk</th>
                <th className="py-3 px-4" />
              </tr>
            </thead>
            <tbody>
              {publishers.map((p, i) => (
                <tr key={`${p.publisher}-${p.market}`} className="border-t hover:bg-gray-50">
                  <td className="py-3 px-4 text-gray-500">{i + 1}</td>
                  <td className="py-3 px-4 font-medium">{p.publisher}</td>
                  <td className="py-3 px-4">
                    <span className="inline-block bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded">
                      {p.market}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-red-600 font-medium">{p.missingLines} missing</div>
                    <div className="text-xs text-gray-500">{p.domains.size} domain{p.domains.size !== 1 ? "s" : ""}</div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-red-600 font-medium">{fmtRiskEuro(p.revenue)}</div>
                    <div className="mt-1 h-1 bg-gray-200 rounded-full overflow-hidden w-32">
                      <div
                        className="h-full bg-red-500"
                        style={{ width: `${Math.max(2, (p.revenue / maxRevenue) * 100)}%` }}
                      />
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => setSelected({ publisher: p.publisher, market: p.market })}
                      className="text-blue-600 hover:underline text-sm inline-flex items-center gap-1"
                    >
                      View lines <ChevronRight className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {publishers.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-500">
                    No publishers match the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
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
    const m = new Map<string, { domain: string; items: { row: ResultRow; share: number; line: AdsTxtLine }[]; revenue: number }>();
    rows.forEach((r) => {
      const domains = r.domains || [];
      if (domains.length === 0) return;
      const totalDomainRev = Object.values(r.domain_revenues || {}).reduce((s, v) => s + v, 0);
      domains.forEach((d) => {
        const share =
          r.domain_revenues && r.domain_revenues[d] !== undefined
            ? Number(r.domain_revenues[d])
            : Number(r.revenue_forecast || 0) / domains.length;
        let g = m.get(d);
        if (!g) {
          g = { domain: d, items: [], revenue: 0 };
          m.set(d, g);
        }
        (r.ads_txt_lines || []).forEach((line) => {
          g!.items.push({ row: r, share, line });
        });
        g.revenue += share;
      });
    });
    return Array.from(m.values()).sort((a, b) => b.revenue - a.revenue);
  }, [rows]);

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" onClick={onBack} className="gap-2">
        <ChevronLeft className="h-4 w-4" /> Back to publishers
      </Button>

      <div className="bg-white rounded-lg p-6 border">
        <h2 className="text-xl font-bold">{publisher}</h2>
        <p className="text-sm text-gray-500 mb-4">{market}</p>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-gray-50 rounded p-3">
            <div className="text-xs text-gray-500">Total revenue at risk</div>
            <div className="text-lg font-bold text-red-600">{fmtRiskEuro(totalRevenue)}</div>
          </div>
          <div className="bg-gray-50 rounded p-3">
            <div className="text-xs text-gray-500">Unique missing lines</div>
            <div className="text-lg font-bold">{uniqueLines.size}</div>
          </div>
          <div className="bg-gray-50 rounded p-3">
            <div className="text-xs text-gray-500">Demand partners</div>
            <div className="text-lg font-bold">{partnerGroups.length}</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-bold">Recommended lines</h3>
          <Tabs value={groupBy} onValueChange={(v) => setGroupBy(v as any)}>
            <TabsList>
              <TabsTrigger value="partner">By Partner</TabsTrigger>
              <TabsTrigger value="domain">By Domain</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="divide-y">
          {groupBy === "partner"
            ? partnerGroups.map((g) => {
                const key = `p:${g.partner}`;
                const isCollapsed = collapsed.has(key);
                return (
                  <div key={key}>
                    <button
                      onClick={() => toggle(key)}
                      className="w-full flex items-center justify-between p-4 hover:bg-gray-50 text-left"
                    >
                      <div className="flex items-center gap-2">
                        <ChevronDown
                          className={`h-4 w-4 transition-transform ${isCollapsed ? "-rotate-90" : ""}`}
                        />
                        <span className="font-medium">{g.partner}</span>
                        <span className="text-xs text-gray-500">
                          {g.lines.length} line{g.lines.length !== 1 ? "s" : ""}
                        </span>
                      </div>
                      <div className="text-red-600 font-medium text-sm">{fmtRiskEuro(g.revenue)}</div>
                    </button>
                    {!isCollapsed && (
                      <div className="bg-gray-50 px-4 pb-3">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-xs text-gray-500 uppercase">
                              <th className="text-left py-2">Ads.txt Line</th>
                              <th className="text-left py-2">Type</th>
                              <th className="text-left py-2">Weight</th>
                            </tr>
                          </thead>
                          <tbody>
                            {g.lines.map((l, i) => (
                              <tr key={i} className="border-t border-gray-200">
                                <td className="py-2 font-mono text-xs">{l.ads_txt_line}</td>
                                <td className="py-2">{l.ads_txt_type || "—"}</td>
                                <td className="py-2">{l.weight ?? "—"}</td>
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
                const sorted = [...g.items].sort((a, b) => b.share - a.share);
                const uniq = new Set(sorted.map((x) => x.line.ads_txt_line));
                return (
                  <div key={key}>
                    <button
                      onClick={() => toggle(key)}
                      className="w-full flex items-center justify-between p-4 hover:bg-gray-50 text-left"
                    >
                      <div className="flex items-center gap-2">
                        <ChevronDown
                          className={`h-4 w-4 transition-transform ${isCollapsed ? "-rotate-90" : ""}`}
                        />
                        <span className="font-medium">{g.domain}</span>
                        <span className="text-xs text-gray-500">
                          {uniq.size} unique line{uniq.size !== 1 ? "s" : ""}
                        </span>
                      </div>
                      <div className="text-red-600 font-medium text-sm">{fmtRiskEuro(g.revenue)}</div>
                    </button>
                    {!isCollapsed && (
                      <div className="bg-gray-50 px-4 pb-3">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-xs text-gray-500 uppercase">
                              <th className="text-left py-2">Demand Partner</th>
                              <th className="text-left py-2">Ads.txt Line</th>
                              <th className="text-left py-2">Revenue</th>
                            </tr>
                          </thead>
                          <tbody>
                            {sorted.map((it, i) => (
                              <tr key={i} className="border-t border-gray-200">
                                <td className="py-2">{it.row.demand_partner}</td>
                                <td className="py-2 font-mono text-xs">{it.line.ads_txt_line}</td>
                                <td className="py-2 text-red-600">{fmtRiskEuro(it.share)}</td>
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
      </div>
    </div>
  );
};

/* ---------------- Adoption Rate ---------------- */

const AdoptionRate: React.FC<{ allRows: ResultRow[]; gapRows: ResultRow[]; onRefresh: () => void }> = ({
  allRows,
  gapRows,
}) => {
  const [division, setDivision] = useState<string>("__all__");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const divisions = useMemo(() => {
    const s = new Set<string>();
    allRows.forEach((r) => r.market_division_supply && s.add(r.market_division_supply));
    return Array.from(s).sort();
  }, [allRows]);

  const scopedAll = useMemo(
    () => (division === "__all__" ? allRows : allRows.filter((r) => r.market_division_supply === division)),
    [allRows, division]
  );
  const scopedGap = useMemo(
    () => (division === "__all__" ? gapRows : gapRows.filter((r) => r.market_division_supply === division)),
    [gapRows, division]
  );

  // Total distinct publishers in scope
  const totalCompanies = useMemo(() => {
    const s = new Set<string>();
    scopedAll.forEach((r) => s.add(r.company_name));
    return s.size;
  }, [scopedAll]);

  const partners = useMemo(() => {
    const m = new Map<
      string,
      {
        partner: string;
        missingPublishers: Map<string, number>;
        revenue: number;
      }
    >();
    scopedGap.forEach((r) => {
      const key = r.demand_partner || "—";
      let g = m.get(key);
      if (!g) {
        g = { partner: key, missingPublishers: new Map(), revenue: 0 };
        m.set(key, g);
      }
      const prev = g.missingPublishers.get(r.company_name) || 0;
      g.missingPublishers.set(r.company_name, prev + Number(r.revenue_forecast || 0));
      g.revenue += Number(r.revenue_forecast || 0);
    });
    const arr = Array.from(m.values()).map((g) => {
      const missingCount = g.missingPublishers.size;
      const adoption = totalCompanies > 0 ? ((totalCompanies - missingCount) / totalCompanies) * 100 : 0;
      return { ...g, missingCount, adoption };
    });
    if (search) {
      const q = search.toLowerCase();
      return arr.filter((p) => p.partner.toLowerCase().includes(q));
    }
    return arr.sort((a, b) => b.revenue - a.revenue);
  }, [scopedGap, totalCompanies, search]);

  const exportCsv = () => {
    const out: any[][] = [["Demand Partner", "Adoption %", "Missing Publishers", "Total Publishers", "Revenue at Risk (€)"]];
    partners.forEach((p) =>
      out.push([p.partner, p.adoption.toFixed(1), p.missingCount, totalCompanies, p.revenue.toFixed(2)])
    );
    downloadCsv("adoption-rate.csv", out);
  };

  const toggle = (k: string) =>
    setExpanded((prev) => {
      const n = new Set(prev);
      n.has(k) ? n.delete(k) : n.add(k);
      return n;
    });

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg p-6 border">
        <h2 className="text-xl font-bold mb-1">Adoption Rate</h2>
        <p className="text-sm text-gray-500 mb-4">
          For each demand partner: how many publishers are missing their ads.txt line, and what revenue is at risk.
        </p>
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs uppercase text-gray-500 font-semibold mb-1">
              Market Division – Supply
            </label>
            <Select value={division} onValueChange={setDivision}>
              <SelectTrigger className="w-64 bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All divisions</SelectItem>
                {divisions.map((d) => (
                  <SelectItem key={d} value={d}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Input
            placeholder="Search demand partner…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />
        </div>
      </div>

      <div className="bg-white rounded-lg border">
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h3 className="font-bold">Demand Partners by Adoption</h3>
            <p className="text-sm text-gray-500">
              {totalCompanies.toLocaleString()} publishers in scope · click a row to see missing publishers
            </p>
          </div>
          <Button variant="outline" size="sm" className="gap-2" onClick={exportCsv}>
            <Download className="h-4 w-4" /> CSV
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs uppercase text-gray-500 bg-gray-50">
                <th className="py-3 px-4 text-left">Demand Partner</th>
                <th className="py-3 px-4 text-left">Adoption %</th>
                <th className="py-3 px-4 text-left">Missing Publishers</th>
                <th className="py-3 px-4 text-left">Revenue at Risk</th>
                <th className="py-3 px-4" />
              </tr>
            </thead>
            <tbody>
              {partners.map((p) => {
                const isOpen = expanded.has(p.partner);
                const list = Array.from(p.missingPublishers.entries()).sort((a, b) => b[1] - a[1]);
                return (
                  <React.Fragment key={p.partner}>
                    <tr className="border-t hover:bg-gray-50 cursor-pointer" onClick={() => toggle(p.partner)}>
                      <td className="py-3 px-4 font-medium">{p.partner}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{fmtPct(p.adoption)}</span>
                          <div className="h-1.5 w-24 bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full bg-green-500" style={{ width: `${p.adoption}%` }} />
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-red-600 font-medium">{p.missingCount}</span>
                        <span className="text-gray-400"> / {totalCompanies}</span>
                      </td>
                      <td className="py-3 px-4 text-red-600 font-medium">{fmtRiskEuro(p.revenue)}</td>
                      <td className="py-3 px-4 text-right">
                        <ChevronDown
                          className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? "" : "-rotate-90"}`}
                        />
                      </td>
                    </tr>
                    {isOpen && (
                      <tr className="bg-gray-50">
                        <td colSpan={5} className="px-4 pb-4 pt-2">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="text-xs text-gray-500 uppercase">
                                <th className="text-left py-2">Publisher</th>
                                <th className="text-left py-2">Revenue at Risk</th>
                              </tr>
                            </thead>
                            <tbody>
                              {list.map(([pub, rev]) => (
                                <tr key={pub} className="border-t border-gray-200">
                                  <td className="py-2">{pub}</td>
                                  <td className="py-2 text-red-600">{fmtRiskEuro(rev)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
              {partners.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-500">
                    No demand partners match the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Recommended;
