import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, History } from "lucide-react";
import { format } from "date-fns";

interface SlittingRow {
  id: string;
  date: string;
  source_quantity: number;
  cut_quantity_produced: number;
  cut_width_mm: number;
  remaining_returned: number;
  thickness_mm: number | null;
  gsm: number | null;
  unit: string;
  notes: string | null;
  product_codes: { code: string } | null;
}

const parseGsm = (notes: string | null): number => {
  if (!notes) return 0;
  const m = notes.match(/GSM\s*[:\-]*\s*([\d.]+)/i);
  return m ? parseFloat(m[1]) : 0;
};

const computeTotals = (r: SlittingRow) => {
  // cut_quantity_produced stores total length in mtr (rollLength × rolls) when length provided
  const lengthMtr = r.cut_quantity_produced || 0;
  const sqm = (r.cut_width_mm / 1000) * lengthMtr;
  const gsm = r.gsm ?? parseGsm(r.notes);
  const kg = gsm > 0 ? (sqm * gsm) / 1000 : 0;
  return { lengthMtr, sqm, kg };
};

export default function SlittingHistory() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<SlittingRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const fullSelect = "id, date, source_quantity, cut_quantity_produced, cut_width_mm, remaining_returned, thickness_mm, gsm, unit, notes, product_codes(code)";
      const basicSelect = "id, date, source_quantity, cut_quantity_produced, cut_width_mm, remaining_returned, thickness_mm, unit, notes, product_codes(code)";

      let { data, error } = await supabase
        .from("slitting_entries")
        .select(fullSelect)
        .eq("slitting_manager_id", user.id)
        .order("date", { ascending: false });

      if (error) {
        const fallback = await supabase
          .from("slitting_entries")
          .select(basicSelect)
          .eq("slitting_manager_id", user.id)
          .order("date", { ascending: false });
        data = fallback.data as any;
        error = fallback.error;
      }

      if (error) {
        setEntries([]);
        setLoading(false);
        return;
      }

      setEntries((data as unknown as SlittingRow[]) ?? []);
      setLoading(false);
    };
    fetch();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          My Slitting History
        </CardTitle>
      </CardHeader>
      <CardContent>
        {entries.length === 0 ? (
          <p className="text-muted-foreground text-center py-6">No slitting entries yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Cut Width</TableHead>
                  <TableHead className="text-right">Length (mtr)</TableHead>
                  <TableHead className="text-right">Area (sqm)</TableHead>
                  <TableHead className="text-right">Weight (kg)</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((e) => {
                  const t = computeTotals(e);
                  return (
                    <TableRow key={e.id}>
                      <TableCell>{format(new Date(e.date), "dd/MM/yy")}</TableCell>
                      <TableCell className="font-medium">{e.product_codes?.code ?? "—"}</TableCell>
                      <TableCell>{e.cut_width_mm} mm</TableCell>
                      <TableCell className="text-right font-mono">{t.lengthMtr.toLocaleString(undefined, { maximumFractionDigits: 2 })}</TableCell>
                      <TableCell className="text-right font-mono">{t.sqm.toLocaleString(undefined, { maximumFractionDigits: 2 })}</TableCell>
                      <TableCell className="text-right font-mono">{t.kg > 0 ? t.kg.toLocaleString(undefined, { maximumFractionDigits: 2 }) : "—"}</TableCell>
                      <TableCell className="text-muted-foreground text-xs">{e.notes ?? "—"}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
