export type IServiceResult<T> = { success: true; data: T } | { success: false; error: string };
