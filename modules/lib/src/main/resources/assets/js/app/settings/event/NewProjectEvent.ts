import {ClassHelper} from '@enonic/lib-admin-ui/ClassHelper';
import {Event} from '@enonic/lib-admin-ui/event/Event';
import {NewSettingsItemEvent} from './NewSettingsItemEvent';
import {Project} from '../data/project/Project';
import {SettingsType} from '../data/type/SettingsType';

export class NewProjectEvent
    extends NewSettingsItemEvent {

    private readonly parent: Project;
    private readonly type: SettingsType;

    constructor(type: SettingsType, parent?: Project) {
        super();

        this.type = type;
        this.parent = parent;
    }

    getParentProject(): Project {
        return this.parent;
    }

    getProjectType(): SettingsType {
        return this.type;
    }

    static on(handler: (event: NewProjectEvent) => void) {
        Event.bind(ClassHelper.getFullName(this), handler);
    }

    static un(handler?: (event: NewProjectEvent) => void) {
        Event.unbind(ClassHelper.getFullName(this), handler);
    }
}
