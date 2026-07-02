export function isBlank(value: string | null | undefined): boolean {
    return value == null || value.trim().length === 0;
}
