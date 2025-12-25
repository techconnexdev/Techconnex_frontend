import { NextResponse } from "next/server";

// This route is not currently implemented
// API calls go directly to the backend API
export async function GET() {
  return NextResponse.json(
    { error: "Not implemented. Use backend API directly." },
    { status: 501 }
  );
}

export async function POST() {
  return NextResponse.json(
    { error: "Not implemented. Use backend API directly." },
    { status: 501 }
  );
}

export async function PUT() {
  return NextResponse.json(
    { error: "Not implemented. Use backend API directly." },
    { status: 501 }
  );
}


