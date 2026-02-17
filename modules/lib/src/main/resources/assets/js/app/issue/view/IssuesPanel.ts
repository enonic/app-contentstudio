import type Q from 'q';
import {type FilterType} from './FilterType';
import {FilterState, IssueList} from './IssueList';
import {type Element} from '@enonic/lib-admin-ui/dom/Element';
import {IssueStatus} from '../IssueStatus';
import {type IssueWithAssignees} from '../IssueWithAssignees';
import {Panel} from '@enonic/lib-admin-ui/ui/panel/Panel';
import {type LoadMask} from '@enonic/lib-admin-ui/ui/mask/LoadMask';
import {LabelEl} from '@enonic/lib-admin-ui/dom/LabelEl';
import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {TypeFilter} from './TypeFilter';
import {StatusFilter} from './StatusFilter';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';

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
            void this.filter();
        });
    }

    reload(): Q.Promise<void> {
        return this.issuesList.reload();
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            const labelEl: LabelEl = new LabelEl(i18n('dialog.issue.filter.label'), this.typeFilter, 'label-filter');
            const filtersWrapper: DivEl = new DivEl('filters-block');
            filtersWrapper.appendChildren<Element>(labelEl, this.typeFilter, this.statusFilter);
            this.appendChildren<Element>(filtersWrapper, this.issuesList);

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

    updateIssuesCount(openedIssues: IssuesCount, closedIssues: IssuesCount): Q.Promise<void> {
        this.typeFilter.updateOptionsTotal(openedIssues, closedIssues);
        this.updateStatusFilterSelection();
        this.typeFilter.toggleActionsByStatus(this.statusFilter.getStatus());
        this.typeFilter.getParentElement().setVisible(openedIssues.all + closedIssues.all > 0);
        this.updateStatusFilterButtons();

        return this.filter();
    }

    private updateStatusFilterSelection() {
        const currentStatus = this.statusFilter.getStatus();
        const newStatus = currentStatus === IssueStatus.OPEN ? IssueStatus.CLOSED : IssueStatus.OPEN;

        if (this.typeFilter.getTotalFilteredByStatus(currentStatus) === 0 &&
            this.typeFilter.getTotalFilteredByStatus(newStatus) > 0) {
            this.statusFilter.setStatus(newStatus);
        }
    }

    private updateStatusFilterButtons() {
        const open: number = this.typeFilter.getTotalFilteredByStatus(IssueStatus.OPEN);
        const closed: number = this.typeFilter.getTotalFilteredByStatus(IssueStatus.CLOSED);
        this.statusFilter.updateStatusButtons(open, closed);
    }

    private filter(): Q.Promise<void> {
        const total: number = this.typeFilter.getTotalFilteredByStatus(this.statusFilter.getStatus());
        const filterState: FilterState = new FilterState(this.statusFilter.getStatus(), this.typeFilter.getType(), total);
        this.issuesList.setFilterState(filterState);

        return this.issuesList.filter();
    }

    setLoadMask(loadMask: LoadMask) {
        this.issuesList.setLoadMask(loadMask);
    }
}
