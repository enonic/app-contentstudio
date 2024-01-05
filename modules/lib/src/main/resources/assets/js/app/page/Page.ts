import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';
import {Cloneable} from '@enonic/lib-admin-ui/Cloneable';
import {Equitable} from '@enonic/lib-admin-ui/Equitable';
import {PropertyTree} from '@enonic/lib-admin-ui/data/PropertyTree';
import {PropertyTreeHelper} from '@enonic/lib-admin-ui/util/PropertyTreeHelper';
import {PageTemplateKey} from './PageTemplateKey';
import {Regions} from './region/Regions';
import {Component} from './region/Component';
import {Region} from './region/Region';
import {ComponentFactory} from './region/ComponentFactory';
import {PageJson} from './PageJson';
import {ComponentPath} from './region/ComponentPath';
import {DescriptorKey} from './DescriptorKey';
import {PageItem} from './region/PageItem';
import {ComponentAddedEvent} from './region/ComponentAddedEvent';
import {ComponentRemovedEvent} from './region/ComponentRemovedEvent';
import {ComponentUpdatedEvent} from './region/ComponentUpdatedEvent';
import {PageUpdatedEvent} from './event/PageUpdatedEvent';
import {PageItemType} from './region/PageItemType';
import {LayoutComponent} from './region/LayoutComponent';

export type PageUpdatedEventHandler = (event: PageUpdatedEvent) => void;
export type PageTemplateSetHandler = (template: PageTemplateKey) => void;
export type PageControllerSetHandler = (controller: DescriptorKey) => void;
export type PageResetHandler = () => void;
export type PageConfigUpdateHandler = () => void;

export class Page
    implements Equitable, Cloneable, PageItem {

    private readonly controller: DescriptorKey;

    private readonly template: PageTemplateKey;

    private readonly regions: Regions;

    private readonly fragment: Component;

    private readonly config: PropertyTree;

    constructor(builder: PageBuilder) {
        this.controller = builder.controller;
        this.template = builder.template;
        this.regions = builder.regions;
        this.fragment = builder.fragment;
        this.config = builder.config;

        this.regions?.getRegions().forEach((region: Region) => region.setParent(this));
    }

    hasController(): boolean {
        return this.controller != null;
    }

    getController(): DescriptorKey {
        return this.controller;
    }

    hasTemplate(): boolean {
        return this.template != null;
    }

    getTemplate(): PageTemplateKey {
        return this.template;
    }

    hasNonEmptyRegions(): boolean {
        return this.regions != null && !this.getRegions().isEmpty();
    }

    getRegions(): Regions {
        return this.regions;
    }

    hasConfig(): boolean {
        return this.config != null;
    }

    hasNonEmptyConfig(): boolean {
        return this.hasConfig() && !this.getConfig().isEmpty();
    }

    getConfig(): PropertyTree {
        return this.config;
    }

    getFragment(): Component {
        return this.fragment;
    }

    isFragment(): boolean {
        return this.fragment != null;
    }

    getPath(): ComponentPath {
        return ComponentPath.root();
    }

    equals(o: Equitable): boolean {

        if (!ObjectHelper.iFrameSafeInstanceOf(o, Page)) {
            return false;
        }

        let other = o as Page;

        if (!ObjectHelper.equals(this.controller, other.controller)) {
            return false;
        }
        if (!ObjectHelper.equals(this.template, other.template)) {
            return false;
        }
        if (!this.regionsEquals(other.regions)) {
            return false;
        }
        if (!ObjectHelper.equals(this.fragment, other.fragment)) {
            return false;
        }

        return PropertyTreeHelper.propertyTreesEqual(this.config, other.config);
    }

    toJson(): PageJson {
        return {
            controller: this.controller ? this.controller.toString() : undefined,
            template: this.template ? this.template.toString() : undefined,
            regions: this.regions ? this.regions.toJson() : undefined,
            fragment: this.fragment?.toJson() || null,
            config: this.config ? this.config.toJson() : undefined,
        };
    }

    private regionsEquals(otherRegions: Regions): boolean {
        if (!this.regions && (!otherRegions || otherRegions.isEmpty())) {
            return true;
        }

        if (!otherRegions && (!this.regions || this.regions.isEmpty())) {
            return true;
        }

        return ObjectHelper.equals(this.regions, otherRegions);
    }

    clone(): Page {
        return new PageBuilder(this).build();
    }

    getType(): PageItemType {
        return 'page';
    }

    getComponentByPath(path: ComponentPath): PageItem {
        if (path.isRoot()) {
            return this.isFragment() ? this.getFragment() : this;
        }

        let result = null;

        this.getActiveRegions()?.getRegions().some((region: Region) => {
            if (region.getPath().equals(path)) {
                result = region;
                return true;
            }

            result = region.getComponentByPath(path);

            return !!result;
        });

        return result;
    }

    private getActiveRegions(): Regions {
        return this.fragment instanceof LayoutComponent ? this.fragment.getRegions() : this.regions;
    }

    getParent(): PageItem {
        return null;
    }

    onComponentAdded(listener: (event: ComponentAddedEvent) => void) {
        this.getActiveRegions()?.getEventsManager().onComponentAdded(listener);
    }

    unComponentAdded(listener: (event: ComponentAddedEvent) => void) {
        this.getActiveRegions()?.getEventsManager().unComponentAdded(listener);
    }

    onComponentRemoved(listener: (event: ComponentRemovedEvent) => void) {
        this.getActiveRegions()?.getEventsManager().onComponentRemoved(listener);
    }

    unComponentRemoved(listener: (event: ComponentRemovedEvent) => void) {
        this.getActiveRegions()?.getEventsManager().unComponentRemoved(listener);
    }

    onComponentUpdated(listener: (event: ComponentUpdatedEvent) => void) {
        this.getActiveRegions()?.getEventsManager().onComponentUpdated(listener);
        this.fragment?.onComponentUpdated(listener);
    }

    unComponentUpdated(listener: (event: ComponentUpdatedEvent) => void) {
        this.getActiveRegions()?.getEventsManager().onComponentUpdated(listener);
        this.fragment?.unComponentUpdated(listener);
    }
}

export class PageBuilder {

    controller: DescriptorKey;

    template: PageTemplateKey;

    regions: Regions;

    config: PropertyTree;

    fragment: Component;

    constructor(source?: Page) {
        if (source) {
            this.controller = source.getController();
            this.template = source.getTemplate();
            this.regions = source.getRegions()?.clone();
            this.config = source.getConfig() ? source.getConfig().copy() : null;
            this.fragment = source.isFragment() ? source.getFragment().clone() : null;
        }
    }

    public fromJson(json: PageJson): PageBuilder {
        this.setController(json.controller ? DescriptorKey.fromString(json.controller) : null);
        this.setTemplate(json.template ? PageTemplateKey.fromString(json.template) : null);
        this.setRegions(json.regions != null ? ComponentFactory.createRegionsFromJson(json.regions) : null);
        this.setConfig(json.config != null
                       ? PropertyTree.fromJson(json.config)
                       : null);

        if (json.fragment) {
            let component: Component = ComponentFactory.createFromJson(json.fragment, 0, null);
            this.setFragment(component);
        }

        return this;
    }

    public setController(value: DescriptorKey): PageBuilder {
        this.controller = value;
        return this;
    }

    public setTemplate(value: PageTemplateKey): PageBuilder {
        this.template = value;
        return this;
    }

    public setRegions(value: Regions): PageBuilder {
        this.regions = value;
        return this;
    }

    public setConfig(value: PropertyTree): PageBuilder {
        this.config = value;
        return this;
    }

    public setFragment(value: Component): PageBuilder {
        this.fragment = value;
        return this;
    }

    public build(): Page {
        return new Page(this);
    }
}
