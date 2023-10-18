import {localDateTime} from '/lib/xp/value';

const processDateValue = (value: string): string => {
    if (value) {
        // reducing precision to milliseconds to allow date to be parsed, otherwise InvalidDate is returned
        const newValue = removeDatePrecision(value);
        const dateValue = new Date(Date.parse(newValue));

        return localDateTime(dateValue).toString();
    }

    return '';
}

const removeDatePrecision = (value: string): string => {
    if (value.indexOf('.') > 0) {
        return `${value.substring(0, value.indexOf('.') + 3)}Z`;
    }

    return value;
}

// escaping lines with commas
export default function processNonDateValue(value: string): string {
    if (value && value.indexOf(',') > -1) {
        if (value.indexOf('"') > -1) {
            return `"${value.replaceAll('"', '""')}"`;
        }

        return `"${value}"`;
    }

    return value || '';
}

export const date = processDateValue;
