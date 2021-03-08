import {Event} from 'lib-admin-ui/event/Event';
import {BatchContentServerEvent} from './BatchContentServerEvent';
import {ServerEventAggregator} from './ServerEventAggregator';
import {ServerEventsListener} from 'lib-admin-ui/event/ServerEventsListener';
import {Application} from 'lib-admin-ui/app/Application';
import {ObjectHelper} from 'lib-admin-ui/ObjectHelper';
import {ProjectContext} from '../project/ProjectContext';
import {ContentServerEventsTranslator} from './ContentServerEventsTranslator';
import {ContentServerEvent} from './ContentServerEvent';
import {ContentServerChangeItem} from './ContentServerChangeItem';
import {RepositoryId} from '../repository/RepositoryId';
import {IssueServerEvent} from './IssueServerEvent';
import {NodeServerEvent} from 'lib-admin-ui/event/NodeServerEvent';

export class AggregatedServerEventsListener
    extends ServerEventsListener {

    private aggregator: ServerEventAggregator;

    constructor(applications: Application[]) {
        super(applications);

        this.aggregator = new ServerEventAggregator();

        this.aggregator.onBatchIsReady(() => {
            const event: BatchContentServerEvent =
                new BatchContentServerEvent(<ContentServerEvent[]>this.aggregator.getEvents(), this.aggregator.getType());
            this.fireEvent(event);

            this.aggregator.resetEvents();
        });

        this.setServerEventsTranslator(new ContentServerEventsTranslator());
    }

    protected onServerEvent(event: Event) {
        if (this.isContentEvent(event)) {
            this.handleContentServerEvent(<ContentServerEvent>event);
            return;
        }

        if (this.isIssueEvent(event)) {
            this.handleIssueServerEvent(<IssueServerEvent>event);
            return;
        }

        this.fireEvent(event);
    }

    private isContentEvent(event: Event): boolean {
        return ObjectHelper.iFrameSafeInstanceOf(event, ContentServerEvent);
    }

    private handleContentServerEvent(contentEvent: ContentServerEvent) {
        this.aggregator.appendEvent(contentEvent);
    }

    private isInCurrentProject(event: NodeServerEvent): boolean {
        if (!ProjectContext.get().isInitialized()) {
            return false;
        }

        const currentRepo: string = RepositoryId.fromCurrentProject().toString();

        return event.getNodeChange().getChangeItems().some((change: ContentServerChangeItem) => change.getRepo() === currentRepo);
    }

    private isIssueEvent(event: Event): boolean {
        return ObjectHelper.iFrameSafeInstanceOf(event, IssueServerEvent);
    }

    private handleIssueServerEvent(issueEvent: IssueServerEvent) {
        if (this.isInCurrentProject(issueEvent)) {
            this.fireEvent(issueEvent);
        }
    }
}
