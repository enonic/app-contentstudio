import {Issue} from '../Issue';
import {IssueResponse} from '../resource/IssueResponse';
import {IssueStatusInfoGenerator} from './IssueStatusInfoGenerator';
import {IssueStatus, IssueStatusFormatter} from '../IssueStatus';
import {ListIssuesRequest} from '../resource/ListIssuesRequest';
import {IssueWithAssignees} from '../IssueWithAssignees';
import {IssuesStorage} from './IssuesStorage';
import {IssueType} from '../IssueType';
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

    private issueType: IssueType;

    private currentUser: Principal;

    private loadAssignedToMe: boolean = false;

    private loadMyIssues: boolean = false;

    private allIssuesStorage: IssuesStorage;

    private issuesOfType: number;

    private totalItems: number;

    private currentTotal: number;

    private loadMask: LoadMask;

    private issueSelectedListeners: { (issue: IssueWithAssignees): void }[] = [];

    private issuesLoadedListeners: { (): void }[] = [];

    constructor(storage: IssuesStorage, issueType?: IssueType) {
        super('issue-list');
        this.issueStatus = IssueStatus.OPEN;
        this.issueType = issueType;
        this.allIssuesStorage = storage;
        this.issuesOfType = 0;
        this.initListeners();
        this.loadCurrentUser();
        this.setupLazyLoading();
    }

    private initListeners() {
        this.allIssuesStorage.onIssuesUpdated(() => {
            const hasIssues = this.allIssuesStorage.hasIssues();

            if (hasIssues) {
                // Issues updated, so full check required, which may cause performance problems
                this.filter();
            } else {
                this.clearItems();
            }
            this.issuesOfType = this.countIssuesOfType();
        });
    }

    getIssueStatus(): IssueStatus {
        return this.issueStatus;
    }

    updateIssueStatus(issueStatus: IssueStatus) {
        this.issueStatus = issueStatus;
        this.issuesOfType = this.countIssuesOfType();
        this.filterIfChanged();
    }

    hasIssueType(): boolean {
        return this.issueType != null;
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
            return this.filterAndFetchItems(true);
        }

        return wemQ(null);
    }

    updateTotalItems(totalItems: number): wemQ.Promise<void> {
        if (this.totalItems !== totalItems) {
            this.totalItems = totalItems;
            return this.filterAndFetchItems();
        }

        return wemQ(null);
    }

    filter() {
        const issues = this.doFilter();
        this.setItems(issues);
    }

    filterIfChanged() {
        const issues = this.doFilter();
        const items = this.getItems();
        const wasChanged = issues.length !== this.getItemCount() || issues.some((issue, index) => {
            return issue.getIssue().getId() !== items[index].getIssue().getId();
        });
        if (wasChanged) {
            this.setItems(issues);
        }
    }

    private doFilter(): IssueWithAssignees[] {
        const allIssues = this.allIssuesStorage.copyIssues();
        const needToFilter = !(this.issueStatus == null && !this.loadMyIssues && !this.loadAssignedToMe) || this.hasIssueType();

        if (needToFilter) {
            return allIssues.filter((issueWithAssignee: IssueWithAssignees) => {
                const issue = issueWithAssignee.getIssue();
                const assignees = issueWithAssignee.getAssignees();

                const typeMatches = !this.hasIssueType() || issue.getType() === this.issueType;
                const statusMatches = this.issueStatus == null || issue.getIssueStatus() === this.issueStatus;
                const assignedByMeMatched = !this.loadMyIssues || issue.getCreator() === this.currentUser.getKey().toString();
                const assignedToMeMatched = !this.loadAssignedToMe || assignees.some(assignee => assignee.equals(this.currentUser));
                return typeMatches && statusMatches && assignedToMeMatched && assignedByMeMatched;
            });
        }

        return allIssues;
    }

    reload(): wemQ.Promise<void> {
        this.showLoadMask();

        return this.doFetch()
            .catch(api.DefaultErrorHandler.handle)
            .finally(() => {
                this.notifyIssuesLoaded();
                this.hideLoadMask();
            });
    }

    private filterAndFetchItems(append?: boolean): wemQ.Promise<void> {
        this.filterIfChanged();
        return this.fetchItems(append);
    }

    private fetchItems(append?: boolean): wemQ.Promise<void> {
        const skipLoad = !this.needToLoad();
        if (skipLoad) {
            return wemQ(null);
        }

        this.showLoadMask();

        this.filterIfChanged();

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
            .setFrom(append ? this.allIssuesStorage.getIssuesCount() : 0)
            .setSize(IssueList.MAX_VISIBLE_OPTIONS)
            .sendAndParse()
            .then((response: IssueResponse) => {
                const totalHits = response.getMetadata().getTotalHits();
                const issuesCountChanged = totalHits !== this.allIssuesStorage.getTotalIssues();

                const issues = response.getIssues();
                const hasLoadedIssues = issues.length > 0;

                if (append && !issuesCountChanged) {
                    if (hasLoadedIssues) {
                        this.allIssuesStorage.addIssues(issues);
                    }
                } else {
                    if (hasLoadedIssues) {
                        this.allIssuesStorage.setIssues(issues);
                    } else {
                        this.allIssuesStorage.clear();
                        const noIssuesEl = new PEl('no-issues-message').setHtml(i18n('dialog.issue.noIssuesFound'));
                        this.appendChild(noIssuesEl);
                    }
                }

                this.allIssuesStorage.setTotalIssues(totalHits);
                this.issuesOfType = this.countIssuesOfType();

                const loadMore = hasLoadedIssues && this.needToLoad() && this.getItemCount() <= IssueList.MAX_VISIBLE_OPTIONS;

                if (loadMore) {
                    return this.doFetch(true);
                }
            });
    }

    private countIssuesOfType(): number {
        return this.allIssuesStorage.copyIssues().filter((issueWithAssignee: IssueWithAssignees) => {
            const issue = issueWithAssignee.getIssue();

            const typeMatches = !this.hasIssueType() || issue.getType() === this.issueType;
            const statusMatches = this.issueStatus == null || issue.getIssueStatus() === this.issueStatus;
            return typeMatches && statusMatches;
        }).length;
    }

    private needToLoad(): boolean {
        return this.currentTotal > this.issuesOfType;
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
        const typeClass = this.issue.getType() === IssueType.PUBLISH_REQUEST ? 'publish-request' : 'issue';
        const statusClass = this.issue.getIssueStatus() === IssueStatus.CLOSED ? 'closed' : 'opened';
        const namesAndIconView = new NamesAndIconViewBuilder().setSize(NamesAndIconViewSize.small).build()
            .setMainName(this.issue.getTitleWithId())
            .setIconClass(`icon-${typeClass} ${statusClass}`)
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
