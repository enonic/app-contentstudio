import {FilterState, FilterType, IssueList} from './IssueList';
import {IssueStatus} from '../IssueStatus';
import {IssueWithAssignees} from '../IssueWithAssignees';
import Panel = api.ui.panel.Panel;
import LoadMask = api.ui.mask.LoadMask;
import i18n = api.util.i18n;
import Action = api.ui.Action;
import MenuButton = api.ui.button.MenuButton;
import DivEl = api.dom.DivEl;
import Button = api.ui.button.Button;
import LabelEl = api.dom.LabelEl;

export interface IssuesCount {
    all: number;
    assignedToMe: number;
    assignedByMe: number;
    publishRequests: number;
    tasks: number;
}

export class IssuesPanel
    extends Panel {

    private issuesList: IssueList;

    private typeFilter: TypeFilter;

    private statusFilter: StatusFilter;

    constructor() {
        super('issues-panel');

        this.initElements();
        this.initListeners();
    }

    private initElements() {
        this.issuesList = new IssueList();
        this.typeFilter = new TypeFilter();
        this.statusFilter = new StatusFilter();
    }

    private initListeners() {
        this.typeFilter.onSelected((type: FilterType) => {
            this.updateStatusFilterButtons();
            this.filter();
        });

        this.statusFilter.onStatusChanged((status: IssueStatus) => {
            this.typeFilter.toggleActionsByStatus(status);
            return this.filter();
        });
    }

    reload(): wemQ.Promise<void> {
        return this.issuesList.reload();
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            const labelEl: LabelEl = new LabelEl(i18n('dialog.issue.filter.label'), this.typeFilter, 'label-filter');
            const filtersWrapper: DivEl = new DivEl('filters-block');
            filtersWrapper.appendChildren<api.dom.Element>(labelEl, this.typeFilter, this.statusFilter);
            this.appendChildren<api.dom.Element>(filtersWrapper, this.issuesList);

            return rendered;
        });
    }

    onIssueSelected(listener: (issue: IssueWithAssignees) => void) {
        this.issuesList.onIssueSelected(listener);
    }

    onIssueLoaded(listener: () => void) {
        this.issuesList.onIssuesLoaded(listener);
    }

    selectAssignedToMe() {
        this.typeFilter.selectAssignedToMe();
    }

    resetFilters() {
        this.issuesList.setFilterState(new FilterState());
        this.typeFilter.selectFirstEnabledOption();
    }

    updateIssuesCount(openedIssues: IssuesCount, closedIssues: IssuesCount): wemQ.Promise<void> {
        this.typeFilter.updateOptionsTotal(openedIssues, closedIssues);
        this.updateStatusFilterSelection();
        this.typeFilter.toggleActionsByStatus(this.statusFilter.getStatus());
        this.typeFilter.getParentElement().setVisible(openedIssues.all + closedIssues.all > 0);
        this.updateStatusFilterButtons();

        return this.filter();
    }

    private updateStatusFilterSelection() {
        if (this.statusFilter.getStatus() === IssueStatus.OPEN && this.typeFilter.getTotalFilteredByStatus(IssueStatus.OPEN) === 0 &&
            this.typeFilter.getTotalFilteredByStatus(IssueStatus.CLOSED) > 0) {
            this.statusFilter.setStatus(IssueStatus.CLOSED);
            return;
        }

        if (this.statusFilter.getStatus() === IssueStatus.CLOSED && this.typeFilter.getTotalFilteredByStatus(IssueStatus.CLOSED) === 0 &&
            this.typeFilter.getTotalFilteredByStatus(IssueStatus.OPEN) > 0) {
            this.statusFilter.setStatus(IssueStatus.OPEN);
            return;
        }
    }

    private updateStatusFilterButtons() {
        const open: number = this.typeFilter.getTotalFilteredByStatus(IssueStatus.OPEN);
        const closed: number = this.typeFilter.getTotalFilteredByStatus(IssueStatus.CLOSED);
        this.statusFilter.updateStatusButtons(open, closed);
    }

    private filter(): wemQ.Promise<void> {
        const total: number = this.typeFilter.getTotalFilteredByStatus(this.statusFilter.getStatus());
        const filterState: FilterState = new FilterState(this.statusFilter.getStatus(), this.typeFilter.getType(), total);
        this.issuesList.setFilterState(filterState);

        return this.issuesList.filter();
    }

    setLoadMask(loadMask: LoadMask) {
        this.issuesList.setLoadMask(loadMask);
    }
}

class IssuePanelFilterAction
    extends Action {

    private totalOpen: number;

    private totalClosed: number;

    private defaultLabel: string;

    private type: FilterType;

    constructor(type: FilterType) {
        super();

        this.type = type;
        this.totalOpen = 0;
        this.totalClosed = 0;
    }

    setDefaultLabel(value: string): IssuePanelFilterAction {
        super.setLabel(value);
        this.defaultLabel = value;
        return this;
    }

    setTotalOpen(value: number): IssuePanelFilterAction {
        this.totalOpen = value;
        return this;
    }

    setTotalClosed(value: number): IssuePanelFilterAction {
        this.totalClosed = value;
        return this;
    }

    updateByStatus(status: IssueStatus) {
        const total: number = status === IssueStatus.OPEN ? this.totalOpen : this.totalClosed;
        const displayValue: string = this.makeLabelWithCounter(total);
        this.setLabel(displayValue);
        this.setEnabled(total > 0);
    }

    getTotalByStatus(status: IssueStatus): number {
        return status === IssueStatus.OPEN ? this.totalOpen : this.totalClosed;
    }

    getType(): FilterType {
        return this.type;
    }

    private makeLabelWithCounter(count: number): string {
        return (count > 0 ? `${this.defaultLabel} (${count})` : this.defaultLabel);
    }
}

class TypeFilter
    extends MenuButton {

    private defaultAction: Action;

    private currentSelection: IssuePanelFilterAction;

    private menuActions: IssuePanelFilterAction[];

    private selectionListeners: { (type: FilterType): void }[];

    constructor() {
        const defaultAction: Action = new Action(i18n('field.all'));
        super(defaultAction);
        this.defaultAction = defaultAction;
        this.selectionListeners = [];

        this.initFilterOptions();
        this.initSelectionListeners();
    }

    private initFilterOptions() {
        const filterAllIssuesAction = new IssuePanelFilterAction(FilterType.ALL).setDefaultLabel(i18n('field.all'));
        const filterAssignedToMeAction = new IssuePanelFilterAction(FilterType.ASSIGNED_TO_ME).setDefaultLabel(i18n('field.assignedToMe'));
        const filterCreatedByMeAction = new IssuePanelFilterAction(FilterType.CREATED_BY_ME).setDefaultLabel(i18n('field.createdByMe'));
        const filterPublishRequestAction = new IssuePanelFilterAction(FilterType.PUBLISH_REQUESTS).setDefaultLabel(
            i18n('field.publishRequests'));
        const filterTasksAction = new IssuePanelFilterAction(FilterType.TASKS).setDefaultLabel(i18n('field.tasks'));

        this.menuActions = [filterAllIssuesAction, filterAssignedToMeAction, filterCreatedByMeAction,
            filterPublishRequestAction, filterTasksAction];
        this.addMenuActions(this.menuActions);
        this.currentSelection = filterAllIssuesAction;
    }

    private initSelectionListeners() {
        this.menuActions.forEach((action: IssuePanelFilterAction) => {
            action.onExecuted(() => this.handleOptionSelected(action));
        });
    }

    private handleOptionSelected(action: IssuePanelFilterAction) {
        if (action === this.currentSelection) {
            return;
        }

        this.currentSelection = action;
        this.defaultAction.setLabel(action.getLabel());
        this.notifySelected(action.getType());
    }

    selectFirstEnabledOption() {
        this.menuActions.some((action: IssuePanelFilterAction) => {
            if (action.isEnabled()) {
                action.execute();
                return true;
            }

            return false;
        });
    }

    selectAssignedToMe() {
        this.menuActions[1].execute();
    }

    updateOptionsTotal(open: IssuesCount, closed: IssuesCount) {
        this.menuActions[0].setTotalOpen(open.all).setTotalClosed(closed.all);
        this.menuActions[1].setTotalOpen(open.assignedToMe).setTotalClosed(closed.assignedToMe);
        this.menuActions[2].setTotalOpen(open.assignedByMe).setTotalClosed(closed.assignedByMe);
        this.menuActions[3].setTotalOpen(open.publishRequests).setTotalClosed(closed.publishRequests);
        this.menuActions[4].setTotalOpen(open.tasks).setTotalClosed(closed.tasks);
    }

    toggleActionsByStatus(status: IssueStatus) {
        this.menuActions.forEach((action: IssuePanelFilterAction) => {
            action.updateByStatus(status);
        });

        this.defaultAction.setLabel(this.currentSelection.getLabel());
    }

    getType(): FilterType {
        return this.currentSelection.getType();
    }

    onSelected(handler: (type: FilterType) => void) {
        this.selectionListeners.push(handler);
    }

    unSelected(handler: (type: FilterType) => void) {
        this.selectionListeners = this.selectionListeners.filter((curr) => {
            return curr !== handler;
        });
    }

    getTotalFilteredByStatus(status: IssueStatus): number {
        return this.currentSelection.getTotalByStatus(status);
    }

    private notifySelected(type: FilterType) {
        this.selectionListeners.forEach((listener) => {
            listener(type);
        });
    }
}

class StatusFilterButton
    extends Button {

    private defaultLabel: string;

    constructor(label: string) {
        super(label);

        this.defaultLabel = label;
    }

    updateByTotal(total: number) {
        this.setLabel(this.makeLabel(total));

        if (total > 0) {
            this.getEl().removeAttribute('disabled');
        } else {
            this.getEl().setAttribute('disabled', 'true');
        }
    }

    private makeLabel(count: number): string {
        return (count > 0 ? `${this.defaultLabel} (${count})` : this.defaultLabel);
    }
}

class StatusFilter
    extends DivEl {

    private showOpenIssuesButton: StatusFilterButton;

    private showClosedIssuesButton: StatusFilterButton;

    private currentStatus: IssueStatus;

    private statusChangedListeners: { (status: IssueStatus): void }[];

    constructor() {
        super('status-filter');

        this.initStatusButtons();
        this.initListeners();
        this.currentStatus = IssueStatus.OPEN;
        this.statusChangedListeners = [];
    }

    private initStatusButtons() {
        this.showOpenIssuesButton = new StatusFilterButton(i18n('field.issue.status.open'));
        this.showClosedIssuesButton = new StatusFilterButton(i18n('field.issue.status.closed'));
    }

    private initListeners() {
        this.showOpenIssuesButton.onClicked(() => this.handleStatusChanged(IssueStatus.OPEN));
        this.showClosedIssuesButton.onClicked(() => this.handleStatusChanged(IssueStatus.CLOSED));
    }

    private handleStatusChanged(status: IssueStatus) {
        if (status === this.currentStatus) {
            return;
        }

        this.currentStatus = status;
        this.showOpenIssuesButton.toggleClass('active', status === IssueStatus.OPEN);
        this.showClosedIssuesButton.toggleClass('active', status === IssueStatus.CLOSED);

        this.notifyStatusChanged(status);
    }

    updateStatusButtons(open: number, closed: number) {
        this.showOpenIssuesButton.updateByTotal(open);
        this.showClosedIssuesButton.updateByTotal(closed);

        this.showOpenIssuesButton.toggleClass('active', this.currentStatus === IssueStatus.OPEN && open > 0);
        this.showClosedIssuesButton.toggleClass('active', this.currentStatus === IssueStatus.CLOSED && closed > 0);
    }

    getStatus(): IssueStatus {
        return this.currentStatus;
    }

    setStatus(value: IssueStatus) {
        this.currentStatus = value;
    }

    onStatusChanged(handler: (status: IssueStatus) => void) {
        this.statusChangedListeners.push(handler);
    }

    unStatusChanged(handler: (status: IssueStatus) => void) {
        this.statusChangedListeners = this.statusChangedListeners.filter((curr) => {
            return curr !== handler;
        });
    }

    private notifyStatusChanged(status: IssueStatus) {
        this.statusChangedListeners.forEach((listener) => {
            listener(status);
        });
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            this.showOpenIssuesButton.addClass('status-button open');
            this.showClosedIssuesButton.addClass('status-button closed');
            this.appendChildren(this.showOpenIssuesButton, this.showClosedIssuesButton);

            return rendered;
        });
    }
}
