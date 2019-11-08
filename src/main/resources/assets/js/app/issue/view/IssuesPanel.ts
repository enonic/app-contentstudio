import * as Q from 'q';
import {Element} from 'lib-admin-ui/dom/Element';
import {i18n} from 'lib-admin-ui/util/Messages';
import {DefaultErrorHandler} from 'lib-admin-ui/DefaultErrorHandler';
import {Option} from 'lib-admin-ui/ui/selector/Option';
import {IssueList, IssueListConfig} from './IssueList';
import {IssueStatus} from '../IssueStatus';
import {IssueWithAssignees} from '../IssueWithAssignees';
import {RowSelector} from '../../inputtype/ui/selector/RowSelector';
import {OnOffButton} from './OnOffButton';
import {Panel} from 'lib-admin-ui/ui/panel/Panel';
import {LoadMask} from 'lib-admin-ui/ui/mask/LoadMask';
import {SelectedOptionEvent} from 'lib-admin-ui/ui/selector/combobox/SelectedOptionEvent';

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

export interface IssuesPanelConfig
    extends IssueListConfig {

    issuesToggledHandler: () => void;
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

    constructor(config: IssuesPanelConfig) {
        super('issues-panel');

        this.initElements(config);
    }

    private initElements(config: IssuesPanelConfig) {
        this.initIssuesList(config);
        this.initOptionsCount();
        this.initFilterOptions();
        this.initFilter();
        this.initIssuesToggler(config);
    }

    private initIssuesList(config: IssuesPanelConfig) {
        this.issuesList = new IssueList(config);
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
            IssuesPanel.makeLabelWithCounter(i18n('field.createdByMe')),
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

    private initIssuesToggler(config: IssuesPanelConfig) {
        this.issuesToggler = new OnOffButton({
            onLabel: i18n('field.issue.showClosedIssues'),
            offLabel: i18n('field.issue.hideClosedIssues'),
            off: false,
            clickHandler: () => {
                this.toggleClosedIssues()
                    .then(config.issuesToggledHandler)
                    .catch(DefaultErrorHandler.handle);
            }
        });
    }

    getActiveTotal(): number {
        const openedTotal = this.openedIssues.all;
        const closedTotal = this.closedIssues.all;
        const total = openedTotal + closedTotal;
        return this.issuesToggler.isOff() ? total : openedTotal;
    }

    getIssueList(): IssueList {
        return this.issuesList;
    }

    isEmpty() {
        return this.issuesList.getTotalItems() === 0;
    }

    focusFirstItem() {
        this.issuesList.getItemViews()[0].giveFocus();
    }

    private toggleClosedIssues(): Q.Promise<void> {
        const allVisible = this.isAllVisible();

        if (allVisible) {
            return this.hideClosedIssues();
        }
        return this.showClosedIssues();
    }

    private isAllVisible(): boolean {
        return this.issuesList.getIssueStatus() == null;
    }

    private showClosedIssues(): Q.Promise<void> {
        this.setIssueStatus(null);
        return this.updateIssuesTogglerAndOptions();
    }

    private hideClosedIssues(): Q.Promise<void> {
        this.setIssueStatus(IssueStatus.OPEN);
        return this.updateIssuesTogglerAndOptions();
    }

    private setIssueStatus(status: IssueStatus) {
        this.issuesList.updateIssueStatus(status);
    }

    reload(): Q.Promise<void> {
        return this.issuesList.reload();
    }

    private doFilter() {
        this.issuesList.filterIfChanged();
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            this.appendChildren<Element>(this.filter, this.issuesToggler, this.issuesList);

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

    private clearFilter() {
        this.filter.clearSelection();
    }

    private doSetAllOptions(select: boolean) {
        this.clearFilter();
        this.filter.setSelection(this.filterOptions.allOptions, select);
        this.issuesList.setLoadAssignedToMe(false);
        this.issuesList.setLoadMyIssues(false);
        if (select) {
            this.updateCurrentTotal();
        }
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
        this.clearFilter();
        this.filter.setSelection(this.filterOptions.assignedToMe, select);
        this.issuesList.setLoadAssignedToMe(select);
        if (select) {
            this.updateCurrentTotal();
        }
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
        this.clearFilter();
        this.filter.setSelection(this.filterOptions.assignedByMe, select);
        this.issuesList.setLoadMyIssues(select);
        if (select) {
            this.updateCurrentTotal();
        }
    }

    resetFilters() {
        const allSelectable = this.isAllOptionsSelectable();

        if (allSelectable) {
            this.doSetAllOptions(true);
        } else {
            this.clearFilter();
            this.updateCurrentTotal();
        }

        this.issuesToggler.turnOn();
        this.issuesList.updateIssueStatus(IssueStatus.OPEN);
    }

    updateIssuesCount(openedIssues: IssuesCount, closedIssues: IssuesCount): Q.Promise<void> {
        this.openedIssues = openedIssues;
        this.closedIssues = closedIssues;

        return this.updateTotalItems()
            .then(() => this.updateIssuesTogglerAndOptions());
    }

    private getTotalIssues(): IssuesCount {
        return {
            all: this.openedIssues.all + this.closedIssues.all,
            assignedToMe: this.openedIssues.assignedToMe + this.closedIssues.assignedToMe,
            assignedByMe: this.openedIssues.assignedByMe + this.closedIssues.assignedByMe
        };
    }

    private updateIssuesTogglerAndOptions(): Q.Promise<void> {
        return this.updateOptions().then(() => {
            this.updateIssuesToggler();
        });
    }

    private updateIssuesToggler() {
        let closedCount = 0;
        const allCanBeSelected = this.isNoOptionsSelected() && this.isAllOptionsSelectable();
        if (this.isAllOptionsSelected() || allCanBeSelected) {
            closedCount = this.closedIssues.all;
        } else if (this.isAssignedToMeSelected()) {
            closedCount = this.closedIssues.assignedToMe;
        } else if (this.isAssignedByMeSelected()) {
            closedCount = this.closedIssues.assignedByMe;
        }

        this.issuesToggler.updateLabels({
            onLabel: IssuesPanel.makeLabelWithCounter(i18n('field.issue.showClosedIssues'), closedCount),
            offLabel: IssuesPanel.makeLabelWithCounter(i18n('field.issue.hideClosedIssues'), closedCount),
        });

        this.updateIssuesTogglerStatus(closedCount);
    }

    private updateIssuesTogglerStatus(closed: number) {
        const noClosedIssues = closed === 0;
        const showingClosedIssues = this.issuesToggler.isOff();

        const switchToggler = showingClosedIssues && noClosedIssues;
        if (switchToggler) {
            this.issuesToggler.turnOn();
        }

        const showingOpenedIssues = !this.issuesToggler.isOff();
        const disableToggler = showingOpenedIssues && noClosedIssues;
        this.issuesToggler.setEnabled(!disableToggler);
    }

    private updateOptions(): Q.Promise<void> {
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
                this.doFilter();
            } else {
                this.clearFilter();
            }
        } else if (shouldSelectDefault) {
            this.doSetAllOptions(true);
        } else if (mustResetSelection) {
            this.clearFilter();
        }

        return this.updateCurrentTotal();
    }

    private updateTotalItems(): Q.Promise<void> {
        const total = this.getTotalIssues().all;
        const previousTotal = this.issuesList.getTotalItems();
        const hasTotalChanged = total !== previousTotal;

        return this.issuesList.updateTotalItems(total).then(() => {
            if (hasTotalChanged) {
                const hasNoIssues = total === 0;
                this.toggleClass('no-issues', hasNoIssues);
            }
        });
    }

    private updateCurrentTotal(): Q.Promise<void> {
        const total = this.isAllVisible() ? this.getTotalIssues() : this.openedIssues;

        const shouldDisableFilter = total.all === 0;
        this.toggleClass('no-filter', shouldDisableFilter);

        let count = 0;
        if (this.isAllOptionsSelected() || this.isNoOptionsSelected()) {
            count = total.all;
        } else if (this.isAssignedToMeSelected()) {
            count = total.assignedToMe;
        } else if (this.isAssignedByMeSelected()) {
            count = total.assignedByMe;
        }
        return this.issuesList.updateCurrentTotal(count);
    }

    private updateAssignedToMeOption(total: number) {
        const selectable = total > 0;
        const displayValue = IssuesPanel.makeLabelWithCounter(i18n('field.assignedToMe'), total);

        this.filterOptions.assignedToMe = this.filter.updateOptionValue(this.filterOptions.assignedToMe, displayValue, selectable);
    }

    private updateAssignedByMeOption(total: number) {
        const selectable = total > 0;
        const displayValue = IssuesPanel.makeLabelWithCounter(i18n('field.createdByMe'), total);

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
