import type {PageDescriptor} from '@enonic/page-editor';
import type {Page} from '../../page/Page';
import type {Regions} from '../../page/region/Regions';
import type {Component} from '../../page/region/Component';
import {DescriptorBasedComponent} from '../../page/region/DescriptorBasedComponent';
import {FragmentComponent} from '../../page/region/FragmentComponent';
import {LayoutComponent} from '../../page/region/LayoutComponent';

interface Entry {
    descriptor?: string;
    fragment?: string;
    name?: string;
}

export function pageStateToDescriptor(page: Page | null): PageDescriptor {
    const components: Record<string, Entry> = {};
    if (page == null) return {components};

    const controller = page.getController()?.toString();
    if (controller != null) components['/'] = {descriptor: controller};

    walkRegions(page.getRegions(), components);
    return {components};
}

function walkRegions(regions: Regions | null, out: Record<string, Entry>): void {
    const list = regions?.getRegions() ?? [];
    for (const region of list) {
        for (const component of region.getComponents() ?? []) {
            const path = component.getPath().toString();
            out[path] = buildEntry(component);
            if (component instanceof LayoutComponent) {
                walkRegions(component.getRegions(), out);
            }
        }
    }
}

function buildEntry(component: Component): Entry {
    const entry: Entry = {};
    const name = component.getName()?.toString();
    if (name != null) entry.name = name;

    if (component instanceof DescriptorBasedComponent) {
        const key = component.getDescriptorKey()?.toString();
        if (key != null) entry.descriptor = key;
    } else if (component instanceof FragmentComponent) {
        const id = component.getFragment()?.toString();
        if (id != null) entry.fragment = id;
    }

    return entry;
}
