import {PublishRequestItemJson} from './json/PublishRequestItemJson';
import {assertNotNull} from '@enonic/lib-admin-ui/util/Assert';
import {ContentId} from '../content/ContentId';

export class PublishRequestItem {

    private readonly id: ContentId;

    private readonly includeChildren: boolean;

    constructor(builder: PublishRequestItemBuilder) {
        this.id = builder.id;
        this.includeChildren = builder.includeChildren;
    }

    public getId(): ContentId {
        return this.id;
    }

    public isIncludeChildren(): boolean {
        return this.includeChildren;
    }

    toJson(): PublishRequestItemJson {
        return {
            id: this.id.toString(),
            includeChildren: this.includeChildren
        };
    }

    public static create(): PublishRequestItemBuilder {
        return new PublishRequestItemBuilder();
    }

}

export class PublishRequestItemBuilder {

    id: ContentId;

    includeChildren: boolean;

    fromJson(json: PublishRequestItemJson): PublishRequestItemBuilder {
        assertNotNull(json.id, 'content id cannot be null');

        this.id = new ContentId(json.id);
        this.includeChildren = !!json.includeChildren;

        return this;
    }

    public setId(id: ContentId): PublishRequestItemBuilder {
        this.id = id;
        return this;
    }

    public setIncludeChildren(includeChildren: boolean): PublishRequestItemBuilder {
        this.includeChildren = includeChildren;
        return this;
    }

    public build(): PublishRequestItem {
        return new PublishRequestItem(this);
    }
}
