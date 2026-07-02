export function sanitizeName(name: string, forbiddenChars: RegExp = /[/*?|:]/g): string {
    return name.normalize('NFC').replace(forbiddenChars, '_');
}
