import {Page, PageBuilder} from '../page/Page';
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
import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';
import {ConfigBasedComponent} from '../page/region/ConfigBasedComponent';
import {PropertyTree} from '@enonic/lib-admin-ui/data/PropertyTree';
import {ContentId} from '../content/ContentId';
import {FragmentComponentType} from '../page/region/FragmentComponentType';
import {FragmentComponent} from '../page/region/FragmentComponent';
import {ImageComponentType} from '../page/region/ImageComponentType';
import {ImageComponent} from '../page/region/ImageComponent';
import {ComponentPath} from '../page/region/ComponentPath';
import {PageItem} from '../page/region/PageItem';

export class PageHelper {

    public static fetchAndInjectLayoutRegions(layout: LayoutComponent): Q.Promise<void> {
        return this.loadDescriptor(layout.getDescriptorKey(), LayoutComponentType.get()).then((descriptor: Descriptor) => {
            const builder: RegionsBuilder = Regions.create();

            descriptor.getRegions().forEach((regionDescriptor: RegionDescriptor) => {
                const regionToAdd: Region = layout.getRegions()?.getRegionByName(regionDescriptor.getName())?.clone() ||
                                            Region.create().setName(regionDescriptor.getName()).setParent(layout).build();
                builder.addRegion(regionToAdd);
            });

            layout.getRegions().getRegions().forEach((persistedRegion: Region) => {
                if (!descriptor.getRegions().some((d) => d.getName() === persistedRegion.getName())) {
                    builder.addRegion(persistedRegion);
                }
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

    public static injectEmptyRegionsIntoPage(page: Page): Q.Promise<Page> {
        if (page.getController()) {
            return PageHelper.loadDescriptor(page.getController()).then((pageDescriptor: Descriptor) => {
                //fetching descriptor, adding empty regions to page, traversing layouts and adding empty regions to them
                const regionsFetchPromises: Q.Promise<Region>[] = pageDescriptor.getRegions().map((regionDesc: RegionDescriptor) => {
                    const existingRegion: Region = page.getRegions()?.getRegionByName(regionDesc.getName())?.clone();

                    if (existingRegion) {
                        return this.updateExistingRegion(existingRegion);
                    }

                    return Q.resolve(Region.create().setName(regionDesc.getName()).build());
                });

                return Q.all(regionsFetchPromises).then((descriptorRegions: Region[]) => {
                    const fullRegionsBuilder: RegionsBuilder = Regions.create();

                    if (descriptorRegions) {
                        fullRegionsBuilder.setRegions(descriptorRegions);
                    }

                    // adding items persisted in regions that are no longer in descriptor
                    page.getRegions().getRegions().forEach((persistedRegion: Region) => {
                        if (!descriptorRegions.some((d) => d.getName() === persistedRegion.getName())) {
                            fullRegionsBuilder.addRegion(persistedRegion);
                        }
                    });

                    const fullRegions: Regions = fullRegionsBuilder.build();
                    const fullPage: Page = new PageBuilder(page).setRegions(fullRegions).build();

                    return Q.resolve(fullPage);
                });
            });
        }

        if (page.getFragment() && page.getFragment() instanceof LayoutComponent) {
            return this.fetchAndInjectLayoutRegions(page.getFragment() as LayoutComponent).then(() => page);
        }

        return Q.resolve(page);
    }

    private static updateExistingRegion(existingRegion: Region): Q.Promise<Region> {
        const layoutsPromises: Q.Promise<void>[] = existingRegion.getComponents()
            .filter((component: Component) => component instanceof LayoutComponent)
            .filter((layout: LayoutComponent) => layout.getDescriptorKey())
            .map((layout: LayoutComponent) => PageHelper.fetchAndInjectLayoutRegions(layout));

        return Q.all(layoutsPromises).then(() => existingRegion);
    }

    public static getPropertyValueUsageCount(container: Page | LayoutComponent, name: string, value: string,
                                             startFrom: number = 0): number {
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

    public static doRegionsContainId(regions: Region[], id: ContentId, fragments: ContentId[] = []): boolean {
        return regions.some((region: Region) => {
            return region.getComponents().some((component: Component) => {
                if (ObjectHelper.iFrameSafeInstanceOf(component.getType(), FragmentComponentType)) {
                    const contentId = (<FragmentComponent>component).getFragment();
                    if (contentId) {
                        fragments.push(contentId);
                    }
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

    public static doesFragmentContainId(fragment: Component, id: ContentId): boolean {
        let containsId = false;

        if (fragment && ObjectHelper.iFrameSafeInstanceOf(fragment.getType(), ImageComponentType)) {
            const imageCmp: ImageComponent = <ImageComponent>fragment;
            containsId = imageCmp.hasImage() && imageCmp.getImage().equals(id);
        }

        return containsId;
    }
}
