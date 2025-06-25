export const formatError = (error: unknown) => (error instanceof Error ? error : new Error(String(error)));
