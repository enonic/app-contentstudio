import {ImageStyleJson, ImageStyleParamsJson, ImageStyleRequiresJson} from './ImageStylesDescriptor';

export class ImageStyle {

    private name: string;
    private displayName: string;
    private type: string;
    private params: ImageStyleParamsJson;
    private requires: ImageStyleRequiresJson;

    constructor(json: ImageStyleJson) {
        this.name = json.name;
        this.displayName = json.displayName;
        this.type = json.type;
        this.params = json.params;
        this.requires = json.requires;
    }

    getName(): string {
        return this.name;
    }

    getDisplayName(): string {
        return this.displayName;
    }

    getType(): string {
        return this.type;
    }
}
