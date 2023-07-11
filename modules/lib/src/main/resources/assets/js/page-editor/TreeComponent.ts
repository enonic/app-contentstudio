import {assertNotNull} from '@enonic/lib-admin-ui/util/Assert';
import {Page} from '../app/page/Page';
import {Region} from '../app/page/region/Region';
import {Component} from '../app/page/region/Component';

export type ComponentItem = Page | Region | Component;

export class TreeComponent {

    private readonly item: ComponentItem;

    private readonly displayName: string;

    private readonly description: string;

    private readonly iconUrl?: string;

    private readonly iconClass?: string;

    constructor(builder: FullComponentBuilder) {
        assertNotNull(builder.item, 'Component cannot be null');

        this.item = builder.item;
        this.displayName = builder.displayName;
        this.description = builder.description;
        this.iconUrl = builder.iconUrl;
        this.iconClass = builder.iconClass;
    }

    getItem(): ComponentItem {
        return this.item;
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

    static create(): FullComponentBuilder {
        return new FullComponentBuilder();
    }
}

class FullComponentBuilder {

    item: ComponentItem;

    displayName: string;

    description: string;

    iconUrl?: string;

    iconClass?: string;

    setItem(item: ComponentItem): this {
        this.item = item;
        return this;
    }

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

    build(): TreeComponent {
        return new TreeComponent(this);
    }
}
