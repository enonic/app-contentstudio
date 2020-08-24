import {ClassHelper} from 'lib-admin-ui/ClassHelper';
import {Event} from 'lib-admin-ui/event/Event';
import {NewSettingsItemEvent} from './NewSettingsItemEvent';
import {Project} from '../data/project/Project';

export class NewProjectEvent
    extends NewSettingsItemEvent {

    private readonly parentProject: Project;

    constructor(parentProject?: Project) {
        super();
        this.parentProject = parentProject;
    }

    getParentProject(): Project {
        return this.parentProject;
    }

    static on(handler: (event: NewProjectEvent) => void) {
        Event.bind(ClassHelper.getFullName(this), handler);
    }

    static un(handler?: (event: NewProjectEvent) => void) {
        Event.unbind(ClassHelper.getFullName(this), handler);
    }
}
