import {ArrayHelper} from '@enonic/lib-admin-ui/util/ArrayHelper';
import {Equitable} from '@enonic/lib-admin-ui/Equitable';
import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';
import {ContentTypeSummary} from '@enonic/lib-admin-ui/schema/content/ContentTypeSummary';
import {ContentTypeName} from '@enonic/lib-admin-ui/schema/content/ContentTypeName';

export class ContentTypeSummaries
    implements Equitable {

    private array: ContentTypeSummary[];

    constructor(array: ContentTypeSummary[]) {
        this.array = array;
    }

    static empty(): ContentTypeSummaries {
        return ContentTypeSummaries.create().build();
    }

    static from(contentTypeSymmaries: ContentTypeSummary[]): ContentTypeSummaries {
        return ContentTypeSummaries.create().fromContentTypeSummaries(contentTypeSymmaries).build();
    }

    static create(): ContentTypeSummariesBuilder {
        return new ContentTypeSummariesBuilder();
    }

    getByName(contentTypeName: ContentTypeName): ContentTypeSummary {
        return ArrayHelper.findElementByFieldValue(this.array, 'name', contentTypeName.toString());
    }

    length(): number {
        return this.array.length;
    }

    map<U>(callbackfn: (value: ContentTypeSummary, index?: number) => U): U[] {
        return this.array.map((value: ContentTypeSummary, index: number) => {
            return callbackfn(value, index);
        });
    }

    contains(contentTypeSummary: ContentTypeSummary): boolean {
        return this.array.some((current: ContentTypeSummary) => {
            return current.equals(contentTypeSummary);
        });
    }

    filter(callbackfn: (value: ContentTypeSummary, index?: number) => boolean): ContentTypeSummaries {
        this.array = this.array.filter((value: ContentTypeSummary, index?: number) => {
            return callbackfn(value, index);
        });

        return this;
    }

    forEach(callbackfn: (value: ContentTypeSummary, index: number, array: ContentTypeSummary[]) => void): void {
        this.array.forEach((value, index, array) => {
            callbackfn(value, index, array);
        });
    }

    slice(from: number, to: number): ContentTypeSummary[] {
        return this.array.slice(from, to);
    }

    sort(compareFn: (a: ContentTypeSummary, b: ContentTypeSummary) => number): ContentTypeSummary[] {
        return this.array.sort(compareFn);
    }

    equals(o: Equitable): boolean {
        if (!ObjectHelper.iFrameSafeInstanceOf(o, ContentTypeSummaries)) {
            return false;
        }

        let other = <ContentTypeSummaries>o;
        return ObjectHelper.arrayEquals(this.array, other.array);
    }
}

export class ContentTypeSummariesBuilder {

    array: ContentTypeSummary[] = [];

    fromContentTypeSummaries(contentTypeSummaries: ContentTypeSummary[]): ContentTypeSummariesBuilder {
        if (contentTypeSummaries) {
            contentTypeSummaries.forEach((contentTypeSummary: ContentTypeSummary) => this.addContentTypeSummary(contentTypeSummary));
        }
        return this;
    }

    addContentTypeSummary(value: ContentTypeSummary): ContentTypeSummariesBuilder {
        this.array.push(value);
        return this;
    }

    build(): ContentTypeSummaries {
        return new ContentTypeSummaries(this.array);
    }
}
