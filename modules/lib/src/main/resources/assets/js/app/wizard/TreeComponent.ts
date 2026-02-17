import {type PageItemType} from '../page/region/PageItemType';

export class TreeComponent {

    private readonly type: PageItemType;

    private readonly displayName: string;

    private readonly description: string;

    private readonly iconUrl?: string;

    private readonly iconClass?: string;

    private readonly children: boolean;

    private readonly invalid: boolean;

    private readonly layoutFragment: boolean;

    constructor(builder: TreeComponentBuilder) {
        this.displayName = builder.displayName;
        this.description = builder.description;
        this.iconUrl = builder.iconUrl;
        this.iconClass = builder.iconClass;
        this.type = builder.type;
        this.children = builder.children;
        this.invalid = builder.invalid;
        this.layoutFragment = !!builder.layoutFragment;
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

    getType(): PageItemType {
        return this.type;
    }

    hasChildren(): boolean {
        return this.children;
    }

    isInvalid(): boolean {
        return this.invalid;
    }

    isLayoutFragment(): boolean {
        return this.layoutFragment;
    }

    static create(): TreeComponentBuilder {
        return new TreeComponentBuilder();
    }
}

export class TreeComponentBuilder {

    type: PageItemType;

    displayName: string;

    description: string;

    iconUrl?: string;

    iconClass?: string;

    children: boolean;

    invalid: boolean;

    layoutFragment: boolean;

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

    setType(type: PageItemType): this {
        this.type = type;
        return this;
    }

    setHasChildren(children: boolean): this {
        this.children = children;
        return this;
    }

    setInvalid(invalid: boolean): this {
        this.invalid = invalid;
        return this;
    }

    setLayoutFragment(layoutFragment: boolean): this {
        this.layoutFragment = layoutFragment;
        return this;
    }

    build(): TreeComponent {
        return new TreeComponent(this);
    }
}
