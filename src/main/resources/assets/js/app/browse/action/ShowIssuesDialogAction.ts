import {ShowIssuesDialogEvent} from '../ShowIssuesDialogEvent';
import {Action} from 'lib-admin-ui/ui/Action';

export class ShowIssuesDialogAction
    extends Action {

    private assignedToMe: boolean = false;
    private createdByMe: boolean = false;

    constructor() {
        super();
        this.setEnabled(true);
        this.onExecuted(() => {
            new ShowIssuesDialogEvent().setAssignedToMe(this.assignedToMe).setCreatedByMe(this.createdByMe).fire();
        });
    }

    setAssignedToMe(value: boolean): ShowIssuesDialogAction {
        this.assignedToMe = value;

        return this;
    }

    setCreatedByMe(value: boolean) {
        this.createdByMe = value;
    }

}
