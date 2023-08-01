import {ComponentType} from '../app/page/region/ComponentType';
import {ComponentPath} from '../app/page/region/ComponentPath';

export type ComponentItemType = 'page' | 'region' | ComponentType;

export class TreeComponent {

    private readonly type: ComponentItemType;

    private readonly path: ComponentPath;

    private readonly displayName: string;

    private readonly description: string;

    private readonly iconUrl?: string;

    private readonly iconClass?: string;

    constructor(builder: FullComponentBuilder) {
        this.displayName = builder.displayName;
        this.description = builder.description;
        this.iconUrl = builder.iconUrl;
        this.iconClass = builder.iconClass;
        this.type = builder.type;
        this.path = builder.path;
    }

    getDisplayName(): string {
        return this.displayName;
    }

    getDescription(): string {
        return this.description;
    }

    getIconUrl(): string {
        return this.iconUrl;
    }

    getIconClass(): string {
        return this.iconClass;
    }

    getType(): ComponentItemType {
        return this.type;
    }

    getPath(): ComponentPath {
        return this.path;
    }

    static create(): FullComponentBuilder {
        return new FullComponentBuilder();
    }
}

class FullComponentBuilder {

    type: ComponentItemType;

    path: ComponentPath;

    displayName: string;

    description: string;

    iconUrl?: string;

    iconClass?: string;

    setDisplayName(displayName: string): this {
        this.displayName = displayName;
        return this;
    }

    setDescription(description: string): this {
        this.description = description;
        return this;
    }

    setIconUrl(iconUrl: string): this {
        this.iconUrl = iconUrl;
        return this;
    }

    setIconClass(iconClass: string): this {
        this.iconClass = iconClass;
        return this;
    }

    setType(type: ComponentItemType): this {
        this.type = type;
        return this;
    }

    setPath(path: ComponentPath): this {
        this.path = path;
        return this;
    }

    build(): TreeComponent {
        return new TreeComponent(this);
    }
}
