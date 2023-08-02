import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';
import {Cloneable} from '@enonic/lib-admin-ui/Cloneable';
import {Equitable} from '@enonic/lib-admin-ui/Equitable';
import {PropertyTree} from '@enonic/lib-admin-ui/data/PropertyTree';
import {PropertyTreeHelper} from '@enonic/lib-admin-ui/util/PropertyTreeHelper';
import {PageTemplateKey} from './PageTemplateKey';
import {Regions} from './region/Regions';
import {Component} from './region/Component';
import {ImageComponentType} from './region/ImageComponentType';
import {Region} from './region/Region';
import {FragmentComponentType} from './region/FragmentComponentType';
import {LayoutComponentType} from './region/LayoutComponentType';
import {ComponentTypeWrapperJson} from './region/ComponentTypeWrapperJson';
import {ComponentFactory} from './region/ComponentFactory';
import {PageJson} from './PageJson';
import {ComponentPath} from './region/ComponentPath';
import {TextComponentType} from './region/TextComponentType';
import {PartComponentType} from './region/PartComponentType';
import {ComponentJson} from './region/ComponentJson';
import {DescriptorKey} from './DescriptorKey';
import {PageItem} from './region/PageItem';
import {ComponentAddedEvent} from './region/ComponentAddedEvent';
import {ComponentRemovedEvent} from './region/ComponentRemovedEvent';
import {ComponentUpdatedEvent} from './region/ComponentUpdatedEvent';
import {PageControllerUpdatedEvent} from './event/PageControllerUpdatedEvent';
import {PageTemplateUpdatedEvent} from './event/PageTemplateUpdatedEvent';
import {PageConfigUpdatedEvent} from './event/PageConfigUpdatedEvent';
import {PageUpdatedEvent} from './event/PageUpdatedEvent';
import {PageItemType} from './region/PageItemType';

export type PageUpdatedEventHandler = (event: PageUpdatedEvent) => void;
export type PageTemplateSetHandler = (template: PageTemplateKey) => void;
export type PageControllerSetHandler = (controller: DescriptorKey) => void;
export type PageResetHandler = () => void;

export class Page
    implements Equitable, Cloneable, PageItem {

    private controller: DescriptorKey;

    private template: PageTemplateKey;

    private regions: Regions;

    private fragment: Component;

    private config: PropertyTree;

    private pageUpdatedListeners: PageUpdatedEventHandler[] = [];

    constructor(builder: PageBuilder) {
        this.controller = builder.controller;
        this.template = builder.template;
        this.regions = builder.regions || Regions.create().build();
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

    setController(value: DescriptorKey): void {
        const oldValue = this.controller;
        this.controller = value;

        if (!ObjectHelper.equals(oldValue, value)) {
            this.notifyPageUpdated(new PageControllerUpdatedEvent(value, oldValue));
        }
    }

    hasTemplate(): boolean {
        return this.template != null;
    }

    getTemplate(): PageTemplateKey {
        return this.template;
    }

    setTemplate(value: PageTemplateKey): void {
        const oldValue = this.template;
        this.template = value;

        if (!ObjectHelper.equals(oldValue, value)) {
            this.notifyPageUpdated(new PageTemplateUpdatedEvent(value, oldValue));
        }
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

    setConfig(value: PropertyTree): void {
        const oldValue = this.config;
        this.config = value;

        if (!ObjectHelper.equals(oldValue, value)) {
            this.notifyPageUpdated(new PageConfigUpdatedEvent(value));
        }
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

        let other = <Page>o;

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
        let componentJson: ComponentJson;
        if (this.fragment) {
            const json = this.fragment.toJson();
            switch (this.fragment.getType()) {
            case ImageComponentType.get():
                componentJson = json.ImageComponent;
                break;
            case TextComponentType.get():
                componentJson = json.TextComponent;
                break;
            case PartComponentType.get():
                componentJson = json.PartComponent;
                break;
            case LayoutComponentType.get():
                componentJson = json.LayoutComponent;
                break;
            case FragmentComponentType.get():
                componentJson = json.FragmentComponent;
                break;
            }
        }

        return {
            controller: this.controller ? this.controller.toString() : undefined,
            template: this.template ? this.template.toString() : undefined,
            regions: this.regions ? this.regions.toJson() : undefined,
            fragment: componentJson,
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
        let result = null;

        this.regions.getRegions().some((region: Region) => {
            if (region.getPath().equals(path)) {
                result = region;
                return true;
            }

            result = region.getComponentByPath(path);

            return !!result;
        });

        return result;
    }

    getParent(): PageItem {
        return null;
    }

    onComponentAdded(listener: (event: ComponentAddedEvent) => void) {
        this.regions.getEventsManager().onComponentAdded(listener);
    }

    unComponentAdded(listener: (event: ComponentAddedEvent) => void) {
        this.regions.getEventsManager().unComponentAdded(listener);
    }

    onComponentRemoved(listener: (event: ComponentRemovedEvent) => void) {
        this.regions.getEventsManager().onComponentRemoved(listener);
    }

    unComponentRemoved(listener: (event: ComponentRemovedEvent) => void) {
        this.regions.getEventsManager().unComponentRemoved(listener);
    }

    onComponentUpdated(listener: (event: ComponentUpdatedEvent) => void) {
        this.regions.getEventsManager().onComponentUpdated(listener);
    }

    unComponentUpdated(listener: (event: ComponentUpdatedEvent) => void) {
        this.regions.getEventsManager().onComponentUpdated(listener);
    }

    onPageUpdated(listener: PageUpdatedEventHandler): void {
        this.pageUpdatedListeners.push(listener);
    }

    unPageUpdated(listener: PageUpdatedEventHandler): void {
        this.pageUpdatedListeners = this.pageUpdatedListeners.filter(l => l !== listener);
    }

    notifyPageUpdated(event: PageUpdatedEvent): void {
        this.pageUpdatedListeners.forEach(listener => listener(event));
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
            this.regions = source.getRegions() ? source.getRegions().clone() : Regions.create().build();
            this.config = source.getConfig() ? source.getConfig().copy() : null;
            this.fragment = source.isFragment() ? source.getFragment().clone() : null;
        }
    }

    public fromJson(json: PageJson): PageBuilder {
        this.setController(json.controller ? DescriptorKey.fromString(json.controller) : null);
        this.setTemplate(json.template ? PageTemplateKey.fromString(json.template) : null);
        this.setRegions(json.regions != null ? ComponentFactory.createRegionsFromJson(json.regions) : Regions.create().build());
        this.setConfig(json.config != null
                       ? PropertyTree.fromJson(json.config)
                       : null);

        if (json.fragment) {
            let component: Component = ComponentFactory.createFromJson(json.fragment as ComponentTypeWrapperJson, 0, null);
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
