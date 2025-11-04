export function toSafeKey(key: string): string {
    return key.replace(/[^a-zA-Z0-9_-]/g, '--');
}
