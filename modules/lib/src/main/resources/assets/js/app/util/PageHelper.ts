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
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {ConfigBasedComponent} from '../page/region/ConfigBasedComponent';
import {PropertyTree} from '@enonic/lib-admin-ui/data/PropertyTree';
import {ContentId} from '../content/ContentId';
import {FragmentComponent} from '../page/region/FragmentComponent';
import {ImageComponent} from '../page/region/ImageComponent';
import {Content} from '../content/Content';
import {CreateFragmentRequest} from '../../page-editor/CreateFragmentRequest';
import {ContentContext} from '../wizard/ContentContext';
import {StringHelper} from '@enonic/lib-admin-ui/util/StringHelper';
import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';

export class PageHelper {

    public static fetchAndInjectLayoutRegions(layout: LayoutComponent): Q.Promise<void> {
        if (!layout?.hasDescriptor()) {
            return Q();
        }

        return this.loadDescriptor(layout.getDescriptorKey(), LayoutComponentType.get()).then((descriptor: Descriptor) => {
            layout.setDescriptor(descriptor);
        });
    }

    public static loadDescriptor(key: DescriptorKey, type?: ComponentType): Q.Promise<Descriptor> {
        return new GetComponentDescriptorRequest(key.toString(), type).sendAndParse().then((pageDescriptor: Descriptor) => {
            return pageDescriptor;
        }).catch(() => {
            throw Error(i18n('live.view.page.error.descriptornotfound', key));
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
                    page.getRegions()?.getRegions().forEach((persistedRegion: Region) => {
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

        const fragment: Component = page.getFragment();

        if (fragment instanceof LayoutComponent && fragment.hasDescriptor()) {
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
                if (component instanceof ConfigBasedComponent) {
                    const config: PropertyTree = (component).getConfig();

                    if (config.getProperty(name)?.getString() === value) {
                        counter++;
                    }
                }

                if (component instanceof LayoutComponent) {
                    counter = this.getPropertyValueUsageCount(component, name, value, counter);
                }
            });
        });

        return counter;
    }

    public static doRegionsContainId(regions: Region[], id: ContentId, fragments: ContentId[] = []): boolean {
        return regions.some((region: Region) => {
            return region.getComponents().some((component: Component) => {
                if (component instanceof FragmentComponent) {
                    const contentId = component.getFragment();
                    if (contentId) {
                        fragments.push(contentId);
                    }
                }
                if (component instanceof ImageComponent) {
                    return component.getImage().equals(id);
                }
                if (component instanceof LayoutComponent) {
                    return this.doRegionsContainId(component.getRegions().getRegions(),
                        id,
                        fragments);
                }
                return false;
            });
        });
    }

    public static doesFragmentContainId(fragment: Component, id: ContentId): boolean {
        let containsId = false;

        if (fragment instanceof ImageComponent) {
            containsId = fragment.hasImage() && fragment.getImage().equals(id);
        }

        return containsId;
    }

    static getPageIconClass(page: Page): string {
        const largeIconCls = ' icon-large';

        if (page?.hasTemplate()) {
            return 'icon-page-template' + largeIconCls;
        }

        if (page?.getController()) {
            return 'icon-file' + largeIconCls;
        }

        return 'icon-wand' + largeIconCls;
    }

    static createFragmentFromComponent(component: Component): Q.Promise<Content> {
        if (!component) {
            throw new Error('Failed to create fragment: no source component');
        }

        const content = ContentContext.get().getContent();

        if (!content) {
            throw new Error('Failed to create fragment: contend id is not available');
        }

        const contentId: ContentId = content?.getContentId();
        const config = null;

        const request: CreateFragmentRequest =
            new CreateFragmentRequest(contentId)
                .setConfig(config)
                .setComponent(component)
                .setWorkflow(content.getContentSummary().getWorkflow());

        return request.sendAndParse();
    }

    public static findFragmentInRegionsByFragmentId(regions: Region[], fragmentId: ContentId): FragmentComponent {
        let result: FragmentComponent = null;

        regions?.some((region: Region) => {
            result = PageHelper.findFragmentInRegionByFragmentId(region, fragmentId);

            return !!result;
        });

        return result;
    }

    public static findFragmentInRegionByFragmentId(region: Region, fragmentId: ContentId): FragmentComponent {
        let result: FragmentComponent = null;

        region.getComponents().some((component: Component) => {
            if (component instanceof FragmentComponent) {
                if (component.getFragment()?.equals(fragmentId)) {
                    result = component;
                } else if (component instanceof LayoutComponent) {
                    result = PageHelper.findFragmentInRegionsByFragmentId(component.getRegions()?.getRegions(), fragmentId);
                }
            }

            return !!result;
        });

        return result;
    }

    public static stringEqualsIgnoreEmpty(a: string, b: string): boolean {
        return (StringHelper.isEmpty(a) && StringHelper.isEmpty(b)) || ObjectHelper.stringEquals(a, b);
    }

    public static flattenPageComponents(page: Page, type?: ComponentType): Component[] {
        if (!page) {
            return [];
        }

        const result = PageHelper.getFlatPageComponents(page);

        return type ? result.filter(component => component.getType().getShortName() === type.getShortName()) : result;
    }

    private static getFlatPageComponents(page: Page): Component[] {
        if (page.isFragment()) {
            const fragmentComponent = page.getFragment();

            if (fragmentComponent instanceof LayoutComponent) {
                return [fragmentComponent, ...PageHelper.flattenRegionsComponents(fragmentComponent.getRegions())];
            }

            return [fragmentComponent];
        }

        return PageHelper.flattenRegionsComponents(page.getRegions());
    }

    private static flattenRegionsComponents(regions: Regions): Component[] {
        const result = [];

        regions.getRegions().forEach((region: Region) => {
            PageHelper.flattenRegion(region).forEach(component => result.push(component));
        });

        return result;
    }

    private static flattenRegion(region: Region): Component[] {
        const result = [];

        region.getComponents().forEach(component => {
            PageHelper.flattenComponent(component).forEach(c => result.push(c));
        });

        return result;
    }

    private static flattenComponent(component: Component): Component[] {
        if (component instanceof LayoutComponent) {
            return [component, ...PageHelper.flattenRegionsComponents(component.getRegions())];
        }

        return [component];
    }
}
