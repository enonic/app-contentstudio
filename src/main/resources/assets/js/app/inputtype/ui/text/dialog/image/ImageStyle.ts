import {ImageStyleJson, ImageStyleParamsJson, ImageStyleRequiresJson} from './ImageStylesDescriptor';

enum StyleType {
    WIDTH = 'width',
    ALIGNMENT = 'alignment',
    STYLE = 'style'
}

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

    isWidthType(): boolean {
        return this.type == StyleType.WIDTH;
    }

    isAlignmentType(): boolean {
        return this.type == StyleType.ALIGNMENT;
    }

    isStyleType(): boolean {
        return this.type == StyleType.STYLE;
    }
}
