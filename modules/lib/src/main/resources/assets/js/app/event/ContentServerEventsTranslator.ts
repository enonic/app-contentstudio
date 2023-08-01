import {EventJson} from '@enonic/lib-admin-ui/event/EventJson';
import {Event} from '@enonic/lib-admin-ui/event/Event';
import {NodeEventJson} from '@enonic/lib-admin-ui/event/NodeServerEvent';
import {ServerEventsTranslator} from '@enonic/lib-admin-ui/event/ServerEventsTranslator';
import {IssueServerEvent} from './IssueServerEvent';
import {ContentServerEvent} from './ContentServerEvent';
import {ArchiveServerEvent} from './ArchiveServerEvent';
import {PrincipalServerEvent} from './PrincipalServerEvent';
import {CollaborationServerEvent} from './CollaborationServerEvent';
import {CollaborationEventJson} from './CollaborationEventJson';

export class ContentServerEventsTranslator
    extends ServerEventsTranslator {

    translateServerEvent(eventJson: EventJson): Event {
        const eventType: string = eventJson.type;

        if (eventType.indexOf('node.') === 0) {
            if (ArchiveServerEvent.is(eventJson as NodeEventJson)) {
                return ArchiveServerEvent.fromJson(eventJson as NodeEventJson);
            }

            if (ContentServerEvent.is(eventJson as NodeEventJson)) {
                return ContentServerEvent.fromJson(eventJson as NodeEventJson);
            }

            if (IssueServerEvent.is(eventJson as NodeEventJson)) {
                return IssueServerEvent.fromJson(eventJson as NodeEventJson);
            }

            if (PrincipalServerEvent.is(eventJson as NodeEventJson)) {
                return PrincipalServerEvent.fromJson(eventJson as NodeEventJson);
            }
        }

        if (eventType === CollaborationServerEvent.EVENT_NAME) {
            return CollaborationServerEvent.fromJson(eventJson as CollaborationEventJson);
        }

        return super.translateServerEvent(eventJson);
    }
}
