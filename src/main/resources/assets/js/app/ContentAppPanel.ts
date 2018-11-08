import {ViewContentEvent} from './browse/ViewContentEvent';
import {ContentBrowsePanel} from './browse/ContentBrowsePanel';
import {NewContentEvent} from './create/NewContentEvent';
import {GetIssueRequest} from './issue/resource/GetIssueRequest';
import {Issue} from './issue/Issue';
import {IssueDialogsManager} from './issue/IssueDialogsManager';
import {ToggleSearchPanelWithDependenciesEvent} from './browse/ToggleSearchPanelWithDependenciesEvent';
import {Router} from './Router';
import {ContentTreeGridLoadedEvent} from './browse/ContentTreeGridLoadedEvent';
import {ContentSummaryAndCompareStatusFetcher} from './resource/ContentSummaryAndCompareStatusFetcher';
import {EditContentEvent} from './event/EditContentEvent';
import {Content} from './content/Content';
import {ContentSummaryAndCompareStatus} from './content/ContentSummaryAndCompareStatus';
import {ResolveDependenciesRequest} from './resource/ResolveDependenciesRequest';
import {ResolveDependenciesResult} from './resource/ResolveDependenciesResult';
import {ResolveDependencyResult} from './resource/ResolveDependencyResult';
import ContentId = api.content.ContentId;
import ShowBrowsePanelEvent = api.app.ShowBrowsePanelEvent;
import AppPanel = api.app.AppPanel;
import i18n = api.util.i18n;

export class ContentAppPanel
    extends AppPanel<ContentSummaryAndCompareStatus> {

    private path: api.rest.Path;

    constructor(path?: api.rest.Path) {
        super();
        this.path = path;
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered) => {
            this.route(this.path);
            return rendered;
        });
    }

    private route(path?: api.rest.Path) {
        const action = path ? path.getElement(0) : null;
        const id = path ? path.getElement(1) : null;
        const type = path ? path.getElement(2) : null;

        switch (action) {
        case 'edit':
            if (id) {
                ContentSummaryAndCompareStatusFetcher.fetch(new ContentId(id)).done(
                    (content: ContentSummaryAndCompareStatus) => {
                        new EditContentEvent([content]).fire();
                    });
            }
            break;
        case 'view' :
            if (id) {
                ContentSummaryAndCompareStatusFetcher.fetch(new ContentId(id)).done(
                    (content: ContentSummaryAndCompareStatus) => {
                        new ViewContentEvent([content]).fire();
                    });
            }
            break;
        case 'issue' :
            new ShowBrowsePanelEvent().fire();
            if (id) {
                new GetIssueRequest(id).sendAndParse().then(
                    (issue: Issue) => {
                        IssueDialogsManager.get().openDetailsDialog(issue);
                    });
            }
            break;
        case 'inbound' :
            this.handleDependencies(id, true, type);
            break;
        case 'outbound' :
            this.handleDependencies(id, false, type);
            break;
        default:
            new ShowBrowsePanelEvent().fire();
            break;
        }
    }

    protected handleGlobalEvents() {
        super.handleGlobalEvents();

        NewContentEvent.on((newContentEvent) => {
            this.handleNew(newContentEvent);
        });
    }

    protected createBrowsePanel() {
        return new ContentBrowsePanel();
    }

    getBrowsePanel(): ContentBrowsePanel {
        return <ContentBrowsePanel>this.browsePanel;
    }

    private handleNew(newContentEvent: NewContentEvent) {
        if (newContentEvent.getContentType().isSite() && this.browsePanel) {
            const content: Content = newContentEvent.getParentContent();
            if (!!content) { // refresh site's node
                this.browsePanel.getTreeGrid().refreshNodeById(content.getId());
            }
        }
    }

    protected resolveActions(panel: api.ui.panel.Panel): api.ui.Action[] {
        const actions = super.resolveActions(panel);
        return [...actions, ...this.getBrowsePanel().getNonToolbarActions()];
    }

    private handleDependencies(id: string, inbound: boolean, type?: string) {
        const treeGridLoadedListener = () => {
            this.doHandleDependencies(id, inbound, type);

            ContentTreeGridLoadedEvent.un(treeGridLoadedListener);
        };

        ContentTreeGridLoadedEvent.on(treeGridLoadedListener);

        new ShowBrowsePanelEvent().fire();
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
                api.notify.showFeedback(i18n('notify.dependencies.absent', id));
            }
        }).catch(reason => api.DefaultErrorHandler.handle(reason));
    }

    private toggleSearchPanelWithDependencies(id: string, inbound: boolean, type?: string) {
        ContentSummaryAndCompareStatusFetcher.fetch(new ContentId(id)).done(
            (content: ContentSummaryAndCompareStatus) => {
                new ToggleSearchPanelWithDependenciesEvent(content.getContentSummary(), inbound, type).fire();

                const mode: string = inbound ? 'inbound' : 'outbound';
                const hash: string = !!type ? `${mode}/${id}/${type}` : `${mode}/${id}`;

                Router.setHash(hash);
            });
    }
}
