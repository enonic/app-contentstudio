import {AppContainer} from './AppContainer';
import {ContentAppPanel} from './ContentAppPanel';
import {ToggleSearchPanelWithDependenciesGlobalEvent} from './browse/ToggleSearchPanelWithDependenciesGlobalEvent';
import {ToggleSearchPanelWithDependenciesEvent} from './browse/ToggleSearchPanelWithDependenciesEvent';
import {ProjectContext} from './project/ProjectContext';
import {UrlAction} from './UrlAction';
import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';
import {ContentSummaryAndCompareStatusFetcher} from './resource/ContentSummaryAndCompareStatusFetcher';
import {ContentId} from './content/ContentId';
import {ContentSummaryAndCompareStatus} from './content/ContentSummaryAndCompareStatus';
import {EditContentEvent} from './event/EditContentEvent';
import {GetIssueRequest} from './issue/resource/GetIssueRequest';
import {Issue} from './issue/Issue';
import {IssueDialogsManager} from './issue/IssueDialogsManager';
import {Path} from '@enonic/lib-admin-ui/rest/Path';
import {ResolveDependenciesRequest} from './resource/ResolveDependenciesRequest';
import {ResolveDependenciesResult} from './resource/ResolveDependenciesResult';
import {ResolveDependencyResult} from './resource/ResolveDependencyResult';
import {showFeedback} from '@enonic/lib-admin-ui/notify/MessageBus';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {Store} from '@enonic/lib-admin-ui/store/Store';
import {Branch} from './versioning/Branch';
import {BrowseAppBarElement} from '../v6/features/views/browse/layout/BrowseAppBar';
import {$contentTreeRootLoadingState} from '../v6/features/store/contentTreeLoadingStore';

export class ContentAppContainer
    extends AppContainer {

    private resolveDependenciesRequest: ResolveDependenciesRequest;
    private issueRequest: GetIssueRequest;

    constructor() {
        super();
    }

    protected createAppPanel(): ContentAppPanel {
        return new ContentAppPanel();
    }

    protected initListeners() {
        super.initListeners();

        this.initSearchPanelListener(this.appPanel as ContentAppPanel);

        ProjectContext.get().onNoProjectsAvailable(() => {
           this.handleNoProjectsAvailable();
        });

        this.onShown(() => {
            this.route(Store.instance().get('application').getPath());
        });
    }

    private handleNoProjectsAvailable() {
        BrowseAppBarElement.getInstance().disable();
    }

    private initSearchPanelListener(panel: ContentAppPanel) {
        ToggleSearchPanelWithDependenciesGlobalEvent.on((event) => {
            new ToggleSearchPanelWithDependenciesEvent({item: event.getContent(), inbound: event.isInbound()}).fire();
        });
    }

    private route(path?: Path) {
        const action = path ? path.getElement(1) : null;
        const actionAsTabMode: UrlAction = !!action ? UrlAction[action.toUpperCase()] : null;
        const id = path ? path.getElement(2) : null;

        switch (actionAsTabMode) {
        case UrlAction.EDIT:
            this.handleEditUrl(path);
            break;
        case UrlAction.ISSUE:
            this.handleIssueUrl(path);
            break;
        case UrlAction.INBOUND:
            this.handleInboundDependencies(path);
            break;
        case UrlAction.OUTBOUND:
            this.handleOutboundDependencies(path);
            break;
        }
    }

    private handleEditUrl(path?: Path): void {
        const id = path ? path.getElement(2) : null;

        if (id) {
            new ContentSummaryAndCompareStatusFetcher().fetch(new ContentId(id)).done(
                (content: ContentSummaryAndCompareStatus) => {
                    new EditContentEvent([content]).fire();
                });
        }
    }

    private handleIssueUrl(path?: Path): void {
        const id = path ? path.getElement(2) : null;

        if (id) {
            if (!!this.issueRequest) {
                return;
            }
            this.issueRequest = new GetIssueRequest(id);
            this.issueRequest.sendAndParse().then(
                (issue: Issue) => {
                    IssueDialogsManager.get().openDetailsDialogWithListDialog(issue);
                    this.issueRequest = null;
                });
        }
    }

    private handleInboundDependencies(path: Path): void {
        this.handleDependencies(path, true);
    }

    private handleOutboundDependencies(path: Path): void {
        this.handleDependencies(path, false);
    }

    private handleDependencies(path: Path, inbound: boolean): void {
        const branchString = path.getElement(2);
        const branch = Branch[branchString?.toUpperCase()] || Branch.DRAFT;
        const id = path.getElement(3);
        const type = path.getElement(4);

        const unsubscribe = $contentTreeRootLoadingState.listen((state) => {
            if (state !== 'ok') return;
            unsubscribe();
            this.doHandleDependencies(id, inbound, branch, type);
        });    
    }

    private doHandleDependencies(id: string, inbound: boolean, target: Branch, type?: string) {
        if (this.resolveDependenciesRequest) {
            return;
        }

        const contentId: ContentId = new ContentId(id);

        this.resolveDependenciesRequest = new ResolveDependenciesRequest([contentId]).setTarget(target);

        this.resolveDependenciesRequest.sendAndParse().then((result: ResolveDependenciesResult) => {
            const dependencyEntry: ResolveDependencyResult = result.getDependencies()[0];

            const hasDependencies: boolean = inbound
                                             ? dependencyEntry.getDependency().inbound.length > 0
                                             : dependencyEntry.getDependency().outbound.length > 0;

            if (hasDependencies) {
                this.toggleSearchPanelWithDependencies(id, inbound, target, type);
            } else {
                showFeedback(i18n('notify.dependencies.absent', id));
            }
        })
        .catch(reason => DefaultErrorHandler.handle(reason))
        .finally(() => this.resolveDependenciesRequest = null);
    }

    private toggleSearchPanelWithDependencies(id: string, inbound: boolean, target: Branch, type?: string) {
        new ContentSummaryAndCompareStatusFetcher().fetch(new ContentId(id)).done(
            (content: ContentSummaryAndCompareStatus) => {
                new ToggleSearchPanelWithDependenciesEvent({
                    item: content.getContentSummary(),
                    inbound: inbound,
                    branch: target,
                    type: type
                }).fire();
            });
    }

}
