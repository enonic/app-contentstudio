import {IssueList} from './IssueList';
import {IssueStatus} from '../IssueStatus';
import {IssueWithAssignees} from '../IssueWithAssignees';
import {RowSelector} from '../../inputtype/ui/selector/RowSelector';
import {OnOffButton} from './OnOffButton';
import Panel = api.ui.panel.Panel;
import LoadMask = api.ui.mask.LoadMask;
import Option = api.ui.selector.Option;
import i18n = api.util.i18n;
import SelectedOptionEvent = api.ui.selector.combobox.SelectedOptionEvent;

interface FilterOptions {
    allOptions: Option<string>;
    assignedToMe: Option<string>;
    assignedByMe: Option<string>;
}

export interface IssuesCount {
    all: number;
    assignedToMe: number;
    assignedByMe: number;
}

export class IssuesPanel
    extends Panel {

    private issuesList: IssueList;

    private filter: RowSelector;

    private filterOptions: FilterOptions;

    private issuesToggler: OnOffButton;

    private issueSelectedListeners: { (issue: IssueWithAssignees): void }[] = [];

    constructor() {
        super('issues-panel');

        this.initElements();
    }

    private initElements() {
        this.initIssuesList();
        this.initFilterOptions();
        this.initFilter();
        this.initIssuesToggler();
    }

    private initIssuesList() {
        this.issuesList = new IssueList(IssueStatus.OPEN);
        this.issuesList.onIssueSelected(issue => this.notifyIssueSelected(issue));
    }

    private initFilterOptions() {
        const options = RowSelector.createOptions([
            IssuesPanel.makeLabelWithCounter(i18n('field.all')),
            IssuesPanel.makeLabelWithCounter(i18n('field.assignedToMe')),
            IssuesPanel.makeLabelWithCounter(i18n('field.assignedByMe')),
        ]);

        this.filterOptions = {
            allOptions: options[0],
            assignedToMe: options[1],
            assignedByMe: options[2]
        };
    }

    private initFilter() {
        this.filter = new RowSelector();

        this.filter.setOptions([
            this.filterOptions.allOptions,
            this.filterOptions.assignedToMe,
            this.filterOptions.assignedByMe
        ]);

        const createSelectionHandler = (select: boolean) => (event: SelectedOptionEvent<string>) => {
            const optionValue = event.getSelectedOption().getOption().value;
            switch (optionValue) {
            case this.filterOptions.allOptions.value:
                this.setAllOptions(select);
                break;
            case this.filterOptions.assignedToMe.value: {
                if (this.isAssignedToMeSelectable()) {
                    this.setAssignedToMe(select);
                }
            }
                break;
            case this.filterOptions.assignedByMe.value: {
                if (this.isAssignedByMeSelectable()) {
                    this.setAssignedByMe(select);
                }
            }
                break;
            }
        };

        this.filter.onOptionSelected(createSelectionHandler(true));
        this.filter.onOptionDeselected(createSelectionHandler(false));
    }

    private initIssuesToggler() {
        this.issuesToggler = new OnOffButton({
            onLabel: i18n('field.issue.showClosedIssues'),
            offLabel: i18n('field.issue.hideClosedIssues'),
            off: false,
            clickHandler: () => {
                this.toggleClosedIssues()
            }
        });
    }

    getIssueList(): IssueList {
        return this.issuesList;
    }

    toggleClosedIssues() {
        const allVisible = this.isAllVisible();

        if (allVisible) {
            this.hideClosedIssues();
        } else {
            this.showClosedIssues();
        }
    }

    isAllVisible(): boolean {
        return this.issuesList.getIssueStatus() == null;
    }

    showClosedIssues(): wemQ.Promise<void> {
        return this.updateShownIssues(null);
    }

    hideClosedIssues(): wemQ.Promise<void> {
        return this.updateShownIssues(IssueStatus.OPEN);
    }

    updateShownIssues(status: IssueStatus): wemQ.Promise<void> {
        this.issuesList.setIssueStatus(status);
        return this.reload();
    }

    reload(): wemQ.Promise<void> {
        return this.issuesList.reload();
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            this.appendChildren<api.dom.Element>(this.filter, this.issuesToggler, this.issuesList);

            return rendered;
        });
    }

    private notifyIssueSelected(issue: IssueWithAssignees) {
        this.issueSelectedListeners.forEach(listener => listener(issue));
    }

    onIssueSelected(listener: (issue: IssueWithAssignees) => void) {
        this.issueSelectedListeners.push(listener);
    }

    unIssueSelected(listener: (issue: IssueWithAssignees) => void) {
        this.issueSelectedListeners = this.issueSelectedListeners.filter(curr => curr !== listener);
    }

    private setAllOptions(select: boolean) {
        if (this.isAllOptionsSelectable()) {
            this.doSetAllOptions(select);
        }
    }

    isAllOptionsSelectable(): boolean {
        return this.filterOptions.allOptions.selectable;
    }

    private doSetAllOptions(select: boolean) {
        this.filter.clearSelection();
        this.filter.setSelection(this.filterOptions.allOptions, select);
        this.issuesList.setLoadAssignedToMe(false);
        this.issuesList.setLoadMyIssues(false);
    }

    selectAssignedToMe() {
        if (this.isAssignedToMeSelectable()) {
            this.setAssignedToMe(true);
        }
    }

    private isAssignedToMeSelectable(): boolean {
        return this.filterOptions.assignedToMe.selectable;
    }

    private setAssignedToMe(select: boolean) {
        this.filter.clearSelection();
        this.filter.setSelection(this.filterOptions.assignedToMe, select);
        this.issuesList.setLoadAssignedToMe(select);
        this.reload();
    }

    selectAssignedByMe() {
        if (this.isAssignedByMeSelectable()) {
            this.setAssignedByMe(true);
        }
    }

    private isAssignedByMeSelectable(): boolean {
        return this.filterOptions.assignedByMe.selectable;
    }

    private setAssignedByMe(select: boolean) {
        this.filter.clearSelection();
        this.filter.setSelection(this.filterOptions.assignedByMe, select);
        this.issuesList.setLoadMyIssues(select);
        this.reload();
    }

    resetFilters(): wemQ.Promise<void> {
        this.filter.clearSelection();
        if (this.isAllOptionsSelectable()) {
            this.doSetAllOptions(true);
            return this.reload();
        }

        return wemQ(null);
    }

    updateIssuesCount(openedIssues: IssuesCount, closedIssues: IssuesCount) {
        const allVisible = this.isAllVisible();

        const total: IssuesCount = {
            all: openedIssues.all + closedIssues.all,
            assignedToMe: openedIssues.assignedToMe + closedIssues.assignedToMe,
            assignedByMe: openedIssues.assignedByMe + closedIssues.assignedByMe
        };

        this.updateOptions(total);
        this.updateIssuesToggler(total.all, openedIssues.all);

        const allAreClosed = total.all > 0 && openedIssues.all === 0;
        const switchToAllIssues = !allVisible && allAreClosed;

        if (switchToAllIssues) {
            this.issuesToggler.turnOff();
            this.showClosedIssues();
        }
    }

    private updateIssuesToggler(total: number, opened: number) {
        this.issuesToggler.updateLabels({
            onLabel: IssuesPanel.makeLabelWithCounter(i18n('field.issue.showClosedIssues'), total),
            offLabel: IssuesPanel.makeLabelWithCounter(i18n('field.issue.hideClosedIssues'), opened),
        });

        const allAreOpened = total === opened;
        const allAreClosed = total > 0 && opened === 0;
        if (allAreOpened || allAreClosed) {
            this.issuesToggler.setEnabled(false);
        }
    }

    private updateOptions(total: IssuesCount) {
        this.updateAllOption(total.all);
        this.updateAssignedToMeOption(total.assignedToMe);
        this.updateAssignedByMeOption(total.assignedByMe);
    }

    private updateAssignedToMeOption(total: number) {
        const selectable = total > 0;
        const displayValue = IssuesPanel.makeLabelWithCounter(i18n('field.assignedToMe'), total);

        this.filterOptions.assignedToMe = this.filter.updateOptionValue(this.filterOptions.assignedToMe, displayValue, selectable);

        if (!selectable) {
            this.resetFilters();
        }
    }

    private updateAssignedByMeOption(total: number) {
        const selectable = total > 0;
        const displayValue = IssuesPanel.makeLabelWithCounter(i18n('field.assignedByMe'), total);

        this.filterOptions.assignedByMe = this.filter.updateOptionValue(this.filterOptions.assignedByMe, displayValue, selectable);

        if (!selectable) {
            this.resetFilters();
        }
    }

    private updateAllOption(total: number) {
        const selectable = total > 0;
        const displayValue = IssuesPanel.makeLabelWithCounter(i18n('field.all'), total);

        this.filterOptions.allOptions = this.filter.updateOptionValue(this.filterOptions.allOptions, displayValue, selectable);

        if (!selectable) {
            this.filter.clearSelection();
        }
    }

    private static makeLabelWithCounter(label: string, count: number = 0): string {
        return (count > 0 ? `${label} (${count})` : label);
    }

    setLoadMask(loadMask: LoadMask) {
        this.issuesList.setLoadMask(loadMask);
    }
}
