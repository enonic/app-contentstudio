import {Event} from '@enonic/lib-admin-ui/event/Event';
import {BatchContentServerEvent} from './BatchContentServerEvent';
import {ServerEventAggregator} from './ServerEventAggregator';
import {ServerEventsListener} from '@enonic/lib-admin-ui/event/ServerEventsListener';
import {Application} from '@enonic/lib-admin-ui/app/Application';
import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';
import {ProjectContext} from '../project/ProjectContext';
import {ContentServerEventsTranslator} from './ContentServerEventsTranslator';
import {ContentServerEvent} from './ContentServerEvent';
import {ContentServerChangeItem} from './ContentServerChangeItem';
import {RepositoryId} from '../repository/RepositoryId';
import {IssueServerEvent} from './IssueServerEvent';
import {NodeServerEvent} from '@enonic/lib-admin-ui/event/NodeServerEvent';
import {ArchiveServerEvent} from './ArchiveServerEvent';
import {NodeServerChangeType} from '@enonic/lib-admin-ui/event/NodeServerChange';
import {CollaborationServerEvent} from './CollaborationServerEvent';

export class AggregatedServerEventsListener
    extends ServerEventsListener {

    private aggregator: ServerEventAggregator;

    constructor(applications: Application[], eventApiUrl: string) {
        super(applications, eventApiUrl);

        this.aggregator = new ServerEventAggregator();

        this.aggregator.onBatchIsReady((items: ContentServerChangeItem[], type: NodeServerChangeType) => {
            const event: BatchContentServerEvent = new BatchContentServerEvent(items, type);
            this.fireEvent(event);
        });

        this.setServerEventsTranslator(new ContentServerEventsTranslator());
    }

    protected onServerEvent(event: Event) {
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
