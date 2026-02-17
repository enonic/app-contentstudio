import {type NodeEventJson, NodeServerEvent} from '@enonic/lib-admin-ui/event/NodeServerEvent';
import {type NodeServerChangeType} from '@enonic/lib-admin-ui/event/NodeServerChange';
import {IssueServerChange} from './IssueServerChange';

export class IssueServerEvent
    extends NodeServerEvent {

    constructor(change: IssueServerChange) {
        super(change);
    }

    /*
     Comments are stored under the issue at /issues/issue-1/comment-2
     So we need to filter them out leaving just /issues/issue-N
      */
    static is(eventJson: NodeEventJson): boolean {
        return eventJson.data.nodes.some(node => /^\/issues\/issue-\d+$/.test(node.path));
    }

    static fromJson(nodeEventJson: NodeEventJson): IssueServerEvent {
        const change: IssueServerChange = IssueServerChange.fromJson(nodeEventJson);
        return new IssueServerEvent(change);
    }

    getType(): NodeServerChangeType {
        return this.getNodeChange() ? this.getNodeChange().getChangeType() : null;
    }

    getNodeChange(): IssueServerChange {
        return super.getNodeChange() as IssueServerChange;
    }
}
