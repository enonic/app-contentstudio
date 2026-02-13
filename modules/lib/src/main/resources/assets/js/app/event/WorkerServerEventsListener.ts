import {type Application} from '@enonic/lib-admin-ui/app/Application';
import {type Event} from '@enonic/lib-admin-ui/event/Event';
import {type EventJson} from '@enonic/lib-admin-ui/event/EventJson';
import {type ServerEventsTranslator} from '@enonic/lib-admin-ui/event/ServerEventsTranslator';
import {MessageType} from '../stores/data/server';
import {type ReceivedWorkerMessage} from '../stores/data/worker';
import {subscribe as subscribeToWorker} from '../stores/worker';

export abstract class WorkerServerEventsListener {

    private serverEventsTranslator: ServerEventsTranslator;

    private applications: Application[];

    constructor(applications: Application[], translator: ServerEventsTranslator) {
        this.applications = applications;
        this.serverEventsTranslator = translator;

        subscribeToWorker((message: ReceivedWorkerMessage) => {
            const payload = message.payload;
            switch (payload.type) {
                case MessageType.APPLICATION:
                case MessageType.NODE:
                case MessageType.REPOSITORY:
                case MessageType.TASK:
                case MessageType.PROJECT:
                    this.handleServerEvent(payload.payload);
                    break;
            }
        });
    }

    private handleServerEvent(event: EventJson): void {
        const serverEvent: Event = this.serverEventsTranslator.translateServerEvent(event);
        if (serverEvent) {
            this.onServerEvent(serverEvent);
        } else {
            this.onUnknownServerEvent(event);
        }
    }

    protected abstract onServerEvent(event: Event): void;

    protected abstract onUnknownServerEvent(_eventJson: EventJson): void;

    protected fireEvent(event: Event) {
        this.applications.forEach((application) => {
            const appWindow = application.getWindow();
            if (appWindow) {
                event.fire(appWindow);
            }
        });
    }

}
