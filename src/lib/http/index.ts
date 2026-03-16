// HTTP module exports - unified and deduplicated
export { ApiResponse } from "@/lib/http/response";
export { HttpError, UnauthorizedError, ForbiddenError, handleApiError } from "@/lib/http/errors";
export { ApiError, fetchApi } from "@/lib/http/client";

