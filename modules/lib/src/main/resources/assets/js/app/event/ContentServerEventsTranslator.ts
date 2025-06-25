import {type Event} from '@enonic/lib-admin-ui/event/Event';
import {type EventJson} from '@enonic/lib-admin-ui/event/EventJson';
import {type NodeEventJson} from '@enonic/lib-admin-ui/event/NodeServerEvent';
import {ServerEventsTranslator} from '@enonic/lib-admin-ui/event/ServerEventsTranslator';
import {ArchiveServerEvent} from './ArchiveServerEvent';
import {ContentServerEvent} from './ContentServerEvent';
import {IssueServerEvent} from './IssueServerEvent';
import {type PermissionsEventJson, PermissionsServerEvent} from './PermissionsServerEvent';
import {PrincipalServerEvent} from './PrincipalServerEvent';

export class ContentServerEventsTranslator
    extends ServerEventsTranslator {

    private isNodeEventJson(eventJson: EventJson): eventJson is NodeEventJson {
        return Array.isArray((eventJson as NodeEventJson).data?.nodes);
    }

    translateServerEvent(eventJson: EventJson): Event {
        const eventType: string = eventJson.type;

        if (eventType.indexOf('node.') === 0) {
            if (PermissionsServerEvent.is(eventJson)) {
                return PermissionsServerEvent.fromJson(eventJson as PermissionsEventJson);
            }

            if (this.isNodeEventJson(eventJson)) {
                if (ArchiveServerEvent.is(eventJson)) {
                    return ArchiveServerEvent.fromJson(eventJson);
                }

                if (ContentServerEvent.is(eventJson)) {
                    return ContentServerEvent.fromJson(eventJson);
                }

                if (IssueServerEvent.is(eventJson)) {
                    return IssueServerEvent.fromJson(eventJson);
                }

                if (PrincipalServerEvent.is(eventJson)) {
                    return PrincipalServerEvent.fromJson(eventJson);
                }
            }
        }

        return super.translateServerEvent(eventJson);
    }
}
