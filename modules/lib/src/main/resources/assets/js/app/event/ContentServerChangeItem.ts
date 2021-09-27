import {NodeEventNodeJson} from 'lib-admin-ui/event/NodeServerEvent';
import {NodeServerChangeItem, NodeServerChangeItemBuilder} from 'lib-admin-ui/event/NodeServerChangeItem';
import {ContentId} from '../content/ContentId';
import {ContentPath} from '../content/ContentPath';

export class ContentServerChangeItem
    extends NodeServerChangeItem {

    public static pathPrefix: string = '/content';

    private readonly contentId: ContentId;

    private readonly contentPath: ContentPath;

    constructor(builder: ContentServerChangeItemBuilder) {
        super(builder);

        this.contentId = new ContentId(this.getId());
        this.contentPath = ContentPath.fromString(this.getPath());
    }

    protected processPath(path: string): string {
        return path.substr(ContentServerChangeItem.pathPrefix.length);
    }

    static fromJson(json: NodeEventNodeJson): ContentServerChangeItem {
        return new ContentServerChangeItemBuilder().fromJson(json).build();
    }

    getContentId(): ContentId {
        return this.contentId;
    }

    getContentPath(): ContentPath {
        return this.contentPath;
    }
}

export class ContentServerChangeItemBuilder
    extends NodeServerChangeItemBuilder {

    fromJson(json: NodeEventNodeJson): ContentServerChangeItemBuilder {
        super.fromJson(json);

        return this;
    }

    build(): ContentServerChangeItem {
        return new ContentServerChangeItem(this);
    }
}
