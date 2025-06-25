/**
 * Formats a date and time into 'YYYY-MM-DD HH:mm' format.
 * @param date - The date value.
 * @param time - The time value in 'HH:mm' format.
 * @returns The formatted date-time string, or empty string if date or time is null/invalid.
 */
export function formatDateTimeValue(date: Date | null, time: string | null): string {
    if (date == null || time == null || isNaN(date.getTime())) {
        return '';
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day} ${time}`;
}

/**
 * Extracts time string in 'HH:mm' format from a Date object.
 * @param date - The date to extract time from.
 * @returns Time string in 'HH:mm' format.
 */
export function getTimeFromDate(date: Date): string {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
}

/**
 * Combines a date and time string into a single Date object.
 * @param date - The date part.
 * @param time - The time string in 'HH:mm' format.
 * @returns Combined Date object.
 */
export function combineDateAndTime(date: Date, time: string): Date {
    const [hours, minutes] = time.split(':').map(Number);
    const result = new Date(date);
    result.setHours(hours, minutes, 0, 0);
    return result;
}

export type ParsedDateTime = {
    date: Date;
    time: string;
};

/**
 * Parses a date-time string in 'YYYY-MM-DD HH:mm' format.
 * @param input - The input string to parse.
 * @returns Parsed date and time, or null if invalid.
 */
export function parseDateTimeInput(input: string): ParsedDateTime | null {
    const trimmed = input.trim();
    if (!trimmed) {
        return null;
    }

    const match = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2})$/);
    if (!match) {
        return null;
    }

    const [, yearStr, monthStr, dayStr, hoursStr, minutesStr] = match;
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    const day = parseInt(dayStr, 10);
    const hours = parseInt(hoursStr, 10);
    const minutes = parseInt(minutesStr, 10);

    if (month < 1 || month > 12 || day < 1 || day > 31 || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
        return null;
    }

    const date = new Date(year, month - 1, day);
    if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
        return null;
    }

    const time = `${hoursStr}:${minutesStr}`;
    return {date, time};
}
