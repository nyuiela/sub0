import { NextResponse } from "next/server";
import { getBackendBase } from "@/lib/api/backendAuth";
import type { PricingResponse } from "@/lib/api/prices";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  
  const outcomeIndex = searchParams.get("outcomeIndex");
  const quantity = searchParams.get("quantity");
  const bParameter = searchParams.get("bParameter");

  // Validate required parameters
  if (!outcomeIndex || !quantity) {
    return NextResponse.json(
      { error: "Missing required parameters: outcomeIndex and quantity" },
      { status: 400 }
    );
  }

  const base = getBackendBase();
  if (!base) {
    return NextResponse.json(
      { error: "Backend not configured" },
      { status: 503 }
    );
  }

  // Build query string for backend
  const backendParams = new URLSearchParams({
    outcomeIndex,
    quantity,
  });
  
  if (bParameter) {
    backendParams.append("bParameter", bParameter);
  }

  const url = `${base}/api/markets/${id}/pricing?${backendParams.toString()}`;
  
  try {
    const res = await fetch(url, { 
      method: "GET",
      credentials: "include" 
    });
    
    const data = await res.json().catch(() => ({}));
    
    if (!res.ok) {
      return NextResponse.json(
        (data as { error?: string }).error ?? "Pricing request failed",
        { status: res.status }
      );
    }
    
    return NextResponse.json(data as PricingResponse);
  } catch (error) {
    console.error("Pricing GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  try {
    const body = await request.json();
    
    const { outcomeIndex, quantity, bParameter } = body;
    
    // Validate required fields
    if (outcomeIndex === undefined || !quantity) {
      return NextResponse.json(
        { error: "Missing required fields: outcomeIndex and quantity" },
        { status: 400 }
      );
    }

    const base = getBackendBase();
    if (!base) {
      return NextResponse.json(
        { error: "Backend not configured" },
        { status: 503 }
      );
    }

    const url = `${base}/api/markets/${id}/pricing`;
    
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        outcomeIndex,
        quantity,
        ...(bParameter && { bParameter }),
      }),
    });
    
    const data = await res.json().catch(() => ({}));
    
    if (!res.ok) {
      return NextResponse.json(
        (data as { error?: string }).error ?? "Pricing request failed",
        { status: res.status }
      );
    }
    
    return NextResponse.json(data as PricingResponse);
  } catch (error) {
    console.error("Pricing POST error:", error);
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}
