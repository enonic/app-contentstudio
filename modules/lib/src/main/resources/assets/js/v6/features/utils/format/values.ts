export function parseBoolean(value: unknown): boolean {
    if (typeof value === 'boolean') {
        return value;
    }

    if (typeof value === 'string') {
        return value.toLowerCase() === 'true';
    }

    return false;
}

export function parseNumber(value: unknown): number | undefined {
    if (typeof value === 'number' && !Number.isNaN(value)) {
        return value;
    }

    if (typeof value === 'string') {
        const trimmed = value.trim();
        if (!trimmed) {
            return undefined;
        }

        const parsed = Number(trimmed);
        return Number.isNaN(parsed) ? undefined : parsed;
    }

    return undefined;
}

export function parseString(value: unknown): string {
    if (typeof value === 'string') {
        return value;
    }

    if (value == null) {
        return '';
    }

    return String(value);
}


