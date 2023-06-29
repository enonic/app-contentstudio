import {Page} from '../page/Page';
import {Regions, RegionsBuilder} from '../page/region/Regions';
import {Region} from '../page/region/Region';
import {Component} from '../page/region/Component';
import {LayoutComponent} from '../page/region/LayoutComponent';
import * as Q from 'q';
import {LayoutComponentType} from '../page/region/LayoutComponentType';
import {Descriptor} from '../page/Descriptor';
import {RegionDescriptor} from '../page/RegionDescriptor';
import {DescriptorKey} from '../page/DescriptorKey';
import {ComponentType} from '../page/region/ComponentType';
import {GetComponentDescriptorRequest} from '../resource/GetComponentDescriptorRequest';
import {Exception, ExceptionType} from '@enonic/lib-admin-ui/Exception';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';

export class PageHelper {

    public static getPageWithoutEmptyRegions(source: Page): Page {
        if (!source) {
            return null;
        }

        const page: Page = source.clone(); // making sure that working with cloned obj

        if (page.getRegions()) {
            this.cleanUpRegions(page.getRegions());
        }

        if (page.getFragment()) {
            this.cleanUpFragment(page.getFragment());
        }

        return page;
    }

    private static cleanUpRegions(source: Regions): void {
        const emptyRegions: Region[] = source.getRegions().filter((region: Region) => region.isEmpty());
        source.removeRegions(emptyRegions);

        source.getRegions()
            .filter((region: Region) => !region.isEmpty())
            .forEach((region: Region) => this.cleanUpRegion(region));
    }

    private static cleanUpRegion(region: Region): void {
        region.getComponents()
            .filter((component: Component) => component.getType().getShortName() === LayoutComponentType.get().getShortName())
            .forEach((layoutComponent: LayoutComponent) => this.cleanUpLayout(layoutComponent));
    }

    private static cleanUpLayout(layoutComponent: LayoutComponent): void {
        this.cleanUpRegions(layoutComponent.getRegions());
    }

    private static cleanUpFragment(fragment: Component): void {
        if (fragment.getType().getShortName() === LayoutComponentType.get().getShortName()) {
            return this.cleanUpLayout(fragment as LayoutComponent);
        }
    }

    public static fetchAndInjectLayoutRegions(layout: LayoutComponent): Q.Promise<void> {
        return this.loadDescriptor(layout.getDescriptorKey(), LayoutComponentType.get()).then((descriptor: Descriptor) => {
            const builder: RegionsBuilder = Regions.create();

            descriptor.getRegions().forEach((regionDescriptor: RegionDescriptor) => {
                const regionToAdd: Region = layout.getRegions()?.getRegionByName(regionDescriptor.getName()) ||
                                            Region.create().setName(regionDescriptor.getName()).setParentPath(layout.getPath()).build();
                builder.addRegion(regionToAdd);
            });

            layout.setRegions(builder.build());

            return Q.resolve();
        });
    }

    public static loadDescriptor(key: DescriptorKey, type?: ComponentType): Q.Promise<Descriptor> {
        return new GetComponentDescriptorRequest(key.toString(), type).sendAndParse().then((pageDescriptor: Descriptor) => {
            return pageDescriptor;
        }).catch(() => {
            throw new Exception(i18n('live.view.page.error.descriptornotfound', key), ExceptionType.WARNING);
        });
    }
}
