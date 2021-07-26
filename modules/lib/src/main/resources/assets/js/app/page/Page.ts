import {ObjectHelper} from 'lib-admin-ui/ObjectHelper';
import {Cloneable} from 'lib-admin-ui/Cloneable';
import {Equitable} from 'lib-admin-ui/Equitable';
import {PropertyTree} from 'lib-admin-ui/data/PropertyTree';
import {PropertyTreeHelper} from 'lib-admin-ui/util/PropertyTreeHelper';
import {PageTemplateKey} from './PageTemplateKey';
import {Regions} from './region/Regions';
import {Component} from './region/Component';
import {ImageComponentType} from './region/ImageComponentType';
import {ImageComponent} from './region/ImageComponent';
import {Region} from './region/Region';
import {FragmentComponentType} from './region/FragmentComponentType';
import {FragmentComponent} from './region/FragmentComponent';
import {LayoutComponent} from './region/LayoutComponent';
import {LayoutComponentType} from './region/LayoutComponentType';
import {ComponentTypeWrapperJson} from './region/ComponentTypeWrapperJson';
import {ComponentFactory} from './region/ComponentFactory';
import {PageJson} from './PageJson';
import {ComponentPath} from './region/ComponentPath';
import {ComponentType} from './region/ComponentType';
import {TextComponentType} from './region/TextComponentType';
import {PartComponentType} from './region/PartComponentType';
import {ComponentJson} from './region/ComponentJson';
import {ConfigBasedComponent} from './region/ConfigBasedComponent';
import {DescriptorKey} from './DescriptorKey';
import {ContentId} from '../content/ContentId';

export class Page
    implements Equitable, Cloneable {

    private controller: DescriptorKey;

    private template: PageTemplateKey;

    private regions: Regions;

    private fragment: Component;

    private config: PropertyTree;

    private customized: boolean;

    constructor(builder: PageBuilder) {
        this.controller = builder.controller;
        this.template = builder.template;
        this.regions = builder.regions;
        this.fragment = builder.fragment;
        this.config = builder.config;
        this.customized = builder.customized;
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

    hasRegions(): boolean {
        return this.regions != null;
    }

    hasNonEmptyRegions(): boolean {
        return this.hasRegions() && !this.getRegions().isEmpty();
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

    isCustomized(): boolean {
        return this.customized;
    }

    getFragment(): Component {
        return this.fragment;
    }

    isFragment(): boolean {
        return this.fragment != null;
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
            customized: this.customized
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

    public doesFragmentContainId(id: ContentId): boolean {
        let containsId = false;
        const fragmentCmp = this.getFragment();
        if (fragmentCmp && ObjectHelper.iFrameSafeInstanceOf(fragmentCmp.getType(), ImageComponentType)) {
            const imageCmp: ImageComponent = <ImageComponent>fragmentCmp;
            containsId = imageCmp.hasImage() && imageCmp.getImage().equals(id);
        }

        return containsId;
    }

    public doRegionsContainId(regions: Region[], id: ContentId, fragments: ContentId[] = []): boolean {
        return regions.some((region: Region) => {
            return region.getComponents().some((component: Component) => {
                if (ObjectHelper.iFrameSafeInstanceOf(component.getType(), FragmentComponentType)) {
                    fragments.push((<FragmentComponent>component).getFragment());
                }
                if (ObjectHelper.iFrameSafeInstanceOf(component.getType(), ImageComponentType)) {
                    return (<ImageComponent>component).getImage().equals(id);
                }
                if (ObjectHelper.iFrameSafeInstanceOf(component.getType(), LayoutComponentType)) {
                    return this.doRegionsContainId((<LayoutComponent>component).getRegions().getRegions(),
                        id,
                        fragments);
                }
                return false;
            });
        });
    }

    public getPropertyValueUsageCount(container: Page | LayoutComponent, name: string, value: string, startFrom: number = 0): number {
        let counter: number = startFrom;
        const regions: Region[] = container.getRegions().getRegions();

        regions.forEach((region: Region) => {
            region.getComponents().forEach((component: Component) => {
                if (ObjectHelper.iFrameSafeInstanceOf(component, ConfigBasedComponent)) {
                    const config: PropertyTree = (<ConfigBasedComponent>component).getConfig();

                    if (config.getProperty(name)?.getString() === value) {
                        counter++;
                    }
                }

                if (ObjectHelper.iFrameSafeInstanceOf(component, LayoutComponent)) {
                    counter = this.getPropertyValueUsageCount(<LayoutComponent>component, name, value, counter);
                }
            });
        });

        return counter;
    }

    findComponentByPath(componentPath: ComponentPath, regions?: Region[]): Component {
        if (componentPath == null) {
            return null;
        }

        const regionsList = regions != null ? regions : this.getRegions().getRegions();

        for (let i = 0; i < regionsList.length; i++) {
            const regionPath = `${regionsList[i].getPath().toString()}/`;
            if (componentPath.toString().indexOf(regionPath) !== 0) {
                continue;
            }

            const components = regionsList[i].getComponents();
            for (let j = 0; j < components.length; j++) {
                const component = components[j];
                if (ObjectHelper.iFrameSafeInstanceOf(component.getType(), ComponentType)) {
                    if ((component).getPath().equals(componentPath)) {
                        return component;
                    }
                }
                if (ObjectHelper.iFrameSafeInstanceOf(component.getType(), LayoutComponentType)) {
                    const layout = <LayoutComponent>component;
                    return this.findComponentByPath(componentPath, layout.getRegions().getRegions());
                }
            }
        }

        return null;
    }
}

export class PageBuilder {

    controller: DescriptorKey;

    template: PageTemplateKey;

    regions: Regions;

    config: PropertyTree;

    customized: boolean;

    fragment: Component;

    constructor(source?: Page) {
        if (source) {
            this.controller = source.getController();
            this.template = source.getTemplate();
            this.regions = source.getRegions() ? source.getRegions().clone() : Regions.create().build();
            this.config = source.getConfig() ? source.getConfig().copy() : null;
            this.customized = source.isCustomized();
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
        this.setCustomized(json.customized);

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

    public setCustomized(value: boolean): PageBuilder {
        this.customized = value;
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
