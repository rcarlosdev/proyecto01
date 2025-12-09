import { NextResponse } from "next/server";
import { db } from "@/db";
import { payments } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get("userId");
    const referenceId = url.searchParams.get("referenceId");
    let q = db.select().from(payments) as any;

    if (userId) q = q.where(eq(payments.userId, userId));
    if (referenceId) q = q.where(eq(payments.referenceId, referenceId));

    q = q.orderBy(desc(payments.createdAt));

    const rows = await q.limit(200);
    return NextResponse.json(rows);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Error listando pagos" }, { status: 500 });
  }
}
