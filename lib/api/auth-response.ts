import { NextResponse } from "next/server";

export function unauthorizedResponse() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export function notFoundResponse(message = "Not found") {
  return NextResponse.json({ error: message }, { status: 404 });
}

export function handleAuthError(err: unknown) {
  if (err instanceof Error && err.message === "UNAUTHORIZED") {
    return unauthorizedResponse();
  }
  if (err instanceof Error && err.message === "CAMPAIGN_NOT_FOUND") {
    return notFoundResponse("Campaign not found");
  }
  return null;
}
