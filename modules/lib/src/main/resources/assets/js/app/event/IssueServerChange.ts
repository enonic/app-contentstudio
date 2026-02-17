import {NodeServerChange, NodeServerChangeBuilder} from '@enonic/lib-admin-ui/event/NodeServerChange';
import {type NodeEventJson, type NodeEventNodeJson} from '@enonic/lib-admin-ui/event/NodeServerEvent';
import {IssueServerChangeItem} from './IssueServerChangeItem';

export class IssueServerChange
    extends NodeServerChange {

    constructor(builder: IssueServerChangeBuilder) {
        super(builder);
    }

    static fromJson(nodeEventJson: NodeEventJson): IssueServerChange {
        return new IssueServerChangeBuilder().fromJson(nodeEventJson).build();
    }
}

export class IssueServerChangeBuilder
    extends NodeServerChangeBuilder {

    build(): IssueServerChange {
        return new IssueServerChange(this);
    }

    nodeJsonToChangeItem(node: NodeEventNodeJson): IssueServerChangeItem {
        return IssueServerChangeItem.fromJson(node);
    }

}
