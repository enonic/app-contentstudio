import {Event} from 'lib-admin-ui/event/Event';
import {ClassHelper} from 'lib-admin-ui/ClassHelper';

export class ShowIssuesDialogEvent
    extends Event {

    private assignedToMe: boolean = false;
    private createdByMe: boolean = false;

    setAssignedToMe(value: boolean): ShowIssuesDialogEvent {
        this.assignedToMe = value;

        return this;
    }

    setCreatedByMe(value: boolean): ShowIssuesDialogEvent {
        this.createdByMe = value;

        return this;
    }

    getAssignedToMe(): boolean {
        return this.assignedToMe;
    }

    getCreatedByMe(): boolean {
        return this.createdByMe;
    }

    static on(handler: (event: ShowIssuesDialogEvent) => void) {
        Event.bind(ClassHelper.getFullName(this), handler);
    }

    static un(handler?: (event: ShowIssuesDialogEvent) => void) {
        Event.unbind(ClassHelper.getFullName(this), handler);
    }
}
