import {NodeServerChange, NodeServerChangeBuilder, NodeServerChangeType} from '@enonic/lib-admin-ui/event/NodeServerChange';
import {NodeEventJson, NodeEventNodeJson} from '@enonic/lib-admin-ui/event/NodeServerEvent';
import {ContentServerChangeItem} from './ContentServerChangeItem';
import {ContentPath} from '../content/ContentPath';

export class ContentServerChange
    extends NodeServerChange {

    constructor(builder: ContentServerChangeBuilder) {
        super(builder);
    }

    static fromJson(nodeEventJson: NodeEventJson): ContentServerChange {
        return new ContentServerChangeBuilder().fromJson(nodeEventJson).build() as ContentServerChange;
    }

    getChangeItems(): ContentServerChangeItem[] {
        return super.getChangeItems() as ContentServerChangeItem[];
    }

}

export class ContentServerChangeBuilder
    extends NodeServerChangeBuilder {

    build(): ContentServerChange {
        return new ContentServerChange(this);
    }

    nodeJsonToChangeItem(node: NodeEventNodeJson): ContentServerChangeItem {
        return ContentServerChangeItem.fromJson(node);
    }

}
