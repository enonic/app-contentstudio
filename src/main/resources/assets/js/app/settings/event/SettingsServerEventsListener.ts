import {EventJson} from 'lib-admin-ui/event/EventJson';
import {ServerEventsListener} from 'lib-admin-ui/event/ServerEventsListener';
import {NodeEventJson} from 'lib-admin-ui/event/NodeServerEvent';
import {SettingsServerEvent} from './SettingsServerEvent';

export class SettingsServerEventsListener
    extends ServerEventsListener {

    protected onUnknownServerEvent(eventJson: EventJson) {
        const eventType: string = eventJson.type;

        if (!eventType || eventType.indexOf('node.') !== 0) {

            return;
        }

        if (SettingsServerEvent.is(<NodeEventJson>eventJson)) {
            const event: SettingsServerEvent = SettingsServerEvent.fromJson(<NodeEventJson>eventJson);
            if (event.isCreateEvent() || event.isUpdateEvent()) {
                // allow some time for the backend to process items before requesting them
                setTimeout(() => this.fireEvent(event), 1000);
            } else {
                this.fireEvent(event);
            }
        }
    }
}
