import '../../../api.ts';
import {ShowIssuesDialogEvent} from '../ShowIssuesDialogEvent';

export class ShowIssuesDialogAction extends api.ui.Action {

    private assignedToMe: boolean = false;

    constructor() {
        super();
        this.setEnabled(true);
        this.onExecuted(() => {
            new ShowIssuesDialogEvent().setAssignedToMe(this.assignedToMe).fire();
        });
    }

    setAssignedToMe(value: boolean): ShowIssuesDialogAction {
        this.assignedToMe = value;

        return this;
    }

}
