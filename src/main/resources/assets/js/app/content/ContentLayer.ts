import {ContentLayerJson} from '../resource/json/ContentLayerJson';
import {Attachment, AttachmentBuilder} from '../attachment/Attachment';

export class ContentLayer {

    private name: string;

    private parentName: string;

    private displayName: string;

    private description: string;

    private language: string;

    private icon: Attachment;

    private static DEFAULT_LAYER_NAME: string = 'base';

    constructor(builder: ContentLayerBuilder) {
        this.name = builder.name;
        this.parentName = builder.parentName;
        this.displayName = builder.displayName;
        this.description = builder.description;
        this.language = builder.language;
        this.icon = builder.icon;
    }

    static fromJson(json: ContentLayerJson): ContentLayer {
        return new ContentLayerBuilder().fromContentLayerJson(json).build();
    }

    getName(): string {
        return this.name;
    }

    getParentName(): string {
        return this.parentName;
    }

    getDisplayName(): string {
        return this.displayName;
    }

    getDescription(): string {
        return this.description;
    }

    getLanguage(): string {
        return this.language;
    }

    getIcon(): Attachment {
        return this.icon;
    }

    isBaseLayer(): boolean {
        return this.name === ContentLayer.DEFAULT_LAYER_NAME;
    }
}

export class ContentLayerBuilder {

    name: string;

    parentName: string;

    displayName: string;

    description: string;

    language: string;

    icon: Attachment;

    fromContentLayerJson(json: ContentLayerJson): ContentLayerBuilder {
        this.name = json.name;
        this.parentName = json.parentName;
        this.displayName = json.displayName;
        this.description = json.description;
        this.language = json.language;
        this.icon = !!json.icon ? new AttachmentBuilder().fromJson(json.icon).build() : null;

        return this;
    }

    build(): ContentLayer {
        return new ContentLayer(this);
    }

    setName(value: string): ContentLayerBuilder {
        this.name = value;
        return this;
    }

    setParentName(value: string): ContentLayerBuilder {
        this.parentName = value;
        return this;
    }

    setDisplayName(value: string): ContentLayerBuilder {
        this.displayName = value;
        return this;
    }

    setDescription(value: string): ContentLayerBuilder {
        this.description = value;
        return this;
    }

    setLanguage(value: string): ContentLayerBuilder {
        this.language = value;
        return this;
    }

    setIcon(value: Attachment): ContentLayerBuilder {
        this.icon = value;
        return this;
    }

}
