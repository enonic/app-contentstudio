import {ContentLayer, ContentLayerBuilder} from '../content/ContentLayer';

export class ContentLayerExtended
    extends ContentLayer {

    private level: number;

    private hasChildren: boolean;

    constructor(source: ContentLayer, level: number, hasChildren: boolean = false) {
        super(new ContentLayerBuilder()
            .setName(source.getName())
            .setParentName(source.getParentName())
            .setDescription(source.getDescription())
            .setDisplayName(source.getDisplayName())
            .setLanguage(source.getLanguage())
            .setIcon(source.getIcon()));

        this.level = level;
        this.hasChildren = hasChildren;
    }

    getLevel(): number {
        return this.level;
    }

    hasChildLayers(): boolean {
        return this.hasChildren;
    }

}
