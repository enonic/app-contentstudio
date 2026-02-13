import {type ContentId} from '../content/ContentId';
import {type ContentDuplicateParamsJson} from './ContentDuplicateParamsJson';

export class ContentDuplicateParams {
    private readonly contentId: ContentId;
    private includeChildren: boolean;
    private variant: boolean;
    private parent: string;
    private name: string;

    constructor(contentId: ContentId) {
        this.contentId = contentId;
    }

    setIncludeChildren(value: boolean): ContentDuplicateParams {
        this.includeChildren = value;
        return this;
    }

    setVariant(value: boolean): ContentDuplicateParams {
        this.variant = value;
        return this;
    }

    setParent(value: string): ContentDuplicateParams {
        this.parent = value;
        return this;
    }

    setName(value: string): ContentDuplicateParams {
        this.name = value;
        return this;
    }

    getContentId(): ContentId {
        return this.contentId;
    }

    isIncludeChildren(): boolean {
        return this.includeChildren;
    }

    isVariant(): boolean {
        return this.variant;
    }

    getParent(): string {
        return this.parent;
    }

    getName(): string {
        return this.name;
    }

    toJson(): ContentDuplicateParamsJson {
        return {
            contentId: this.contentId.toString(),
            includeChildren: !!this.includeChildren,
            variant: !!this.variant,
            parent: this.parent,
            name: this.name
        };
    }
}
