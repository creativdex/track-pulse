import { AxiosError } from 'axios';

export type IClientResult<T> = { success: true; data: T } | { success: false; error: AxiosError };
