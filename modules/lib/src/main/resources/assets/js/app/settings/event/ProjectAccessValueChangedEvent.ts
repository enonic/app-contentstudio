import {ProjectAccess} from '../access/ProjectAccess';

export class ProjectAccessValueChangedEvent {

    private oldValue: ProjectAccess;

    private newValue: ProjectAccess;

    constructor(oldValue: ProjectAccess, newValue: ProjectAccess) {
        this.oldValue = oldValue;
        this.newValue = newValue;
    }

    getOldValue(): ProjectAccess {
        return this.oldValue;
    }

    getNewValue(): ProjectAccess {
        return this.newValue;
    }
}
