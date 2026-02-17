import {ContentServerChange} from './ContentServerChange';
import {type NodeEventJson, type NodeEventNodeJson, NodeServerEvent} from '@enonic/lib-admin-ui/event/NodeServerEvent';
import {ContentPath} from '../content/ContentPath';

export class ArchiveServerEvent
    extends NodeServerEvent {

    constructor(change: ContentServerChange) {
        super(change);
    }

    static is(eventJson: NodeEventJson): boolean {
        return eventJson.data.nodes.some((node: NodeEventNodeJson) =>
            node.path.indexOf(`/${ContentPath.ARCHIVE_ROOT}`) === 0 && node.path !== `/${ContentPath.ARCHIVE_ROOT}`);
    }

    static fromJson(nodeEventJson: NodeEventJson): ArchiveServerEvent {
        const change: ContentServerChange = ContentServerChange.fromJson(nodeEventJson);
        return new ArchiveServerEvent(change);
    }

    getNodeChange(): ContentServerChange {
        return super.getNodeChange() as ContentServerChange;
    }
}
