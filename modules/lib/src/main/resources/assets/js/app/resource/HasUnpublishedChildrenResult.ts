import {type HasUnpublishedChildrenJson, type HasUnpublishedChildrenListJson} from './json/HasUnpublishedChildrenJson';
import {ContentId} from '../content/ContentId';

export class HasUnpublishedChildrenResult {

    private contents: HasUnpublishedChildren[];

    constructor(contents: HasUnpublishedChildren[]) {
        this.contents = contents;
    }

    getResult(): HasUnpublishedChildren[] {
        return this.contents;
    }

    static fromJson(json: HasUnpublishedChildrenListJson): HasUnpublishedChildrenResult {

        const contents: HasUnpublishedChildren[] = json.contents ? json.contents.map(
            requestedJson => HasUnpublishedChildren.fromJson(requestedJson)) : [];

        return new HasUnpublishedChildrenResult(contents);
    }
}

export class HasUnpublishedChildren {

    private id: ContentId;

    private hasChildren: boolean;

    constructor(id: string, hasChildren: boolean) {
        this.id = new ContentId(id);
        this.hasChildren = hasChildren;
    }

    public static fromJson(json: HasUnpublishedChildrenJson): HasUnpublishedChildren {
        return new HasUnpublishedChildren(json.id.id, json.hasChildren);
    }

    getId(): ContentId {
        return this.id;
    }

    getHasChildren(): boolean {
        return this.hasChildren;
    }
}
