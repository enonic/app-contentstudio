import {type Equitable} from '@enonic/lib-admin-ui/Equitable';
import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';
import {type PageContributionsJson} from './resource/MacroPreviewJson';

export class PageContributions
    implements Equitable {
    private readonly bodyBegin: string[];
    private readonly bodyEnd: string[];
    private readonly headBegin: string[];
    private readonly headEnd: string[];

    constructor(builder: PageContributionsBuilder) {
        this.bodyBegin = builder.bodyBegin || [];
        this.bodyEnd = builder.bodyEnd || [];
        this.headBegin = builder.headBegin || [];
        this.headEnd = builder.headEnd || [];
    }

    static create(): PageContributionsBuilder {
        return new PageContributionsBuilder();
    }

    getBodyBegin(): string [] {
        return this.bodyBegin;
    }

    getBodyEnd(): string [] {
        return this.bodyEnd;
    }

    getHeadBegin(): string [] {
        return this.headBegin;
    }

    getHeadEnd(): string [] {
        return this.headEnd;
    }

    hasAtLeastOneScript(): boolean {
        return this.bodyBegin.length > 0 || this.bodyEnd.length > 0 || this.headBegin.length > 0 || this.headEnd.length > 0;
    }

    equals(o: Equitable): boolean {
        if (!ObjectHelper.iFrameSafeInstanceOf(o, PageContributions)) {
            return false;
        }

        const other = o as PageContributions;

        if (!ObjectHelper.stringArrayEquals(this.bodyBegin, other.bodyBegin)) {
            return false;
        }

        if (!ObjectHelper.stringArrayEquals(this.bodyEnd, other.bodyEnd)) {
            return false;
        }

        if (!ObjectHelper.stringArrayEquals(this.headBegin, other.headBegin)) {
            return false;
        }

        if (!ObjectHelper.stringArrayEquals(this.headEnd, other.headEnd)) {
            return false;
        }

        return true;
    }
}

export class PageContributionsBuilder {

    bodyBegin: string[];
    bodyEnd: string[];
    headBegin: string[];
    headEnd: string[];

    fromJson(json: PageContributionsJson) {
        this.bodyBegin = json.bodyBegin;
        this.bodyEnd = json.bodyEnd;
        this.headBegin = json.headBegin;
        this.headEnd = json.headEnd;
        return this;
    }

    setBodyBegin(value: string[]): PageContributionsBuilder {
        this.bodyBegin = value;
        return this;
    }

    setBodyEnd(value: string[]): PageContributionsBuilder {
        this.bodyEnd = value;
        return this;
    }

    setHeadBegin(value: string[]): PageContributionsBuilder {
        this.headBegin = value;
        return this;
    }

    setHeadEnd(value: string[]): PageContributionsBuilder {
        this.headEnd = value;
        return this;
    }

    build(): PageContributions {
        return new PageContributions(this);
    }
}
