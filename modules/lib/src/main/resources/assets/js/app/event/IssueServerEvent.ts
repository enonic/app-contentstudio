import {type NodeEventJson, NodeServerEvent} from '@enonic/lib-admin-ui/event/NodeServerEvent';
import {type NodeServerChangeType} from '@enonic/lib-admin-ui/event/NodeServerChange';
import {IssueServerChange} from './IssueServerChange';

export class IssueServerEvent
    extends NodeServerEvent {

    private static ISSUE_PATH_PATTERN: RegExp = /^\/issues\/[^/]+(?:\/.*)?$/;

    constructor(change: IssueServerChange) {
        super(change);
    }

    /*
     * Issue comments are stored as child nodes under /issues/<issue-name>/...
     * Keep child issue paths so details dialogs can refresh comments from server events.
     */

    static is(eventJson: NodeEventJson): boolean {
        return eventJson.data.nodes.some(node => IssueServerEvent.ISSUE_PATH_PATTERN.test(node.path));
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
