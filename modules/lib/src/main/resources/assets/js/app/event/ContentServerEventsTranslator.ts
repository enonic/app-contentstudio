import {EventJson} from 'lib-admin-ui/event/EventJson';
import {Event} from 'lib-admin-ui/event/Event';
import {NodeEventJson} from 'lib-admin-ui/event/NodeServerEvent';
import {ServerEventsTranslator} from 'lib-admin-ui/event/ServerEventsTranslator';
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
            if (ArchiveServerEvent.is(<NodeEventJson>eventJson)) {
                return ArchiveServerEvent.fromJson(<NodeEventJson>eventJson);
            }

            if (ContentServerEvent.is(<NodeEventJson>eventJson)) {
                return ContentServerEvent.fromJson(<NodeEventJson>eventJson);
            }

            if (IssueServerEvent.is(<NodeEventJson>eventJson)) {
                return IssueServerEvent.fromJson(<NodeEventJson>eventJson);
            }

            if (PrincipalServerEvent.is(<NodeEventJson>eventJson)) {
                return PrincipalServerEvent.fromJson(<NodeEventJson>eventJson);
            }
        }

        if (eventType === CollaborationServerEvent.EVENT_NAME) {
            return CollaborationServerEvent.fromJson(<CollaborationEventJson>eventJson);
        }

        return super.translateServerEvent(eventJson);
    }
}
