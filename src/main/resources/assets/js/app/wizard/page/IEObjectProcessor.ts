import {ComponentName} from '../../page/region/ComponentName';
import {ComponentPath} from '../../page/region/ComponentPath';
import {Region} from '../../page/region/Region';
import {Regions} from '../../page/region/Regions';
import {PageDescriptor} from 'lib-admin-ui/content/page/PageDescriptor';
import {Component} from '../../page/region/Component';
import {ObjectHelper} from 'lib-admin-ui/ObjectHelper';
import {LayoutComponent} from '../../page/region/LayoutComponent';
import {ComponentFactory} from '../../page/region/ComponentFactory';

export class IEObjectProcessor {
    private componentNames: Map<string, string> = new Map();

    copyRegions(regions: Regions): any {
        regions.getRegions().forEach((region: Region) => this.processRegion(region));

        return JSON.parse(JSON.stringify(regions.toJson()));
    }

    private processRegion(region: Region) {
        region.getComponents().forEach((component: Component) => this.processComponent(component));
    }

    private processComponent(component: Component) {
        if (ObjectHelper.iFrameSafeInstanceOf(component, LayoutComponent)) {
            (<LayoutComponent>component).getRegions().getRegions().forEach((region: Region) => this.processRegion(region));
        }

        const path: ComponentPath = component.getPath();

        if (path && component.getName()) {
            this.componentNames.set(path.toString(), component.getName().toString());
        }
    }

    copyPageDescriptor(pageDescriptor: PageDescriptor): any {
        const pageDescriptorCopy: any = JSON.parse(JSON.stringify(pageDescriptor));
        pageDescriptorCopy.key = pageDescriptor.getKey().toString();
        pageDescriptorCopy.config = JSON.parse(JSON.stringify(pageDescriptor.getConfig().toJson()));

        return pageDescriptorCopy;
    }

    restoreRegionsFromCopy(copy: any): Regions {
        const regions: Regions = ComponentFactory.createRegionsFromJson(copy);

        regions.getRegions().forEach((region: Region) => this.restoreNamesInRegion(region));

        return regions;
    }

    private restoreNamesInRegion(region: Region) {
        region.getComponents().forEach((component: Component) => this.restoreNameInComponent(component));
    }

    private restoreNameInComponent(component: Component) {
        if (ObjectHelper.iFrameSafeInstanceOf(component, LayoutComponent)) {
            (<LayoutComponent>component).getRegions().getRegions().forEach((region: Region) => this.restoreNamesInRegion(region));
        }

        component.setName(new ComponentName(this.componentNames.get(component.getPath().toString())));
    }

    restorePageDescriptorFromCopy(copy: any): PageDescriptor {
        return PageDescriptor.fromJson(copy);
    }
}
