import {NodeServerChange, NodeServerChangeBuilder, NodeServerChangeType} from 'lib-admin-ui/event/NodeServerChange';
import {NodeEventJson, NodeEventNodeJson} from 'lib-admin-ui/event/NodeServerEvent';
import {ContentServerChangeItem} from './ContentServerChangeItem';
import {ContentPath} from '../content/ContentPath';

export class ContentServerChange
    extends NodeServerChange {

    constructor(builder: ContentServerChangeBuilder) {
        super(builder);
    }

    static fromJson(nodeEventJson: NodeEventJson): ContentServerChange {
        return <ContentServerChange>new ContentServerChangeBuilder().fromJson(nodeEventJson).build();
    }

    getChangeItems(): ContentServerChangeItem[] {
        return <ContentServerChangeItem[]>super.getChangeItems();
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
