import {ContentPath} from 'lib-admin-ui/content/ContentPath';
import {ContentId} from 'lib-admin-ui/content/ContentId';
import {NodeEventNodeJson} from 'lib-admin-ui/event/NodeServerEvent';
import {NodeServerChangeItem, NodeServerChangeItemBuilder} from 'lib-admin-ui/event/NodeServerChangeItem';

export class ContentServerChangeItem
    extends NodeServerChangeItem {

    public static pathPrefix: string = '/content';

    private contentId: ContentId;

    private contentPath: ContentPath;


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
