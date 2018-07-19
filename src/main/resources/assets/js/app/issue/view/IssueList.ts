import {Issue} from '../Issue';
import {IssueResponse} from '../resource/IssueResponse';
import {IssueStatusInfoGenerator} from './IssueStatusInfoGenerator';
import {IssueStatus} from '../IssueStatus';
import {ListIssuesRequest} from '../resource/ListIssuesRequest';
import {IssueWithAssignees} from '../IssueWithAssignees';
import ListBox = api.ui.selector.list.ListBox;
import User = api.security.User;
import PEl = api.dom.PEl;
import SpanEl = api.dom.SpanEl;
import PrincipalViewerCompact = api.ui.security.PrincipalViewerCompact;
import DivEl = api.dom.DivEl;
import Tooltip = api.ui.Tooltip;
import Element = api.dom.Element;
import i18n = api.util.i18n;
import LoadMask = api.ui.mask.LoadMask;

export class IssueList
    extends ListBox<IssueWithAssignees> {

    private issueStatus: IssueStatus;

    private totalItems: number;

    private currentUser: User;

    private loadAssignedToMe: boolean = false;

    private loadMyIssues: boolean = false;

    private loadMask: LoadMask;

    private issueSelectedListeners: { (issue: IssueWithAssignees): void }[] = [];

    private issuesLoadedListeners: { (): void }[] = [];

    constructor(issueStatus: IssueStatus) {
        super('issue-list');
        this.issueStatus = issueStatus;
        this.loadCurrentUser();
        this.setupLazyLoading();
    }

    public reload(): wemQ.Promise<void> {
        return this.fetchItems();
    }

    public setLoadMask(loadMask: LoadMask) {
        this.loadMask = loadMask;
    }

    setLoadMyIssues(value: boolean) {
        this.loadMyIssues = value;
    }

    setLoadAssignedToMe(value: boolean) {
        this.loadAssignedToMe = value;
    }

    private fetchItems(append?: boolean): wemQ.Promise<void> {
        if (this.loadMask) {
            this.loadMask.show();
        }
        return new ListIssuesRequest()
            .setIssueStatus(this.issueStatus)
            .setAssignedToMe(this.loadAssignedToMe)
            .setCreatedByMe(this.loadMyIssues)
            .setResolveAssignees(true)
            .setFrom(append ? this.getItemCount() : 0)
            .setSize(20)
            .sendAndParse()
            .then((response: IssueResponse) => {

                this.totalItems = response.getMetadata().getTotalHits();
                const issues = response.getIssues();

                if (append) {
                    if (issues.length > 0) {
                        this.addItems(issues);
                    }
                } else {
                    if (issues.length > 0) {
                        this.setItems(issues);
                    } else {
                        this.clearItems();
                        this.appendChild(new PEl('no-issues-message').setHtml(i18n('dialog.issue.noIssuesFound')));
                    }
                }
            })
            .catch(api.DefaultErrorHandler.handle)
            .finally(() => {
                this.notifyIssuesLoaded();
                if (this.loadMask) {
                    this.loadMask.hide();
                }
            });
    }

    private loadCurrentUser() {
        return new api.security.auth.IsAuthenticatedRequest().sendAndParse().then((loginResult) => {
            this.currentUser = loginResult.getUser();
        });
    }

    private setupLazyLoading() {
        const scrollHandler: Function = api.util.AppHelper.debounce(this.handleScroll.bind(this), 100, false);

        this.onScrolled(() => {
            scrollHandler();
        });

        this.onScroll(() => {
            scrollHandler();
        });
    }

    private handleScroll() {
        if (this.isScrolledToBottom() && !this.isAllItemsLoaded()) {
            this.fetchItems(true);
        }
    }

    protected createItemView(issueWithAssignees: IssueWithAssignees): api.dom.Element {

        const itemEl = new IssueListItem(issueWithAssignees, this.currentUser);

        itemEl.onClicked(() => this.notifyIssueSelected(issueWithAssignees));

        return itemEl;
    }

    protected getItemId(issueWithAssignees: IssueWithAssignees): string {
        return issueWithAssignees.getIssue().getId();
    }

    private notifyIssueSelected(issue: IssueWithAssignees) {
        this.issueSelectedListeners.forEach(listener => listener(issue));
    }

    public onIssueSelected(listener: (issue: IssueWithAssignees) => void) {
        this.issueSelectedListeners.push(listener);
    }

    public unIssueSelected(listener: (issue: IssueWithAssignees) => void) {
        this.issueSelectedListeners = this.issueSelectedListeners.filter(curr => curr !== listener);
    }

    private notifyIssuesLoaded() {
        this.issuesLoadedListeners.forEach(listener => listener());
    }

    public onIssuesLoaded(listener: () => void) {
        this.issuesLoadedListeners.push(listener);
    }

    private isScrolledToBottom(): boolean {
        let element = this.getHTMLElement();
        return (element.scrollHeight - element.scrollTop - 50) <= element.clientHeight; // 50px before bottom to start loading earlier
    }

    private isAllItemsLoaded(): boolean {
        return this.getItemCount() >= this.totalItems;
    }
}

export class IssueListItem
    extends api.dom.LiEl {

    private issue: Issue;

    private assignees: User[];

    private currentUser: User;

    constructor(issueWithAssignees: IssueWithAssignees, currentUser: User) {
        super('issue-list-item');

        this.issue = issueWithAssignees.getIssue();

        this.assignees = issueWithAssignees.getAssignees();

        this.currentUser = currentUser;
    }

    public getIssue(): Issue {
        return this.issue;
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered) => {
            this.getEl().setTabIndex(0);

            const namesAndIconView = new api.app.NamesAndIconViewBuilder().setSize(api.app.NamesAndIconViewSize.small).build();
            namesAndIconView
                .setMainName(this.issue.getTitleWithId())
                .setIconClass(this.issue.getIssueStatus() === IssueStatus.CLOSED ? 'icon-signup closed' : 'icon-signup')
                .setSubNameElements([new SpanEl().setHtml(this.makeSubName(), false)]);

            if (this.issue.getDescription().length) {
                new Tooltip(namesAndIconView, this.issue.getDescription(), 200).setMode(Tooltip.MODE_GLOBAL_STATIC);
            }

            this.appendChild(namesAndIconView);
            this.appendChild(new AssigneesLine(this.assignees, this.currentUser));

            return rendered;
        });
    }

    private makeSubName(): string {
        return IssueStatusInfoGenerator.create().setIssue(this.issue).setIssueStatus(this.issue.getIssueStatus()).setCurrentUser(
            this.currentUser).generate();
    }
}

export class AssigneesLine
    extends DivEl {

    private assignees: User[];

    private currentUser: User;

    private limitToShow: number = 2;

    constructor(assignees: User[], currentUser?: User) {
        super('assignees-line');

        this.assignees = assignees;
        this.currentUser = currentUser;
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered) => {
            this.removeChildren();
            if (this.assignees.length > this.limitToShow) {
                for (let i = 0; i < this.limitToShow; i++) {
                    this.appendChild(this.createPrincipalViewer(this.assignees[i]));
                }
                this.appendChild(this.createElemWithAssigneesAsTooltip());
            } else {
                this.assignees.forEach((assignee: User) => {
                    this.appendChild(this.createPrincipalViewer(assignee));
                });
            }

            return rendered;
        });
    }

    setAssignees(value: api.security.User[]) {
        this.assignees = value;
        this.doRender();
    }

    private createPrincipalViewer(assignee: User): PrincipalViewerCompact {
        const principalViewer: PrincipalViewerCompact = new PrincipalViewerCompact();
        principalViewer.setObject(assignee);
        principalViewer.setCurrentUser(this.currentUser);

        return principalViewer;
    }

    private createElemWithAssigneesAsTooltip(): Element {
        const span: SpanEl = new SpanEl('all-assignees-tooltip');
        span.setHtml('...');
        new Tooltip(span, this.assignees.map(user => user.getDisplayName())
            .join('\n'), 200)
            .setMode(Tooltip.MODE_GLOBAL_STATIC);

        return span;
    }
}
