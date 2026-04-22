import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import SignIn from "@/components/SignIn";
import { fetchPublicSheetData, parseSheetId } from "@/utils/googleApi";
import { transformSheetData } from "@/utils/sheetTransform";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";

const SHEET_URL =
  "https://docs.google.com/spreadsheets/d/1pjKlo75xCAsTSvCxI-Ex9N4g7WjwVgCQ/edit?gid=827049234#gid=827049234";
const SHEET_TAB = "Sheet1"; // gviz fetches the first sheet by default if name unknown

const formatEuro = (value: number) => {
  if (Math.abs(value) >= 1000) {
    return `-€${(Math.abs(value) / 1000).toFixed(1)}K`;
  }
  return `-€${Math.abs(value).toFixed(0)}`;
};

const parseDomains = (raw: string): string[] => {
  if (!raw) return [];
  // Try JSON-ish python list: ['a', 'b']
  try {
    const normalized = raw.replace(/'/g, '"');
    const arr = JSON.parse(normalized);
    if (Array.isArray(arr)) return arr.map(String);
  } catch {}
  // Fallback: split by comma
  return raw
    .replace(/[\[\]']/g, "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
};

const parseNumber = (raw: any): number => {
  if (raw === null || raw === undefined || raw === "") return 0;
  const n = Number(String(raw).replace(/[^0-9.\-]/g, ""));
  return isNaN(n) ? 0 : n;
};

interface Row {
  Publisher: string;
  Market: string;
  "Demand Partner": string;
  "Market Division": string;
  ads_txt_type: string;
  ads_txt_line: string;
  weight: string;
  imps_bid_ops_pct: string;
  advertiser_cpm: string;
  revenue_forecast: string;
  domains_count: string;
  domains: string;
  gap_type: string;
  [k: string]: string;
}

const Recommendations: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [rawData, setRawData] = useState<Row[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selected, setSelected] = useState<{ publisher: string; market: string } | null>(null);
  const [search, setSearch] = useState("");

  const loadData = async () => {
    try {
      setIsLoading(true);
      setRawData([]);
      const sheetId = parseSheetId(SHEET_URL);
      if (!sheetId) {
        toast({ title: "Error", description: "Invalid sheet URL", variant: "destructive" });
        return;
      }
      const values = await fetchPublicSheetData(sheetId, SHEET_TAB);
      if (values && values.length > 0) {
        const transformed = transformSheetData(values) as Row[];
        setRawData(transformed);
      }
    } catch (e) {
      console.error(e);
      toast({ title: "Error", description: "Failed to load sheet data", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const loadedForUserRef = React.useRef<string | null>(null);
  useEffect(() => {
    if (user && loadedForUserRef.current !== user.id) {
      loadedForUserRef.current = user.id;
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Aggregate by Publisher + Market
  const aggregated = useMemo(() => {
    const map = new Map<
      string,
      {
        publisher: string;
        market: string;
        missingLines: number;
        domainsCount: number;
        revenueRisk: number;
        _lines: Set<string>;
      }
    >();
    rawData.forEach((r) => {
      const publisher = r.Publisher || "";
      const market = r.Market || "";
      if (!publisher && !market) return;
      const key = `${publisher}|||${market}`;
      const lineVal = (r.ads_txt_line || "").trim();
      const revenue = parseNumber(r.revenue_forecast);
      const domains = parseDomains(r.domains).length;
      const existing = map.get(key);
      if (existing) {
        if (lineVal) existing._lines.add(lineVal);
        existing.revenueRisk += revenue;
        existing.domainsCount = Math.max(existing.domainsCount, domains);
      } else {
        const _lines = new Set<string>();
        if (lineVal) _lines.add(lineVal);
        map.set(key, {
          publisher,
          market,
          missingLines: 0,
          domainsCount: domains,
          revenueRisk: revenue,
          _lines,
        });
      }
    });
    const result = Array.from(map.values())
      .map((v) => ({ ...v, missingLines: v._lines.size }))
      .sort((a, b) => b.revenueRisk - a.revenueRisk);
    if (rawData.length > 0) {
      console.log("[Recommendations] sample row keys:", Object.keys(rawData[0]));
      console.log("[Recommendations] sample row:", rawData[0]);
      console.log("[Recommendations] first agg:", result[0]);
    }
    return result;
  }, [rawData]);

  const filteredAggregated = useMemo(() => {
    if (!search) return aggregated;
    const q = search.toLowerCase();
    return aggregated.filter(
      (r) => r.publisher.toLowerCase().includes(q) || r.market.toLowerCase().includes(q)
    );
  }, [aggregated, search]);

  const maxRisk = useMemo(
    () => filteredAggregated.reduce((m, r) => Math.max(m, r.revenueRisk), 0),
    [filteredAggregated]
  );

  // Detail view data
  const detail = useMemo(() => {
    if (!selected) return null;
    const rows = rawData.filter(
      (r) => r.Publisher === selected.publisher && r.Market === selected.market
    );
    const missingLines = new Set(
      rows.map((r) => (r.ads_txt_line || "").trim()).filter((v) => v.length > 0)
    ).size;
    const revenueRisk = rows.reduce((sum, r) => sum + parseNumber(r.revenue_forecast), 0);
    const domainsCount = rows.reduce((m, r) => Math.max(m, parseDomains(r.domains).length), 0);
    const partners = new Set(rows.map((r) => r["Demand Partner"]).filter(Boolean));

    // group by Demand Partner
    const byPartner = new Map<string, Row[]>();
    rows.forEach((r) => {
      const k = r["Demand Partner"] || "—";
      if (!byPartner.has(k)) byPartner.set(k, []);
      byPartner.get(k)!.push(r);
    });
    const groups = Array.from(byPartner.entries())
      .map(([partner, items]) => ({
        partner,
        items,
        revenue: items.reduce((s, x) => s + parseNumber(x.revenue_forecast), 0),
        linesCount: new Set(
          items.map((x) => (x.ads_txt_line || "").trim()).filter((v) => v.length > 0)
        ).size,
      }))
      .sort((a, b) => b.revenue - a.revenue);

    return {
      rows,
      missingLines,
      revenueRisk,
      domainsCount,
      partnersCount: partners.size,
      groups,
    };
  }, [selected, rawData]);

  if (!user) {
    return (
      <div className="flex flex-col min-h-screen bg-[#0f1429]">
        <div className="container mx-auto px-4 py-6 flex-grow flex items-center justify-center">
          <SignIn />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#0f1429]">
      <div className="container mx-auto px-4 py-6 flex-grow">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white">Recommendation Lines</h1>
            <p className="text-white/60 text-sm mt-1">
              Missing ads.txt lines per publisher and market with revenue at risk
            </p>
          </div>
          <Button onClick={loadData} disabled={isLoading} variant="secondary" className="gap-2">
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {!selected ? (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-4 border-b">
              <Input
                placeholder="Search publisher or market..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="max-w-sm"
              />
            </div>

            <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <div className="col-span-1">#</div>
              <div className="col-span-4">Publisher</div>
              <div className="col-span-2">Market</div>
              <div className="col-span-2">Missing Lines</div>
              <div className="col-span-2">Revenue at Risk</div>
              <div className="col-span-1"></div>
            </div>

            {isLoading ? (
              <div className="p-12 text-center text-gray-500">Loading...</div>
            ) : filteredAggregated.length === 0 ? (
              <div className="p-12 text-center text-gray-500">No data available</div>
            ) : (
              filteredAggregated.map((row, idx) => {
                const pct = maxRisk > 0 ? (row.revenueRisk / maxRisk) * 100 : 0;
                return (
                  <div
                    key={`${row.publisher}-${row.market}`}
                    className="grid grid-cols-12 gap-4 px-6 py-4 items-center border-b hover:bg-gray-50 transition-colors"
                  >
                    <div className="col-span-1 text-gray-400 text-sm">{idx + 1}</div>
                    <div className="col-span-4">
                      <div className="font-semibold text-gray-900">{row.publisher}</div>
                      <div className="text-xs text-gray-500">{row.market}</div>
                    </div>
                    <div className="col-span-2">
                      <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-50">
                        {row.market}
                      </Badge>
                    </div>
                    <div className="col-span-2">
                      <div className="text-red-600 font-medium">{row.missingLines} missing</div>
                      <div className="text-xs text-gray-500">{row.domainsCount} domains</div>
                    </div>
                    <div className="col-span-2">
                      <div className="text-red-600 font-bold">{formatEuro(row.revenueRisk)}</div>
                      <div className="w-full h-1 bg-gray-100 rounded mt-1">
                        <div
                          className="h-1 bg-red-500 rounded"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                    <div className="col-span-1 text-right">
                      <button
                        onClick={() =>
                          setSelected({ publisher: row.publisher, market: row.market })
                        }
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium inline-flex items-center gap-1"
                      >
                        View lines
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        ) : (
          detail && (
            <div className="space-y-4">
              <button
                onClick={() => setSelected(null)}
                className="text-white/80 hover:text-white text-sm inline-flex items-center gap-1"
              >
                <ChevronLeft className="h-4 w-4" />
                Back to list
              </button>

              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2 bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-2xl font-bold text-gray-900">{selected.publisher}</h2>
                  <p className="text-gray-500">{selected.market}</p>
                  <div className="grid grid-cols-3 gap-6 mt-6">
                    <div>
                      <div className="text-3xl font-bold text-gray-900">{detail.domainsCount}</div>
                      <div className="text-xs text-gray-500 uppercase">Domains</div>
                    </div>
                    <div>
                      <div className="text-3xl font-bold text-red-600">{detail.missingLines}</div>
                      <div className="text-xs text-gray-500 uppercase">Lines missing</div>
                    </div>
                    <div>
                      <div className="text-3xl font-bold text-green-600">
                        {formatEuro(detail.revenueRisk).replace("-", "")}
                      </div>
                      <div className="text-xs text-gray-500 uppercase">Revenue risk</div>
                    </div>
                  </div>
                </div>
                <div className="bg-red-50 border border-red-100 rounded-lg p-6">
                  <div className="text-xs text-red-700 uppercase font-semibold">Revenue at Risk</div>
                  <div className="text-3xl font-bold text-red-600 mt-2">
                    {formatEuro(detail.revenueRisk)}
                  </div>
                  <div className="text-xs text-red-700/70 mt-2">
                    {detail.partnersCount} partners · {detail.missingLines} unique lines · per month
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="px-6 py-4 border-b flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">
                    Recommended Lines by Demand Partner
                  </h3>
                  <Badge variant="secondary">
                    {detail.missingLines} lines · {detail.partnersCount} partners
                  </Badge>
                </div>

                {detail.groups.map((g) => (
                  <div key={g.partner} className="border-b last:border-b-0">
                    <div className="px-6 py-3 bg-gray-50 flex items-center justify-between">
                      <div className="font-semibold text-gray-900">
                        {g.partner}{" "}
                        <span className="text-gray-400 font-normal text-sm">
                          {g.linesCount} {g.linesCount === 1 ? "line" : "lines"}
                        </span>
                      </div>
                      <div className="text-red-600 font-bold">{formatEuro(g.revenue)}</div>
                    </div>
                    <div className="grid grid-cols-12 gap-4 px-6 py-2 text-xs font-semibold text-gray-500 uppercase">
                      <div className="col-span-2">Type</div>
                      <div className="col-span-7">Ads.txt Line</div>
                      <div className="col-span-3 text-right">Revenue</div>
                    </div>
                    {g.items.map((item, i) => (
                      <div
                        key={i}
                        className="grid grid-cols-12 gap-4 px-6 py-3 items-center text-sm border-t"
                      >
                        <div className="col-span-2">
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            {item.ads_txt_type}
                          </Badge>
                        </div>
                        <div className="col-span-7 font-mono text-xs text-gray-700 break-all">
                          {item.ads_txt_line}
                        </div>
                        <div className="col-span-3 text-right text-red-600 font-medium">
                          {formatEuro(parseNumber(item.revenue_forecast))}
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default Recommendations;
