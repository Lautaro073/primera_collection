import { NextResponse } from "next/server";
import { HttpError, isErrorWithMessage } from "@/types/shared";

export function createHttpError(statusCode: number, message: string): HttpError {
  return new HttpError(statusCode, message);
}

export function toErrorResponse(
  error: unknown,
  fallbackMessage = "Error interno del servidor",
  fallbackStatus = 500
) {
  const status = error instanceof HttpError ? error.statusCode : fallbackStatus;
  const message = isErrorWithMessage(error) ? error.message : fallbackMessage;

  return NextResponse.json(
    {
      error: message,
      details: status >= 500 && isErrorWithMessage(error) ? error.message : null,
    },
    { status }
  );
}
