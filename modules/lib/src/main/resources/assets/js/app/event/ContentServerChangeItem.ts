import {NodeEventNodeJson} from 'lib-admin-ui/event/NodeServerEvent';
import {NodeServerChangeItem, NodeServerChangeItemBuilder} from 'lib-admin-ui/event/NodeServerChangeItem';
import {ContentId} from '../content/ContentId';
import {ContentPath} from '../content/ContentPath';

export class ContentServerChangeItem
    extends NodeServerChangeItem {

    private readonly contentId: ContentId;

    protected path: ContentPath;

    constructor(builder: ContentServerChangeItemBuilder) {
        super(builder);

        this.contentId = new ContentId(this.getId());
    }

    static fromJson(json: NodeEventNodeJson): ContentServerChangeItem {
        return new ContentServerChangeItemBuilder().fromJson(json).build();
    }

    getContentId(): ContentId {
        return this.contentId;
    }

    getNewPath(): ContentPath {
        return <ContentPath>super.getNewPath();
    }

    getPath(): ContentPath {
        return <ContentPath>super.getPath();
    }

    protected processPath(path: string): ContentPath {
        if (!path) {
            return null;
        }

        const fullPathWithRoot: ContentPath = ContentPath.create().fromString(path).build();
        const pathNoRoot: ContentPath = fullPathWithRoot
            .newBuilder()
            .setElements(fullPathWithRoot.getElements().slice(1))
            .setRoot(fullPathWithRoot.getRootElement())
            .build();

        return pathNoRoot;
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
