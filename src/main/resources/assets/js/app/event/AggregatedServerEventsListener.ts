import {Event} from 'lib-admin-ui/event/Event';
import {BatchContentServerEvent} from './BatchContentServerEvent';
import {ServerEventAggregator} from './ServerEventAggregator';
import {ContentServerEvent} from 'lib-admin-ui/content/event/ContentServerEvent';
import {ServerEventsListener} from 'lib-admin-ui/event/ServerEventsListener';
import {Application} from 'lib-admin-ui/app/Application';
import {ObjectHelper} from 'lib-admin-ui/ObjectHelper';

export class AggregatedServerEventsListener
    extends ServerEventsListener {

    private aggregator: ServerEventAggregator;

    constructor(applications: Application[]) {
        super(applications);

        this.aggregator = new ServerEventAggregator();

        this.aggregator.onBatchIsReady(() => {

            let event = new BatchContentServerEvent(<ContentServerEvent[]>this.aggregator.getEvents(), this.aggregator.getType());
            this.fireEvent(event);

            this.aggregator.resetEvents();
        });
    }

    protected onServerEvent(event: Event) {
        const isContentEvent = ObjectHelper.iFrameSafeInstanceOf(event, ContentServerEvent);
        if (isContentEvent) {
            this.aggregator.appendEvent(<ContentServerEvent>event);
        } else {
            this.fireEvent(event);
        }
    }
}
