import {AppContainer} from './AppContainer';
import {ContentAppBar} from './bar/ContentAppBar';
import {ContentAppPanel} from './ContentAppPanel';
import {ToggleSearchPanelWithDependenciesGlobalEvent} from './browse/ToggleSearchPanelWithDependenciesGlobalEvent';
import {ToggleSearchPanelWithDependenciesEvent} from './browse/ToggleSearchPanelWithDependenciesEvent';
import {ContentEventsListener} from './ContentEventsListener';
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
import {ContentTreeGridLoadedEvent} from './browse/ContentTreeGridLoadedEvent';
import {ResolveDependenciesRequest} from './resource/ResolveDependenciesRequest';
import {ResolveDependenciesResult} from './resource/ResolveDependenciesResult';
import {ResolveDependencyResult} from './resource/ResolveDependencyResult';
import {showFeedback} from '@enonic/lib-admin-ui/notify/MessageBus';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {Store} from '@enonic/lib-admin-ui/store/Store';

export class ContentAppContainer
    extends AppContainer {

    private resolveDependenciesRequest: ResolveDependenciesRequest;
    private issueRequest: GetIssueRequest;

    constructor() {
        super();

        new ContentEventsListener().start();
    }

    protected createAppPanel(): ContentAppPanel {
        return new ContentAppPanel();
    }

    protected initListeners() {
        super.initListeners();

        this.initSearchPanelListener(<ContentAppPanel>this.appPanel);

        ProjectContext.get().onNoProjectsAvailable(() => {
           this.handleNoProjectsAvailable();
        });

        this.onShown(() => {
            this.route(Store.instance().get('application').getPath());
        });
    }

    private handleNoProjectsAvailable() {
        ContentAppBar.getInstance().disable();
    }

    private initSearchPanelListener(panel: ContentAppPanel) {
        ToggleSearchPanelWithDependenciesGlobalEvent.on((event) => {
            if (!panel.getBrowsePanel().getTreeGrid().isEmpty()) {
                new ToggleSearchPanelWithDependenciesEvent(event.getContent(), event.isInbound()).fire();
            } else {
                const handler = () => {
                    new ToggleSearchPanelWithDependenciesEvent(event.getContent(), event.isInbound()).fire();
                    panel.getBrowsePanel().getTreeGrid().unLoaded(handler);
                };

                panel.getBrowsePanel().getTreeGrid().onLoaded(handler);
            }
        });
    }

    private route(path?: Path) {
        const action = path ? path.getElement(1) : null;
        const actionAsTabMode: UrlAction = !!action ? UrlAction[action.toUpperCase()] : null;
        const id = path ? path.getElement(2) : null;
        const type = path ? path.getElement(3) : null;

        switch (actionAsTabMode) {
        case UrlAction.LOCALIZE:
        case UrlAction.EDIT:
            if (id) {
                new ContentSummaryAndCompareStatusFetcher().fetch(new ContentId(id)).done(
                    (content: ContentSummaryAndCompareStatus) => {
                        new EditContentEvent([content]).fire();
                    });
            }
            break;
        case UrlAction.ISSUE:
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
            break;
        case UrlAction.INBOUND:
            this.handleDependencies(id, true, type);
            break;
        case UrlAction.OUTBOUND:
            this.handleDependencies(id, false, type);
            break;
        }
    }

    private handleDependencies(id: string, inbound: boolean, type?: string) {
        const treeGridLoadedListener = () => {
            this.doHandleDependencies(id, inbound, type);

            ContentTreeGridLoadedEvent.un(treeGridLoadedListener);
        };

        ContentTreeGridLoadedEvent.on(treeGridLoadedListener);
    }

    private doHandleDependencies(id: string, inbound: boolean, type?: string) {
        if (this.resolveDependenciesRequest) {
            return;
        }

        const contentId: ContentId = new ContentId(id);

        this.resolveDependenciesRequest = new ResolveDependenciesRequest([contentId]);

        this.resolveDependenciesRequest.sendAndParse().then((result: ResolveDependenciesResult) => {
            const dependencyEntry: ResolveDependencyResult = result.getDependencies()[0];

            const hasDependencies: boolean = inbound
                                             ? dependencyEntry.getDependency().inbound.length > 0
                                             : dependencyEntry.getDependency().outbound.length > 0;

            if (hasDependencies) {
                this.toggleSearchPanelWithDependencies(id, inbound, type);
            } else {
                showFeedback(i18n('notify.dependencies.absent', id));
            }
        })
        .catch(reason => DefaultErrorHandler.handle(reason))
        .finally(() => this.resolveDependenciesRequest = null);
    }

    private toggleSearchPanelWithDependencies(id: string, inbound: boolean, type?: string) {
        new ContentSummaryAndCompareStatusFetcher().fetch(new ContentId(id)).done(
            (content: ContentSummaryAndCompareStatus) => {
                new ToggleSearchPanelWithDependenciesEvent(content.getContentSummary(), inbound, type).fire();
            });
    }

}
