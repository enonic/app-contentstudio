import {Issue} from '../Issue';
import {IssueResponse} from '../resource/IssueResponse';
import {IssueStatusInfoGenerator} from './IssueStatusInfoGenerator';
import {IssueStatus, IssueStatusFormatter} from '../IssueStatus';
import {ListIssuesRequest} from '../resource/ListIssuesRequest';
import {IssueWithAssignees} from '../IssueWithAssignees';
import ListBox = api.ui.selector.list.ListBox;
import Principal = api.security.Principal;
import PEl = api.dom.PEl;
import SpanEl = api.dom.SpanEl;
import PrincipalViewerCompact = api.ui.security.PrincipalViewerCompact;
import DivEl = api.dom.DivEl;
import Tooltip = api.ui.Tooltip;
import Element = api.dom.Element;
import i18n = api.util.i18n;
import LoadMask = api.ui.mask.LoadMask;
import NamesAndIconView = api.app.NamesAndIconView;
import NamesAndIconViewBuilder = api.app.NamesAndIconViewBuilder;
import NamesAndIconViewSize = api.app.NamesAndIconViewSize;

export class IssueList
    extends ListBox<IssueWithAssignees> {

    private static MAX_VISIBLE_OPTIONS: number = 15;

    private issueStatus: IssueStatus;

    private currentUser: Principal;

    private loadAssignedToMe: boolean = false;

    private loadMyIssues: boolean = false;

    private allIssues: IssueWithAssignees[];

    private totalItems: number;

    private currentTotal: number;

    private loadMask: LoadMask;

    private issueSelectedListeners: { (issue: IssueWithAssignees): void }[] = [];

    private issuesLoadedListeners: { (): void }[] = [];

    constructor(issueStatus: IssueStatus) {
        super('issue-list');
        this.issueStatus = issueStatus;
        this.allIssues = [];
        this.currentTotal = 0;
        this.loadCurrentUser();
        this.setupLazyLoading();
    }

    getIssueStatus(): IssueStatus {
        return this.issueStatus;
    }

    setIssueStatus(issueStatus: IssueStatus) {
        this.issueStatus = issueStatus;
    }

    setLoadMask(loadMask: LoadMask) {
        this.loadMask = loadMask;
    }

    setLoadMyIssues(value: boolean) {
        this.loadMyIssues = value;
    }

    setLoadAssignedToMe(value: boolean) {
        this.loadAssignedToMe = value;
    }

    updateCurrentTotal(currentTotal: number): wemQ.Promise<void> {
        if (this.currentTotal !== currentTotal) {
            this.currentTotal = currentTotal;
            return this.fetchItems(true);
        }

        return wemQ(null);
    }

    updateTotalItems(totalItems: number): wemQ.Promise<void> {
        if (this.totalItems !== totalItems) {
            // Total items will be updated in the reload method
            return this.reload();
        }

        return wemQ(null);
    }

    filter() {
        const issues = this.doFilter();
        this.setItems(issues);
    }

    private doFilter(): IssueWithAssignees[] {
        const needToFilter = !(this.issueStatus == null && !this.loadMyIssues && !this.loadAssignedToMe);
        if (needToFilter) {
            return this.allIssues.filter((issueWithAssignee: IssueWithAssignees) => {
                const issue = issueWithAssignee.getIssue();
                const assignees = issueWithAssignee.getAssignees();

                const statusMatches = this.issueStatus == null || issue.getIssueStatus() === this.issueStatus;
                const assignedByMeMatched = !this.loadMyIssues || issue.getCreator() === this.currentUser.getKey().toString();
                const assignedToMeMatched = !this.loadAssignedToMe || assignees.some(assignee => assignee.equals(this.currentUser));
                return statusMatches && assignedToMeMatched && assignedByMeMatched;
            });
        } else {
            return this.allIssues.slice();
        }
    }

    reload(): wemQ.Promise<void> {
        return this.fetchItems();
    }

    private fetchItems(append?: boolean): wemQ.Promise<void> {
        const skipLoad = !this.filterAndCheckNeedToLoad();
        if (skipLoad) {
            return wemQ(null);
        }

        this.showLoadMask();

        return this.doFetch(append)
            .catch(api.DefaultErrorHandler.handle)
            .finally(() => {
                this.notifyIssuesLoaded();
                this.hideLoadMask();
            });
    }

    private doFetch(append?: boolean): wemQ.Promise<void> {
        return new ListIssuesRequest()
            .setResolveAssignees(true)
            .setFrom(append ? this.allIssues.length : 0)
            .setSize(IssueList.MAX_VISIBLE_OPTIONS)
            .sendAndParse()
            .then((response: IssueResponse) => {
                const totalHits = response.getMetadata().getTotalHits();
                const issuesCountChanged = totalHits !== this.totalItems;

                const issues = response.getIssues();

                if (append && !issuesCountChanged) {
                    if (issues.length > 0) {
                        this.allIssues = this.allIssues.concat(issues);
                        this.filter();
                    }
                } else {
                    this.totalItems = totalHits;
                    if (issues.length > 0) {
                        this.allIssues = issues;
                        this.filter();
                    } else {
                        this.allIssues = [];
                        this.clearItems();
                        const noIssuesEl = new PEl('no-issues-message').setHtml(i18n('dialog.issue.noIssuesFound'));
                        this.appendChild(noIssuesEl);
                    }
                }

                const loadMore = this.needToLoad() && this.getItemCount() <= IssueList.MAX_VISIBLE_OPTIONS;

                if (loadMore) {
                    return this.doFetch(true);
                }
            });
    }

    private needToLoad(): boolean {
        return this.currentTotal > this.allIssues.length;
    }

    private filterAndCheckNeedToLoad(): boolean {
        this.filter();
        return this.needToLoad();
    }

    private showLoadMask() {
        if (this.loadMask) {
            this.loadMask.show();
        }
    }

    private hideLoadMask() {
        if (this.loadMask) {
            this.loadMask.hide();
        }
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
        if (this.isScrolledToBottom()) {
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
}

export class IssueListItem
    extends api.dom.LiEl {

    private issue: Issue;

    private assignees: Principal[];

    private currentUser: Principal;

    constructor(issueWithAssignees: IssueWithAssignees, currentUser: Principal) {
        super('issue-list-item');

        this.issue = issueWithAssignees.getIssue();

        this.assignees = issueWithAssignees.getAssignees();

        this.currentUser = currentUser;
    }

    private createNamesAndIconView(): NamesAndIconView {
        const namesAndIconView = new NamesAndIconViewBuilder().setSize(NamesAndIconViewSize.small).build()
            .setMainName(this.issue.getTitleWithId())
            .setIconClass(this.issue.getIssueStatus() === IssueStatus.CLOSED ? 'icon-issue closed' : 'icon-issue')
            .setSubNameElements([new SpanEl().setHtml(this.makeSubName(), false)]);

        if (this.issue.getDescription().length) {
            new Tooltip(namesAndIconView, this.issue.getDescription(), 200).setMode(Tooltip.MODE_GLOBAL_STATIC);
        }

        return namesAndIconView;
    }

    private createStatus(): DivEl {
        const statusEl = new DivEl('status');

        const issueStatus = this.issue.getIssueStatus();
        const status = IssueStatusFormatter.formatStatus(issueStatus);
        const statusClass = (issueStatus != null ? IssueStatus[issueStatus] : '').toLowerCase();

        statusEl.setHtml(status, true);
        statusEl.addClass(statusClass);

        return statusEl;
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered) => {
            this.getEl().setTabIndex(0);

            const namesAndIconView = this.createNamesAndIconView();
            const status = this.createStatus();

            this.appendChild(namesAndIconView);
            this.appendChild(status);
            // Removed, till the AssigneesLine is refactored
            // this.appendChild(new AssigneesLine(this.assignees, this.currentUser));

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

    private assignees: Principal[];

    private currentUser: Principal;

    private limitToShow: number = 2;

    constructor(assignees: Principal[], currentUser?: Principal) {
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
                this.assignees.forEach((assignee: Principal) => {
                    this.appendChild(this.createPrincipalViewer(assignee));
                });
            }

            return rendered;
        });
    }

    setAssignees(value: Principal[]) {
        this.assignees = value;
        this.doRender();
    }

    private createPrincipalViewer(assignee: Principal): PrincipalViewerCompact {
        const principalViewer: PrincipalViewerCompact = new PrincipalViewerCompact();
        principalViewer.setObject(assignee);
        principalViewer.setCurrentUser(this.currentUser);

        return principalViewer;
    }

    private createElemWithAssigneesAsTooltip(): Element {
        const span: SpanEl = new SpanEl('all-assignees-tooltip');
        span.setHtml('…');
        new Tooltip(span, this.assignees.map(user => user.getDisplayName())
            .join('\n'), 200)
            .setMode(Tooltip.MODE_GLOBAL_STATIC);

        return span;
    }
}
