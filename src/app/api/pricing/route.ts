/**
 * GET /api/pricing — peak/off-peak rate card grouped by day type and hour.
 *
 * Query params:
 * - `day`  (optional) "weekday" | "weekend" — omit to receive both groups
 * - `hour` (optional) integer 6–21 — filter a single hour
 *
 * Source: `pricing_rules` via the schedule service (falls back to the built-in
 * rate card when the table has not been seeded). Responses: 200
 * { groups: [{ dayType, rows, summary }] } · 400 invalid params.
 */
import { NextResponse } from "next/server";
import { discountPercent } from "@/lib/format";
import { getRateCard } from "@/lib/schedule-service";
import { apiRoute } from "@/lib/api";

export const runtime = "nodejs";

const DAY_TYPES = ["weekday", "weekend"] as const;
type DayType = (typeof DAY_TYPES)[number];

const FIRST_HOUR = 6;
const LAST_HOUR = 21;

export const GET = apiRoute(async (request: Request) => {
  const { searchParams } = new URL(request.url);

  const dayParam = searchParams.get("day");
  if (dayParam != null && !(DAY_TYPES as readonly string[]).includes(dayParam)) {
    return NextResponse.json(
      {
        error: {
          code: "INVALID_DAY",
          message: `Query param \`day\` must be one of: ${DAY_TYPES.join(", ")}.`,
        },
      },
      { status: 400 }
    );
  }

  const hourParam = searchParams.get("hour");
  let hour: number | undefined;
  if (hourParam != null) {
    hour = Number(hourParam);
    if (!Number.isInteger(hour) || hour < FIRST_HOUR || hour > LAST_HOUR) {
      return NextResponse.json(
        {
          error: {
            code: "INVALID_HOUR",
            message: `Query param \`hour\` must be an integer between ${FIRST_HOUR} and ${LAST_HOUR}.`,
          },
        },
        { status: 400 }
      );
    }
  }

  const dayTypes: DayType[] = dayParam
    ? [dayParam as DayType]
    : [...DAY_TYPES];

  const groups = await Promise.all(
    dayTypes.map(async (dayType) => {
      const card = await getRateCard(dayType);
      const rows = card
        .filter((row) => hour == null || row.hour === hour)
        .map((row) => ({
          hour: row.hour,
          price: row.price,
          strike: row.strike,
          discountPercent: discountPercent(row.price, row.strike),
          peak: row.peak,
        }));

      return {
        dayType,
        rows,
        summary: {
          minPrice: rows.length
            ? Math.min(...rows.map((row) => row.price))
            : null,
          maxPrice: rows.length
            ? Math.max(...rows.map((row) => row.price))
            : null,
          peakHours: rows.filter((row) => row.peak).map((row) => row.hour),
        },
      };
    })
  );

  return NextResponse.json(
    { groups },
    {
      headers: {
        "Cache-Control": "public, max-age=300, stale-while-revalidate=600",
      },
    }
  );
});
