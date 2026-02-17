import {type NodeEventNodeJson} from '@enonic/lib-admin-ui/event/NodeServerEvent';
import {NodeServerChangeItem, NodeServerChangeItemBuilder} from '@enonic/lib-admin-ui/event/NodeServerChangeItem';
import {ContentId} from '../content/ContentId';
import {ContentPath} from '../content/ContentPath';
import {type Equitable} from '@enonic/lib-admin-ui/Equitable';
import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';

export class ContentServerChangeItem
    extends NodeServerChangeItem implements Equitable {

    private readonly contentId: ContentId;

    declare protected path: ContentPath;

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
        return super.getNewPath() as ContentPath;
    }

    getPath(): ContentPath {
        return super.getPath() as ContentPath;
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

    equals(o: Equitable): boolean {
        if (!ObjectHelper.iFrameSafeInstanceOf(o, ContentServerChangeItem)) {
            return false;
        }

        const other = o as ContentServerChangeItem;

        if (!ObjectHelper.stringEquals(this.id, other.id)) {
            return false;
        }

        if (!ObjectHelper.stringEquals(this.branch, other.branch)) {
            return false;
        }

        if (!ObjectHelper.stringEquals(this.repo, other.repo)) {
            return false;
        }

        if (!ObjectHelper.equals(this.path, other.path)) {
            return false;
        }

        return ObjectHelper.equals(this.newPath, other.newPath);
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
