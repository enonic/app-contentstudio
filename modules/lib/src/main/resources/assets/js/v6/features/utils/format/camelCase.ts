import {capitalize} from "./capitalize";

export function camelCase(str: string): string {
    const words = str
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
        .split(/[\s\-_]+/)
        .filter(Boolean);

    return words
        .map((word, i) => {
            const lower = word.toLowerCase();
            return i === 0 ? lower : capitalize(lower);
        })
        .join('');
}
