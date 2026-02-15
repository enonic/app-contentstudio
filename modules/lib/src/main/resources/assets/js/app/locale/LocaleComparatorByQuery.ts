import {type Locale} from '@enonic/lib-admin-ui/locale/Locale';

export class LocaleComparatorByQuery {
    private readonly locale1: Locale;
    private readonly locale2: Locale;
    private readonly query: string;

    constructor(locale1: Locale, locale2: Locale, query: string) {
        this.locale1 = locale1;
        this.locale2 = locale2;
        this.query = query.toLowerCase();
    }

    compare(): number {
        // locales are displayed like "DisplayName (ProcessedTag)", processed tag has a priority over display name
        // if both compared tags are missing query entry or both have it on the same position then compare display name
        return this.compareTags() || this.compareDisplayNames();
    }

    private compareTags(): number {
        const tag1: string = this.locale1.getProcessedTag().toLowerCase();
        const tag2: string = this.locale2.getProcessedTag().toLowerCase();
        const qTag1Index: number = tag1.indexOf(this.query);
        const qTag2Index: number = tag2.indexOf(this.query);

        // only tag1 has a query within or tag1 equals query
        if (qTag1Index > -1 && (qTag2Index < 0 || tag1 === this.query)) {
            return -1;
        }

        // only tag2 has a query within or tag2 equals query
        if (qTag2Index > -1 && (qTag1Index < 0 || tag2 === this.query)) {
            return 1;
        }

        // both tag1 and tag2 have a query within
        if (qTag1Index > -1 && qTag2Index > -1) {
            // query is at the same position in both tags
            if (qTag1Index === qTag2Index) {
                // deeper comparison of tag parts to distinguish between cases like q='be' and tags are 'bem' and 'be-BY'
                return this.compareTagParts(tag1, tag2);
            }

            // tags having query within at different positions
            return qTag1Index - qTag2Index;
        }

        return 0;
    }

    private compareTagParts(tag1: string, tag2: string): number {
        // at this point both compared tags are having query entry at the same position
        // splitting tags like 'be-BY' into ['be','by'] and 'bem' into ['bem'] to compare with query
        const tagParts1: string[] = tag1.split('-');
        const tagParts2: string[] = tag2.split('-');

        let result: number = 0;

        tagParts1.some((v1: string, index: number) => {
            if (v1.indexOf(this.query) > -1) {
                // if both parts are considered equal then picking shorter item first
                result = this.compareTagPartsValues(v1, tagParts2[index]) || tagParts1.length - tagParts2.length;
                return true;
            }
        });

        return result;
    }

    private compareTagPartsValues(v1: string, v2: string): number {
        if (v1 === v2) {
            return 0;
        }

        if (v1 === this.query) {
            return -1;
        }

        if (v2 === this.query) {
            return 1;
        }

        return 0;
    }

    private compareDisplayNames(): number {
        const qDisplayName1Index: number = this.locale1.getDisplayName().toLowerCase().indexOf(this.query);
        const qDisplayName2Index: number = this.locale2.getDisplayName().toLowerCase().indexOf(this.query);

        if (qDisplayName1Index > -1 && qDisplayName2Index < 0) {
            return -1;
        }

        if (qDisplayName2Index > -1 && qDisplayName1Index < 0) {
            return 1;
        }

        if (qDisplayName1Index > -1 && qDisplayName2Index > -1) {
            return qDisplayName1Index - qDisplayName1Index;
        }

        return 0;
    }
}
