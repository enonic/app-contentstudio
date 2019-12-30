import {MenuButton} from 'lib-admin-ui/ui/button/MenuButton';
import {IssuePanelFilterAction} from './IssuePanelFilterAction';
import {FilterType} from './FilterType';
import {IssueStatus} from '../IssueStatus';
import {IssuesCount} from './IssuesPanel';
import {i18n} from 'lib-admin-ui/util/Messages';
import {Action} from 'lib-admin-ui/ui/Action';

export class TypeFilter
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

    toggleActionsByStatus(status: IssueStatus = IssueStatus.OPEN) {
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
