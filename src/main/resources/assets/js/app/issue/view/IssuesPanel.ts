import {IssueList} from './IssueList';
import {IssueStatus} from '../IssueStatus';
import {IssueWithAssignees} from '../IssueWithAssignees';
import {RowSelector} from '../../inputtype/ui/selector/RowSelector';
import Panel = api.ui.panel.Panel;
import LoadMask = api.ui.mask.LoadMask;
import Option = api.ui.selector.Option;
import i18n = api.util.i18n;
import SelectedOptionEvent = api.ui.selector.combobox.SelectedOptionEvent;

interface FilterOptions {
    allOptions: Option<string>,
    assignedToMe: Option<string>,
    assignedByMe: Option<string>
}

export class IssuesPanel
    extends Panel {

    private issueStatus: IssueStatus;

    private issuesList: IssueList;

    private filter: RowSelector;

    private filterOptions: FilterOptions;

    private issueSelectedListeners: { (issue: IssueWithAssignees): void }[] = [];

    constructor(issueStatus: IssueStatus) {
        super(IssueStatus[issueStatus]);

        this.issueStatus = issueStatus;

        this.initElements();
    }

    private initElements() {
        this.issuesList = new IssueList(this.issueStatus);
        this.issuesList.onIssueSelected(issue => this.notifyIssueSelected(issue));

        this.filter = new RowSelector();
        const options = this.filter.createOptions([
            IssuesPanel.makeFilterLabel(i18n('field.all')),
            IssuesPanel.makeFilterLabel(i18n('field.assignedToMe')),
            IssuesPanel.makeFilterLabel(i18n('field.assignedByMe')),
        ]);

        options.forEach(option => (option.selectable = false));

        this.filterOptions = {
            allOptions: options[0],
            assignedToMe: options[1],
            assignedByMe: options[2]
        };

        this.filter.setOptions(options);

        const createSelectionHandler = (select: boolean) => (event: SelectedOptionEvent<string>) => {
            const optionValue = event.getSelectedOption().getOption().value;
            switch (optionValue) {
            case this.filterOptions.allOptions.value:
                // No need to reload the grid, if `All` was (de)selected
                this.setAllOptions(select, false);
                break;
            case this.filterOptions.assignedToMe.value:
                this.setAssignedToMe(select, true);
                break;
            case this.filterOptions.assignedByMe.value:
                this.setAssignedByMe(select, true);
                break;
            }
        };

        this.filter.onOptionSelected(createSelectionHandler(true));
        this.filter.onOptionDeselected(createSelectionHandler(false));
    }

    getIssueList(): IssueList {
        return this.issuesList;
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            this.appendChildren<api.dom.Element>(this.filter, this.issuesList);

            return rendered;
        });
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

    public reload(): wemQ.Promise<void> {
        return this.issuesList.reload();
    }

    public setAllOptions(select: boolean, forceReload: boolean = false) {
        this.filter.clearSelection();
        this.filter.setSelection(this.filterOptions.allOptions, select, true);
        this.issuesList.setLoadAssignedToMe(false);
        this.issuesList.setLoadMyIssues(false);
        if (forceReload) {
            this.issuesList.reload();
        }
    }

    public setAssignedToMe(select: boolean, forceReload: boolean = false) {
        this.filter.clearSelection();
        this.filter.setSelection(this.filterOptions.assignedToMe, select, true);
        this.issuesList.setLoadAssignedToMe(select);
        if (forceReload) {
            this.issuesList.reload();
        }
    }

    public setAssignedByMe(select: boolean, forceReload: boolean = false) {
        this.filter.clearSelection();
        this.filter.setSelection(this.filterOptions.assignedByMe, select, true);
        this.issuesList.setLoadMyIssues(select);
        if (forceReload) {
            this.issuesList.reload();
        }
    }

    public resetFilters() {
        this.filter.clearSelection();
        this.setAllOptions(true, true);
    }

    // private createAssignedToMeCheckbox(): Checkbox {
    //     const assignedToMeCheckbox: Checkbox = Checkbox.create().build();
    //     assignedToMeCheckbox.addClass('assigned-to-me-filter');
    //     assignedToMeCheckbox.onValueChanged(() => {
    //         this.setAssignedToMe(assignedToMeCheckbox.isChecked(), true);
    //     });
    //     assignedToMeCheckbox.setLabel(i18n('field.assignedToMe'));
    //
    //     return assignedToMeCheckbox;
    // }
    //
    // private createMyIssuesCheckbox(): Checkbox {
    //     const myIssuesCheckbox: Checkbox = Checkbox.create().build();
    //     myIssuesCheckbox.addClass('my-issues-filter');
    //     myIssuesCheckbox.onValueChanged(() => {
    //         this.setAssignedByMe(myIssuesCheckbox.isChecked(), true);
    //     });
    //     myIssuesCheckbox.setLabel(i18n('field.myIssues'));
    //
    //     return myIssuesCheckbox;
    // }

    public updateAssignedToMeOption(total: number) {
        const selectable = total > 0;
        const displayValue = IssuesPanel.makeFilterLabel(i18n('field.assignedToMe'), total);

        this.filterOptions.assignedToMe = this.filter.updateOptionValue(this.filterOptions.assignedToMe, displayValue, selectable);

        if (!selectable) {
            this.resetFilters();
        }
    }

    public updateAssignedByMeOption(total: number) {
        const selectable = total > 0;
        const displayValue = IssuesPanel.makeFilterLabel(i18n('field.assignedByMe'), total);

        this.filterOptions.assignedByMe = this.filter.updateOptionValue(this.filterOptions.assignedByMe, displayValue, selectable);

        if (!selectable) {
            this.resetFilters();
        }
    }

    public updateAllOption(total: number) {
        const selectable = total > 0;
        const displayValue = IssuesPanel.makeFilterLabel(i18n('field.all'), total);

        this.filterOptions.allOptions = this.filter.updateOptionValue(this.filterOptions.allOptions, displayValue, selectable);

        if (!selectable) {
            this.filter.clearSelection();
        }
    }

    private static makeFilterLabel(label: string, count: number = 0): string {
        return (count > 0 ? `${label} (${count})` : label);
    }

    setLoadMask(loadMask: LoadMask) {
        this.issuesList.setLoadMask(loadMask);
    }
}
