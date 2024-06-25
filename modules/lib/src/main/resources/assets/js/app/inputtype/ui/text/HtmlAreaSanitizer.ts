export class HtmlAreaSanitizer {

    public sanitize(value: string): string {
        if (!value) {
            return value;
        }

        return this.cleanTableFromUnwantedChars(this.replaceNonBreakingSpacesWithUnicode(value));
    }

    private replaceNonBreakingSpacesWithUnicode(value: string): string {
        return value.replace(/(&nbsp;)+/g, '\u00A0');
    }

    private cleanTableFromUnwantedChars(value): string {
        return value
            .replace(/table border="1" cellpadding="1" cellspacing="1" style="width:100%"/g, 'table') // initial table attrs
            .replace(/<table[^>]*?>[\s\S]*?<\/table>/g, (match: string) => {
                return match.replace(/\n/g, '').replace(/\t/g, '');
            });
    }
}
