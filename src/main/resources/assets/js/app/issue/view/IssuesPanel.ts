import Panel = api.ui.panel.Panel;
import Checkbox = api.ui.Checkbox;
import DivEl = api.dom.DivEl;
import i18n = api.util.i18n;
import LoadMask = api.ui.mask.LoadMask;
import {IssueList} from './IssueList';
import {IssueStatus} from '../IssueStatus';
import {IssueWithAssignees} from '../IssueWithAssignees';

export class IssuesPanel
    extends Panel {

    private issueStatus: IssueStatus;

    private issuesList: IssueList;

    private assignedToMeCheckbox: Checkbox;

    private myIssuesCheckbox: Checkbox;

    private issueSelectedListeners: { (issue: IssueWithAssignees): void }[] = [];

    constructor(issueStatus: IssueStatus) {
        super(IssueStatus[issueStatus]);

        this.issueStatus = issueStatus;
        this.initElements();
    }

    private initElements() {
        this.issuesList = new IssueList(this.issueStatus);
        this.issuesList.onIssueSelected(issue => this.notifyIssueSelected(issue));

        this.myIssuesCheckbox = this.createMyIssuesCheckbox();
        this.assignedToMeCheckbox = this.createAssignedToMeCheckbox();
    }

    getIssueList(): IssueList {
        return this.issuesList;
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            const checkboxesDiv: DivEl = new DivEl('filters').appendChildren(this.myIssuesCheckbox, this.assignedToMeCheckbox);
            this.appendChildren(checkboxesDiv, this.issuesList);
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

    public getItemCount(): number {
        return this.issuesList.getItemCount();
    }

    public reload(): wemQ.Promise<void> {
        return this.issuesList.reload();
    }

    public resetFilters() {
        this.myIssuesCheckbox.setChecked(false, true);
        this.issuesList.setLoadMyIssues(false);
        this.assignedToMeCheckbox.setChecked(false, true);
        this.issuesList.setLoadAssignedToMe(false);
    }

    private createAssignedToMeCheckbox(): Checkbox {
        const assignedToMeCheckbox: Checkbox = Checkbox.create().build();
        assignedToMeCheckbox.addClass('assigned-to-me-filter');
        assignedToMeCheckbox.onValueChanged(() => {
            this.issuesList.setLoadAssignedToMe(assignedToMeCheckbox.isChecked());
            this.issuesList.reload();
        });
        assignedToMeCheckbox.setLabel(i18n('field.assignedToMe'));

        return assignedToMeCheckbox;
    }

    private createMyIssuesCheckbox(): Checkbox {
        const myIssuesCheckbox: Checkbox = Checkbox.create().build();
        myIssuesCheckbox.addClass('my-issues-filter');
        myIssuesCheckbox.onValueChanged(() => {
            this.issuesList.setLoadMyIssues(myIssuesCheckbox.isChecked());
            this.issuesList.reload();
        });
        myIssuesCheckbox.setLabel(i18n('field.myIssues'));

        return myIssuesCheckbox;
    }

    public updateAssignedToMeCheckbox(total: number) {
        this.assignedToMeCheckbox.toggleClass('disabled', total === 0);
        this.assignedToMeCheckbox.setLabel(this.makeFilterLabel(i18n('field.assignedToMe'), total));
        if (total === 0) {
            this.assignedToMeCheckbox.setChecked(false);
        }
    }

    public updateMyIssuesCheckbox(total: number) {
        this.myIssuesCheckbox.toggleClass('disabled', total === 0);
        this.myIssuesCheckbox.setLabel(this.makeFilterLabel(i18n('field.myIssues'), total));
        if (total === 0) {
            this.myIssuesCheckbox.setChecked(false);
        }
    }

    private makeFilterLabel(label: string, count: number): string {
        return (count > 0 ? label + ' (' + count + ')' : label);
    }

    setLoadMask(loadMask: LoadMask) {
        this.issuesList.setLoadMask(loadMask);
    }
}
