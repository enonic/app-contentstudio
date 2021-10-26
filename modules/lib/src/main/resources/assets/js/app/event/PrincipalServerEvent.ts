import {NodeEventJson, NodeServerEvent} from 'lib-admin-ui/event/NodeServerEvent';
import {NodeServerChangeType} from 'lib-admin-ui/event/NodeServerChange';
import {PrincipalServerChangeItem} from './PrincipalServerChangeItem';
import {PrincipalServerChange} from './PrincipalServerChange';

//TODO: should be replaced by lib class in #1221
export class PrincipalServerEvent
    extends NodeServerEvent {

    constructor(change: PrincipalServerChange) {
        super(change);
    }

    static is(eventJson: NodeEventJson): boolean {
        return eventJson.data.nodes.some(node => node.path.indexOf('/identity') === 0);
    }

    static fromJson(nodeEventJson: NodeEventJson): PrincipalServerEvent {
        const change: PrincipalServerChange = PrincipalServerChange.fromJson(nodeEventJson);
        return new PrincipalServerEvent(change);
    }

    getType(): NodeServerChangeType {
        return this.getNodeChange() ? this.getNodeChange().getChangeType() : null;
    }

    getNodeChange(): PrincipalServerChange {
        return <PrincipalServerChange>super.getNodeChange();
    }
}
