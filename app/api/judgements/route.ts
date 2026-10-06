import { NextResponse } from "next/server";
import { computeJudgements } from "@/lib/analysis/judgements";

export async function GET() {
  try {
    const data = await computeJudgements();
    return NextResponse.json(data);
  } catch (error) {
    console.error("[/api/judgements]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
