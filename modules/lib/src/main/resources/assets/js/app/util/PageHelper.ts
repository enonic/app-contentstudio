import {Page} from '../page/Page';
import {Regions} from '../page/region/Regions';
import {Region} from '../page/region/Region';
import {Component} from '../page/region/Component';
import {LayoutComponent} from '../page/region/LayoutComponent';

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
            .filter((component: Component) => component instanceof LayoutComponent)
            .forEach((layoutComponent: LayoutComponent) => this.cleanUpLayout(layoutComponent));
    }

    private static cleanUpLayout(layoutComponent: LayoutComponent): void {
        this.cleanUpRegions(layoutComponent.getRegions());
    }

    private static cleanUpFragment(fragment: Component): void {
        if (fragment instanceof LayoutComponent) {
            return this.cleanUpLayout(fragment);
        }
    }
}
