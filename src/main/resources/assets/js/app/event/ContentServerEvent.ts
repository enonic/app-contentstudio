import {ContentServerChange} from './ContentServerChange';
import {NodeEventJson, NodeServerEvent} from 'lib-admin-ui/event/NodeServerEvent';

export class ContentServerEvent
    extends NodeServerEvent {

    constructor(change: ContentServerChange) {
        super(change);
    }

    static is(eventJson: NodeEventJson): boolean {
        return eventJson.data.nodes.some(node => node.path.indexOf('/content') === 0 && node.path !== '/content');
    }

    static fromJson(nodeEventJson: NodeEventJson): ContentServerEvent {
        let change = ContentServerChange.fromJson(nodeEventJson);
        return new ContentServerEvent(change);
    }

    getNodeChange(): ContentServerChange {
        return <ContentServerChange>super.getNodeChange();
    }
}
