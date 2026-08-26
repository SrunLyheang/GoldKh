import { NextResponse } from "next/server";

export type ApiResponse<T> =
  | { data: T }
  | { error: { code: string; message: string } };

export function apiOk<T>(data: T, status?: number) {
  return NextResponse.json<ApiResponse<T>>({ data }, { status: status ?? 200 });
}

export function apiError(code: string, message: string, status: number) {
  return NextResponse.json<ApiResponse<never>>(
    { error: { code, message } },
    { status }
  );
}
