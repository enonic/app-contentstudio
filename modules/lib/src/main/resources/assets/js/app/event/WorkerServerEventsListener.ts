import {Application} from '@enonic/lib-admin-ui/app/Application';
import {Event} from '@enonic/lib-admin-ui/event/Event';
import {EventJson} from '@enonic/lib-admin-ui/event/EventJson';
import {ServerEventsTranslator} from '@enonic/lib-admin-ui/event/ServerEventsTranslator';
import {MessageType} from '../stores/data/server';
import {ReceivedWorkerMessage} from '../stores/data/worker';
import {subscribe as subscribeToWorker} from '../stores/worker';

export abstract class WorkerServerEventsListener {

    private serverEventsTranslator: ServerEventsTranslator;

    private applications: Application[];

    constructor(applications: Application[], translator?: ServerEventsTranslator) {
        this.applications = applications;
        this.serverEventsTranslator = translator || new ServerEventsTranslator();

        subscribeToWorker((message: ReceivedWorkerMessage) => {
            const {type, payload} = message.payload;
            switch (type) {
                case MessageType.APPLICATION:
                case MessageType.NODE:
                case MessageType.REPOSITORY:
                case MessageType.TASK:
                    this.handleServerEvent(payload);
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
