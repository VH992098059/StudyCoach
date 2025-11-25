export const API_CONFIG={
    BASE_URL:import.meta.env.VITE_API_BASE_URL || "http://localhost:8000",
    TIMEOUT:60000, // 增加到60秒，适应后端检索操作的耗时
    RETRY_COUNT:3,
    RETRY_DELAY:1000,
}as const;
export const HTTP_STATUS={
    OK: 200,
    CREATED: 201,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    INTERNAL_SERVER_ERROR: 500,
}as const;