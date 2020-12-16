import * as Q from 'q';
import {i18n} from 'lib-admin-ui/util/Messages';
import {DefaultErrorHandler} from 'lib-admin-ui/DefaultErrorHandler';
import {ContentId} from 'lib-admin-ui/content/ContentId';
import {ContentBrowsePanel} from './browse/ContentBrowsePanel';
import {GetIssueRequest} from './issue/resource/GetIssueRequest';
import {Issue} from './issue/Issue';
import {IssueDialogsManager} from './issue/IssueDialogsManager';
import {ToggleSearchPanelWithDependenciesEvent} from './browse/ToggleSearchPanelWithDependenciesEvent';
import {Router} from './Router';
import {ContentTreeGridLoadedEvent} from './browse/ContentTreeGridLoadedEvent';
import {ContentSummaryAndCompareStatusFetcher} from './resource/ContentSummaryAndCompareStatusFetcher';
import {EditContentEvent} from './event/EditContentEvent';
import {ContentSummaryAndCompareStatus} from './content/ContentSummaryAndCompareStatus';
import {ResolveDependenciesRequest} from './resource/ResolveDependenciesRequest';
import {ResolveDependenciesResult} from './resource/ResolveDependenciesResult';
import {ResolveDependencyResult} from './resource/ResolveDependencyResult';
import {AppPanel} from 'lib-admin-ui/app/AppPanel';
import {Path} from 'lib-admin-ui/rest/Path';
import {Panel} from 'lib-admin-ui/ui/panel/Panel';
import {Action} from 'lib-admin-ui/ui/Action';
import {UrlAction} from './UrlAction';
import {showFeedback} from 'lib-admin-ui/notify/MessageBus';
import {AppContext} from './AppContext';
import {ProjectContext} from './project/ProjectContext';

export class ContentAppPanel
    extends AppPanel<ContentSummaryAndCompareStatus> {

    constructor(path?: Path) {
        super();

        if (ProjectContext.get().isInitialized() && AppContext.get().isMainMode()) {
            this.route(path);
        }
    }

    handleBrowse() {
        super.handleBrowse();
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered) => {

            return rendered;
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
                ContentSummaryAndCompareStatusFetcher.fetch(new ContentId(id)).done(
                    (content: ContentSummaryAndCompareStatus) => {
                        new EditContentEvent([content]).fire();
                    });
            }
            break;
        case UrlAction.ISSUE:
            if (id) {
                new GetIssueRequest(id).sendAndParse().then(
                    (issue: Issue) => {
                        IssueDialogsManager.get().openDetailsDialogWithListDialog(issue);
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

    protected createBrowsePanel() {
        return new ContentBrowsePanel();
    }

    getBrowsePanel(): ContentBrowsePanel {
        return <ContentBrowsePanel>this.browsePanel;
    }

    protected resolveActions(panel: Panel): Action[] {
        const actions = super.resolveActions(panel);
        return [...actions, ...this.getBrowsePanel().getNonToolbarActions()];
    }

    private handleDependencies(id: string, inbound: boolean, type?: string) {
        const treeGridLoadedListener = () => {
            this.doHandleDependencies(id, inbound, type);

            ContentTreeGridLoadedEvent.un(treeGridLoadedListener);
        };

        ContentTreeGridLoadedEvent.on(treeGridLoadedListener);
    }

    private doHandleDependencies(id: string, inbound: boolean, type?: string) {
        const contentId: ContentId = new ContentId(id);

        new ResolveDependenciesRequest([contentId]).sendAndParse().then((result: ResolveDependenciesResult) => {
            const dependencyEntry: ResolveDependencyResult = result.getDependencies()[0];

            const hasDependencies: boolean = inbound
                                             ? dependencyEntry.getDependency().inbound.length > 0
                                             : dependencyEntry.getDependency().outbound.length > 0;

            if (hasDependencies) {
                this.toggleSearchPanelWithDependencies(id, inbound, type);
            } else {
                showFeedback(i18n('notify.dependencies.absent', id));
            }
        }).catch(reason => DefaultErrorHandler.handle(reason));
    }

    private toggleSearchPanelWithDependencies(id: string, inbound: boolean, type?: string) {
        ContentSummaryAndCompareStatusFetcher.fetch(new ContentId(id)).done(
            (content: ContentSummaryAndCompareStatus) => {
                new ToggleSearchPanelWithDependenciesEvent(content.getContentSummary(), inbound, type).fire();

                const mode: string = inbound ? UrlAction.INBOUND : UrlAction.OUTBOUND;
                const hash: string = !!type ? `${mode}/${id}/${type}` : `${mode}/${id}`;

                Router.get().setHash(hash);
            });
    }

    protected activateCurrentKeyBindings(): void {
        if (ProjectContext.get().isInitialized()) {
            super.activateCurrentKeyBindings();
        } else {
            const projectSetHandler = () => {
                super.activateCurrentKeyBindings();
                ProjectContext.get().unProjectChanged(projectSetHandler);
            };
            ProjectContext.get().onProjectChanged(projectSetHandler);
        }
    }
}
