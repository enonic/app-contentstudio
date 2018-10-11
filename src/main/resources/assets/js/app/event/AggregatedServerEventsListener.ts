import {BatchContentServerEvent} from './BatchContentServerEvent';
import {ServerEventAggregator} from './ServerEventAggregator';
import ContentServerEvent = api.content.event.ContentServerEvent;
import ServerEventsListener = api.event.ServerEventsListener;

export class AggregatedServerEventsListener
    extends ServerEventsListener {

    private aggregator: ServerEventAggregator;

    constructor(applications: api.app.Application[]) {
        super(applications);

        this.aggregator = new ServerEventAggregator();

        this.aggregator.onBatchIsReady(() => {

            let event = new BatchContentServerEvent(<ContentServerEvent[]>this.aggregator.getEvents(), this.aggregator.getType());
            this.fireEvent(event);

            this.aggregator.resetEvents();
        });
    }

    protected onServerEvent(event: api.event.Event) {
        const isContentEvent = api.ObjectHelper.iFrameSafeInstanceOf(event, ContentServerEvent);
        if (isContentEvent) {
            this.aggregator.appendEvent(<ContentServerEvent>event);
        } else {
            this.fireEvent(event);
        }
    }
}
