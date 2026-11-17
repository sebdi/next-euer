import { NextRequest } from "next/server";
import { getAuthorizedUser } from "@/lib/auth/session";
import { businessSlug, listBusinesses } from "@/lib/businesses";
import { transactionsToCsv } from "@/lib/csv";
import { parseYearParam } from "@/lib/dates";
import { exportRowsForYear } from "@/lib/transactions";

export async function GET(request: NextRequest) {
  const user = await getAuthorizedUser();
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const params = request.nextUrl.searchParams;
  const year = parseYearParam(params.get("year"));
  try {
    const betriebe = await listBusinesses();
    const betrieb = betriebe.find((b) => b.id === params.get("betrieb"));
    if (!betrieb) {
      return new Response("Betrieb nicht gefunden.", { status: 404 });
    }
    const rows = await exportRowsForYear(betrieb.id, year);
    const csv = transactionsToCsv(rows);
    const filename = `nexteuer-${businessSlug(betrieb.name)}-${year}.csv`;
    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return new Response("Export fehlgeschlagen.", { status: 500 });
  }
}
