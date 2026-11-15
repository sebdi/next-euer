import { NextRequest } from "next/server";
import { getAuthorizedUser } from "@/lib/auth/session";
import { transactionsToCsv } from "@/lib/csv";
import { parseYearParam } from "@/lib/dates";
import { exportRowsForYear } from "@/lib/transactions";

export async function GET(request: NextRequest) {
  const user = await getAuthorizedUser();
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const year = parseYearParam(request.nextUrl.searchParams.get("year"));
  try {
    const rows = await exportRowsForYear(year);
    const csv = transactionsToCsv(rows);
    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="nexteuer-${year}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return new Response("Export fehlgeschlagen.", { status: 500 });
  }
}
