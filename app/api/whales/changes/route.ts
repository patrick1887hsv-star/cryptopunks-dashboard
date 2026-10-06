import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";

export async function GET() {
  try {
    const events = await prisma.whaleEvent.findMany({
      orderBy: { eventAt: "desc" },
      include: {
        whale: {
          select: { address: true, ensName: true, punkCount: true, trend: true },
        },
      },
    });

    return NextResponse.json({ events });
  } catch {
    return NextResponse.json({ events: [] }, { status: 500 });
  }
}
