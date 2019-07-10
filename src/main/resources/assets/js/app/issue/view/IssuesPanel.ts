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

    private openedIssues: IssuesCount;

    private closedIssues: IssuesCount;

    private issueSelectedListeners: { (issue: IssueWithAssignees): void }[] = [];

    constructor() {
        super('issues-panel');

        this.initElements();
    }

    private initElements() {
        this.initIssuesList();
        this.initOptionsCount();
        this.initFilterOptions();
        this.initFilter();
        this.initIssuesToggler();
    }

    private initIssuesList() {
        this.issuesList = new IssueList(IssueStatus.OPEN);
        this.issuesList.onIssueSelected(issue => this.notifyIssueSelected(issue));
    }

    private initOptionsCount() {
        this.openedIssues = IssuesPanel.createIssuesCount();
        this.closedIssues = IssuesPanel.createIssuesCount();
    }

    private static createIssuesCount(): IssuesCount {
        return {
            all: 0,
            assignedToMe: 0,
            assignedByMe: 0
        };
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
            this.updateIssuesToggler();
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
                this.toggleClosedIssues();
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
        return this.updateShownIssues(null).then(() => this.updateIssuesTogglerAndOptions());
    }

    hideClosedIssues(): wemQ.Promise<void> {
        return this.updateShownIssues(IssueStatus.OPEN).then(() => this.updateIssuesTogglerAndOptions());
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

    isAllOptionsSelected(): boolean {
        return this.filter.isOptionSelected(this.filterOptions.allOptions);
    }

    isNoOptionsSelected(): boolean {
        return this.filter.isSelectionEmpty();
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

    private isAssignedToMeSelected(): boolean {
        return this.filter.isOptionSelected(this.filterOptions.assignedToMe);
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

    private isAssignedByMeSelected(): boolean {
        return this.filter.isOptionSelected(this.filterOptions.assignedByMe);
    }

    private setAssignedByMe(select: boolean) {
        this.filter.clearSelection();
        this.filter.setSelection(this.filterOptions.assignedByMe, select);
        this.issuesList.setLoadMyIssues(select);
        this.reload();
    }

    resetFilters() {
        const allSelectable = this.isAllOptionsSelectable();

        if (allSelectable) {
            this.doSetAllOptions(true);
        } else {
            this.filter.clearSelection();
        }

        this.issuesToggler.setEnabled(true);
        this.issuesToggler.turnOn();
        this.issuesList.setIssueStatus(IssueStatus.OPEN);
    }

    updateIssuesCount(openedIssues: IssuesCount, closedIssues: IssuesCount): wemQ.Promise<void> {
        this.openedIssues = openedIssues;
        this.closedIssues = closedIssues;

        return this.checkAndSwitchOptions().then(() => this.updateIssuesTogglerAndOptions());
    }

    getTotalIssues(): IssuesCount {
        return {
            all: this.openedIssues.all + this.closedIssues.all,
            assignedToMe: this.openedIssues.assignedToMe + this.closedIssues.assignedToMe,
            assignedByMe: this.openedIssues.assignedByMe + this.closedIssues.assignedByMe
        };
    }

    private checkAndSwitchOptions(): wemQ.Promise<void> {
        const total = this.getTotalIssues();

        const allAreClosed = total.all > 0 && this.openedIssues.all === 0;
        const switchToAllIssues = !this.isAllVisible() && allAreClosed;

        if (switchToAllIssues) {
            this.issuesToggler.turnOff();
            return this.showClosedIssues();
        }

        return wemQ(null);
    }

    private updateIssuesTogglerAndOptions(): wemQ.Promise<void> {
        return this.updateOptions().then(() => {
            this.updateIssuesToggler();
        });
    }

    private updateIssuesToggler() {
        let closedCount = 0;
        let openedCount = 0;
        const allCanBeSelected = this.isNoOptionsSelected() && this.isAllOptionsSelectable();
        if (this.isAllOptionsSelected() || allCanBeSelected) {
            closedCount = this.closedIssues.all;
            openedCount = this.openedIssues.all;
        } else if (this.isAssignedToMeSelected()) {
            closedCount = this.closedIssues.assignedToMe;
            openedCount = this.openedIssues.assignedToMe;
        } else if (this.isAssignedByMeSelected()) {
            closedCount = this.closedIssues.assignedByMe;
            openedCount = this.openedIssues.assignedByMe;
        }

        this.issuesToggler.updateLabels({
            onLabel: IssuesPanel.makeLabelWithCounter(i18n('field.issue.showClosedIssues'), closedCount),
            offLabel: IssuesPanel.makeLabelWithCounter(i18n('field.issue.hideClosedIssues'), closedCount),
        });

        const noClosedIssues = closedCount === 0;
        const noOpenedIssues = openedCount === 0;
        const disableToggler = noClosedIssues || noOpenedIssues;
        this.issuesToggler.setEnabled(!disableToggler);
    }

    private updateOptions(): wemQ.Promise<void> {
        const total = this.isAllVisible() ? this.getTotalIssues() : this.openedIssues;

        this.updateAllOption(total.all);
        this.updateAssignedToMeOption(total.assignedToMe);
        this.updateAssignedByMeOption(total.assignedByMe);

        const allSelectable = this.isAllOptionsSelectable();
        const mustSelectDefault = (this.isAssignedToMeSelected() && !this.isAssignedToMeSelectable()) ||
                                  (this.isAssignedByMeSelected() && !this.isAssignedByMeSelectable());
        const shouldSelectDefault = allSelectable && this.isNoOptionsSelected();
        const mustResetSelection = !allSelectable && this.isAllOptionsSelected();

        if (mustSelectDefault) {
            if (allSelectable) {
                this.doSetAllOptions(true);
                return this.reload();
            } else {
                this.filter.clearSelection();
            }
        } else if (shouldSelectDefault) {
            this.doSetAllOptions(true);
        } else if (mustResetSelection) {
            this.filter.clearSelection();
        }

        return wemQ(null);
    }

    private updateAssignedToMeOption(total: number) {
        const selectable = total > 0;
        const displayValue = IssuesPanel.makeLabelWithCounter(i18n('field.assignedToMe'), total);

        this.filterOptions.assignedToMe = this.filter.updateOptionValue(this.filterOptions.assignedToMe, displayValue, selectable);
    }

    private updateAssignedByMeOption(total: number) {
        const selectable = total > 0;
        const displayValue = IssuesPanel.makeLabelWithCounter(i18n('field.assignedByMe'), total);

        this.filterOptions.assignedByMe = this.filter.updateOptionValue(this.filterOptions.assignedByMe, displayValue, selectable);
    }

    private updateAllOption(total: number) {
        const selectable = total > 0;
        const displayValue = IssuesPanel.makeLabelWithCounter(i18n('field.all'), total);

        this.filterOptions.allOptions = this.filter.updateOptionValue(this.filterOptions.allOptions, displayValue, selectable);
    }

    private static makeLabelWithCounter(label: string, count: number = 0): string {
        return (count > 0 ? `${label} (${count})` : label);
    }

    setLoadMask(loadMask: LoadMask) {
        this.issuesList.setLoadMask(loadMask);
    }
}
