import {type ComponentTypeWrapperJson} from './ComponentTypeWrapperJson';
import {type Component} from './Component';
import {Region} from './Region';
import {PartComponentBuilder} from './PartComponent';
import {ImageComponentBuilder} from './ImageComponent';
import {type LayoutComponent, LayoutComponentBuilder} from './LayoutComponent';
import {TextComponentBuilder} from './TextComponent';
import {FragmentComponentBuilder} from './FragmentComponent';
import {type RegionJson} from './RegionJson';
import {Regions} from './Regions';
import {type Page} from '../Page';
import {type ComponentType} from './ComponentType';
import {FragmentComponentType} from './FragmentComponentType';
import {LayoutComponentType} from './LayoutComponentType';
import {PartComponentType} from './PartComponentType';
import {TextComponentType} from './TextComponentType';
import {ImageComponentType} from './ImageComponentType';

export class ComponentFactory {

    public static createFromJson(json: ComponentTypeWrapperJson, componentIndex: number, region: Region): Component {

        if (json.PartComponent) {
            return new PartComponentBuilder().fromJson(json.PartComponent).setParent(region).build();
        } else if (json.ImageComponent) {
            return new ImageComponentBuilder().fromJson(json.ImageComponent).setParent(region).build();
        } else if (json.LayoutComponent) {
            const regions = ComponentFactory.createRegionsFromJson(json.LayoutComponent.regions);
            return new LayoutComponentBuilder()
                .fromJson(json.LayoutComponent)
                .setParent(region)
                .setIndex(componentIndex)
                .setRegions(regions)
                .build();
        } else if (json.TextComponent) {
            return new TextComponentBuilder().fromJson(json.TextComponent).setParent(region).setIndex(componentIndex).build();
        } else if (json.FragmentComponent) {
            return new FragmentComponentBuilder().fromJson(json.FragmentComponent).setParent(region).setIndex(componentIndex).build();
        } else {
            throw new Error('Not a component that can be placed in a Region: ' + JSON.stringify(json));
        }
    }

    public static createRegionsFromJson(regionsJson: RegionJson[], parent?: LayoutComponent | Page): Regions {
        return Regions.create().setRegions(regionsJson.map((regionJson: RegionJson) => {
            const region = Region.create().setName(regionJson.name).setParent(parent).build();

            regionJson.components.forEach((componentJson: ComponentTypeWrapperJson, componentIndex: number) => {
                const component: Component = ComponentFactory.createFromJson(componentJson, componentIndex, region);
                region.addComponent(component);
            });

            return region;
        })).build();
    }

    public static createByType(parentRegion: Region, type: ComponentType): Component {
        if (type instanceof FragmentComponentType) {
            return new FragmentComponentBuilder().setParent(parentRegion).setName(type.getDefaultName()).build();
        }

        if (type instanceof LayoutComponentType) {
            return new LayoutComponentBuilder().setParent(parentRegion).setName(type.getDefaultName()).build();
        }

        if (type instanceof PartComponentType) {
            return new PartComponentBuilder().setParent(parentRegion).setName(type.getDefaultName()).build();
        }

        if (type instanceof TextComponentType) {
            return new TextComponentBuilder().setParent(parentRegion).setName(type.getDefaultName()).build();
        }

        if (type instanceof ImageComponentType) {
            return new ImageComponentBuilder().setParent(parentRegion).setName(type.getDefaultName()).build();
        }

        throw new Error('Unable to create component with type: ' + type?.getShortName());
    }
}
