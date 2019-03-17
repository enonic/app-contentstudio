import {ComponentTypeWrapperJson} from './ComponentTypeWrapperJson';
import {Component} from './Component';
import {Region} from './Region';
import {PartComponentBuilder} from './PartComponent';
import {ImageComponentBuilder} from './ImageComponent';
import {LayoutComponentBuilder} from './LayoutComponent';
import {TextComponentBuilder} from './TextComponent';
import {FragmentComponentBuilder} from './FragmentComponent';
import {RegionJson} from './RegionJson';
import {Regions} from './Regions';
import {ComponentPath} from './ComponentPath';

export class ComponentFactory {

    public static createFromJson(json: ComponentTypeWrapperJson, componentIndex: number, region: Region): Component {

        if (json.PartComponent) {
            return new PartComponentBuilder().fromJson(json.PartComponent).setParent(region).build();
        } else if (json.ImageComponent) {
            return new ImageComponentBuilder().fromJson(json.ImageComponent).setParent(region).build();
        } else if (json.LayoutComponent) {
            const hasPath = !!region && componentIndex >= 0;
            const path = hasPath ? Component.fromRegionPathAndComponentIndex(region.getPath(), componentIndex) : null;
            const regions = ComponentFactory.createRegionsFromJson(json.LayoutComponent.regions, path);
            return new LayoutComponentBuilder().setRegions(regions).fromJson(json.LayoutComponent).setParent(region).setIndex(
                componentIndex).build();
        } else if (json.TextComponent) {
            return new TextComponentBuilder().fromJson(json.TextComponent).setParent(region).setIndex(componentIndex).build();
        } else if (json.FragmentComponent) {
            return new FragmentComponentBuilder().fromJson(json.FragmentComponent).setParent(region).setIndex(componentIndex).build();
        } else {
            throw new Error('Not a component that can be placed in a Region: ' + json);
        }
    }

    public static createRegionsFromJson(regionsJson: RegionJson[], parentPath?: ComponentPath): Regions {

        return Regions.create().setRegions(regionsJson.map((regionJson: RegionJson) => {
            const region = Region.create().setName(regionJson.name).setParentPath(parentPath || null).build();

            regionJson.components.forEach((componentJson: ComponentTypeWrapperJson, componentIndex: number) => {
                let component: Component = ComponentFactory.createFromJson(componentJson, componentIndex, region);
                region.addComponent(component);
            });

            return region;
        })).build();
    }
}
