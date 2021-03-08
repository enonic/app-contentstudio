import {Event} from 'lib-admin-ui/event/Event';

export class ProjectServerEvent extends Event {

    private projectName: string;

    constructor(name: string) {
        super();

        this.projectName = name;
    }

    getProjectName(): string {
        return this.projectName;
    }

}
