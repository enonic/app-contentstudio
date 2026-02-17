import {type Application} from '@enonic/lib-admin-ui/app/Application';
import {type Event} from '@enonic/lib-admin-ui/event/Event';
import {type NodeServerChangeType} from '@enonic/lib-admin-ui/event/NodeServerChange';
import {type NodeServerEvent} from '@enonic/lib-admin-ui/event/NodeServerEvent';
import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';
import {RepositoryId} from '../repository/RepositoryId';
import {ArchiveServerEvent} from './ArchiveServerEvent';
import {BatchContentServerEvent} from './BatchContentServerEvent';
import {type ContentServerChangeItem} from './ContentServerChangeItem';
import {ContentServerEvent} from './ContentServerEvent';
import {ContentServerEventsTranslator} from './ContentServerEventsTranslator';
import {IssueServerEvent} from './IssueServerEvent';
import {ServerEventAggregator} from './ServerEventAggregator';
import {WorkerServerEventsListener} from './WorkerServerEventsListener';

export class AggregatedServerEventsListener
    extends WorkerServerEventsListener {

    private aggregator: ServerEventAggregator;

    constructor(application: Application) {
        super([application], new ContentServerEventsTranslator());

        this.aggregator = new ServerEventAggregator();

        this.aggregator.onBatchIsReady((items: ContentServerChangeItem[], type: NodeServerChangeType) => {
            const event: BatchContentServerEvent = new BatchContentServerEvent(items, type);
            this.fireEvent(event);
        });
    }

    protected onServerEvent(event: Event): void {
        if (this.isArchiveEvent(event)) {
            this.handleArchiveEvent(event as ArchiveServerEvent);
            return;
        }

        if (this.isContentEvent(event)) {
            this.handleContentServerEvent(event as ContentServerEvent);
            return;
        }

        if (this.isIssueEvent(event)) {
            this.handleIssueServerEvent(event as IssueServerEvent);
            return;
        }

        this.fireEvent(event);
    }

    protected onUnknownServerEvent(): void {
        // ignore
    }

    private isArchiveEvent(event: Event): boolean {
        return ObjectHelper.iFrameSafeInstanceOf(event, ArchiveServerEvent);
    }

    private handleArchiveEvent(archiveEvent: ArchiveServerEvent) {
        if (this.isInCurrentProject(archiveEvent)) {
            this.fireEvent(archiveEvent);
        }
    }

    private isContentEvent(event: Event): boolean {
        return ObjectHelper.iFrameSafeInstanceOf(event, ContentServerEvent);
    }

    private handleContentServerEvent(contentEvent: ContentServerEvent) {
        this.aggregator.appendEvent(contentEvent);
    }

    private isInCurrentProject(event: NodeServerEvent): boolean {
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
