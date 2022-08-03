import {ProjectDialogStepData} from './ProjectDialogStepData';

export class ProjectIdDialogStepData extends ProjectDialogStepData {

    private name: string;

    private displayName: string;

    private description: string;

    setName(value: string): ProjectIdDialogStepData {
        this.name = value;
        return this;
    }

    setDisplayName(value: string): ProjectIdDialogStepData {
        this.displayName = value;
        return this;
    }

    setDescription(value: string): ProjectIdDialogStepData {
        this.description = value;
        return this;
    }

    getName(): string {
        return this.name;
    }

    getDisplayName(): string {
        return this.displayName;
    }

    getDescription(): string {
        return this.description;
    }
}
