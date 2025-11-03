export function normalize(text: string): string {
    return text
        .toLowerCase()
        .replace(/[\s\-]+/g, '_') // Replace spaces and hyphens with underscores
        .replace(/_+/g, '_') // Collapse multiple underscores
        .replace(/^_+|_+$/g, ''); // Trim leading/trailing underscores
}
