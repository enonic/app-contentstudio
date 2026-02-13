import {type NodeEventNodeJson} from '@enonic/lib-admin-ui/event/NodeServerEvent';
import {NodeServerChangeItem, NodeServerChangeItemBuilder} from '@enonic/lib-admin-ui/event/NodeServerChangeItem';

export class IssueServerChangeItem
    extends NodeServerChangeItem {

    constructor(builder: IssueServerChangeItemBuilder) {
        super(builder);
    }

    static fromJson(json: NodeEventNodeJson): IssueServerChangeItem {
        return new IssueServerChangeItemBuilder().fromJson(json).build();
    }
}

export class IssueServerChangeItemBuilder
    extends NodeServerChangeItemBuilder {

    fromJson(json: NodeEventNodeJson): IssueServerChangeItemBuilder {
        super.fromJson(json);

        return this;
    }

    build(): IssueServerChangeItem {
        return new IssueServerChangeItem(this);
    }
}
