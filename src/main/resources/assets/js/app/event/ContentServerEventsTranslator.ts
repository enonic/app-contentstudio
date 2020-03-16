import {EventJson} from 'lib-admin-ui/event/EventJson';
import {Event} from 'lib-admin-ui/event/Event';
import {NodeEventJson} from 'lib-admin-ui/event/NodeServerEvent';
import {ServerEventsTranslator} from 'lib-admin-ui/event/ServerEventsTranslator';
import {IssueServerEvent} from './IssueServerEvent';
import {ContentServerEvent} from './ContentServerEvent';

export class ContentServerEventsTranslator
    extends ServerEventsTranslator {

    translateServerEvent(eventJson: EventJson): Event {
        const eventType: string = eventJson.type;

        if (eventType.indexOf('node.') === 0) {
            if (ContentServerEvent.is(<NodeEventJson>eventJson)) {
                return ContentServerEvent.fromJson(<NodeEventJson>eventJson);
            }

            if (IssueServerEvent.is(<NodeEventJson>eventJson)) {
                return IssueServerEvent.fromJson(<NodeEventJson>eventJson);
            }
        }

        return super.translateServerEvent(eventJson);
    }
}
