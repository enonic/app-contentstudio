import '../api.ts';
import {ViewContentEvent} from './browse/ViewContentEvent';
import {ContentBrowsePanel} from './browse/ContentBrowsePanel';
import {NewContentEvent} from './create/NewContentEvent';
import {GetIssueRequest} from './issue/resource/GetIssueRequest';
import {Issue} from './issue/Issue';
import {IssueDialogsManager} from './issue/IssueDialogsManager';
import ContentSummaryAndCompareStatus = api.content.ContentSummaryAndCompareStatus;
import Content = api.content.Content;
import ContentId = api.content.ContentId;
import ShowBrowsePanelEvent = api.app.ShowBrowsePanelEvent;
import AppPanel = api.app.AppPanel;

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

        switch (action) {
        case 'edit':
            if (id) {
                api.content.resource.ContentSummaryAndCompareStatusFetcher.fetch(new ContentId(id)).done(
                    (content: ContentSummaryAndCompareStatus) => {
                        new api.content.event.EditContentEvent([content]).fire();
                    });
            }
            break;
        case 'view' :
            if (id) {
                api.content.resource.ContentSummaryAndCompareStatusFetcher.fetch(new ContentId(id)).done(
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
            let content: Content = newContentEvent.getParentContent();
            if (!!content) { // refresh site's node
                this.browsePanel.getTreeGrid().refreshNodeById(content.getId());
            }
        }
    }

}
