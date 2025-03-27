import { NextRequest, NextResponse } from "next/server";
import { getContractTotalEffort } from "@/services/contractEffortService";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const contractId = searchParams.get("contractId");

  if (!contractId || isNaN(Number(contractId))) {
    return NextResponse.json(
      { error: "Contract ID is required and must be a number" },
      { status: 400 }
    );
  }

  try {
    const result = await getContractTotalEffort(Number(contractId));

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error calculating contract effort:", error);
    return NextResponse.json(
      { error: "Failed to calculate contract effort" },
      { status: 500 }
    );
  }
}
