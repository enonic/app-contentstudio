import {ContentServerChange} from './ContentServerChange';
import {type NodeEventJson, type NodeEventNodeJson, NodeServerEvent} from '@enonic/lib-admin-ui/event/NodeServerEvent';
import {ContentPath} from '../content/ContentPath';

export class ContentServerEvent
    extends NodeServerEvent {

    constructor(change: ContentServerChange) {
        super(change);
    }

    static is(eventJson: NodeEventJson): boolean {
        return eventJson.data.nodes.some((node: NodeEventNodeJson) =>
            node.path.indexOf(`/${ContentPath.CONTENT_ROOT}`) === 0 && node.path !== `/${ContentPath.CONTENT_ROOT}`);
    }

    static fromJson(nodeEventJson: NodeEventJson): ContentServerEvent {
        const change: ContentServerChange = ContentServerChange.fromJson(nodeEventJson);
        return new ContentServerEvent(change);
    }

    getNodeChange(): ContentServerChange {
        return super.getNodeChange() as ContentServerChange;
    }
}
