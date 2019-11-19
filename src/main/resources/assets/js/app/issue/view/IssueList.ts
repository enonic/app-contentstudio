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
import SpanEl = api.dom.SpanEl;
import DivEl = api.dom.DivEl;
import Tooltip = api.ui.Tooltip;
import LoadMask = api.ui.mask.LoadMask;
import NamesAndIconView = api.app.NamesAndIconView;
import NamesAndIconViewBuilder = api.app.NamesAndIconViewBuilder;
import NamesAndIconViewSize = api.app.NamesAndIconViewSize;
import LiEl = api.dom.LiEl;
import i18n = api.util.i18n;

export enum FilterType {
    ALL, ASSIGNED_TO_ME, CREATED_BY_ME, PUBLISH_REQUESTS, TASKS
}

export class FilterState {
    filterStatus: IssueStatus;
    filterType: FilterType;
    currentTotal: number;

    constructor(filterStatus: IssueStatus = IssueStatus.OPEN, filterType: FilterType = FilterType.ALL, currentTotal: number = 0) {
        this.filterStatus = filterStatus;
        this.filterType = filterType;
        this.currentTotal = currentTotal;
    }
}

export class IssueList
    extends ListBox<IssueWithAssignees> {

    private static MAX_VISIBLE_OPTIONS: number = 15;

    private filterState: FilterState;

    private currentUser: Principal;

    private allIssuesStorage: IssuesStorage;

    private noIssues: LiEl;

    private loadMask: LoadMask;

    private issueSelectedListeners: { (issue: IssueWithAssignees): void }[] = [];

    private issuesLoadedListeners: { (): void }[] = [];

    constructor() {
        super('issue-list');
        this.filterState = new FilterState();
        this.allIssuesStorage = new IssuesStorage();
        this.initElements();
        this.initListeners();
        this.loadCurrentUser();
        this.setupLazyLoading();
    }

    protected initElements() {
        this.noIssues = new LiEl('no-issues-message').setHtml(i18n('dialog.issue.noIssuesAndPublishRequests'));
    }

    protected initListeners() {
        this.allIssuesStorage.onIssuesUpdated(() => {
            const hasIssues = this.allIssuesStorage.hasIssues();

            if (hasIssues) {
                // Issues updated, so full check required, which may cause performance problems
                this.setItems(this.doFilter());
            } else {
                this.clearItems();
            }
            this.showNoIssuesMessage();
        });
    }

    setLoadMask(loadMask: LoadMask) {
        this.loadMask = loadMask;
    }

    setFilterState(value: FilterState) {
        this.filterState = value;
    }

    filter(): wemQ.Promise<void> {
        return this.filterAndFetchItems(true).then(() => {
            this.showNoIssuesMessage();
        });
    }

    private showNoIssuesMessage() {
        const hasNoIssues = this.filterState.currentTotal === 0;
        if (hasNoIssues && this.getItemCount() === 0) {
            this.appendChild(this.noIssues);
        }
    }

    private filterIfChanged() {
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

        return allIssues.filter(this.matchesFilter.bind(this));
    }

    private matchesFilter(issueWithAssignee: IssueWithAssignees): boolean {
        const issue = issueWithAssignee.getIssue();
        const assignees = issueWithAssignee.getAssignees();

        if (issue.getIssueStatus() !== this.filterState.filterStatus) {
            return false;
        }

        if (this.filterState.filterType === FilterType.ALL) {
            return true;
        }

        if (this.filterState.filterType === FilterType.CREATED_BY_ME) {
            return issue.getCreator() === this.currentUser.getKey().toString();
        }

        if (this.filterState.filterType === FilterType.ASSIGNED_TO_ME) {
            return assignees.some(assignee => assignee.equals(this.currentUser));
        }

        if (this.filterState.filterType === FilterType.PUBLISH_REQUESTS) {
            return issue.getType() === IssueType.PUBLISH_REQUEST;
        }

        if (this.filterState.filterType === FilterType.TASKS) {
            return issue.getType() === IssueType.STANDARD;
        }

        return false;
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
                    // Clear storage anyway, cause the new items are prepended to the list on the server
                    // Received items will be the old one
                    this.allIssuesStorage.clear();
                }

                this.allIssuesStorage.setTotalIssues(totalHits);

                const loadMore = hasLoadedIssues && this.needToLoad() && this.getItemCount() <= IssueList.MAX_VISIBLE_OPTIONS;

                if (loadMore) {
                    return this.doFetch(true);
                }
            });
    }

    private needToLoad(): boolean {
        const total = this.allIssuesStorage.copyIssues().filter((issue: IssueWithAssignees) => this.matchesFilter(issue)).length;
        return this.filterState.currentTotal > total;
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
        itemEl.onKeyPressed((event: KeyboardEvent) => {
            if (event.code === 'Enter' || event.code === 'NumpadEnter') {
                this.notifyIssueSelected(issueWithAssignees);
            }
        });

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
