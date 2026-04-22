import type {ComponentType as PEComponentType, PageDescriptor} from '@enonic/page-editor';
import type {PropertyTree} from '@enonic/lib-admin-ui/data/PropertyTree';
import type {Page} from '../../page/Page';
import type {Regions} from '../../page/region/Regions';
import type {Component} from '../../page/region/Component';
import {ConfigBasedComponent} from '../../page/region/ConfigBasedComponent';
import {DescriptorBasedComponent} from '../../page/region/DescriptorBasedComponent';
import {FragmentComponent} from '../../page/region/FragmentComponent';
import {LayoutComponent} from '../../page/region/LayoutComponent';

interface Entry {
    type?: PEComponentType;
    descriptor?: string;
    fragment?: string;
    name?: string;
    configHash?: string;
}

const STUBBABLE_TYPES: ReadonlySet<PEComponentType> = new Set(['part', 'layout', 'text', 'fragment']);

function toEditorType(component: Component): PEComponentType | undefined {
    const short = component.getType().getShortName() as PEComponentType;
    return STUBBABLE_TYPES.has(short) ? short : undefined;
}

export function pageStateToDescriptor(page: Page | null): PageDescriptor {
    const components: Record<string, Entry> = {};
    if (page == null) return {components};

    if (page.isFragment()) {
        const fragment = page.getFragment();
        if (fragment != null) {
            // ? Fragment content: root entry describes the fragment component itself;
            // ? a layout fragment exposes nested regions via getActiveRegions.
            components['/'] = buildEntry(fragment);
            if (fragment instanceof LayoutComponent) {
                walkRegions(fragment.getRegions(), components);
            }
        }
        return {components};
    }

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

    const type = toEditorType(component);
    if (type != null) entry.type = type;

    const name = component.getName()?.toString();
    if (name != null) entry.name = name;

    if (component instanceof DescriptorBasedComponent) {
        const key = component.getDescriptorKey()?.toString();
        if (key != null) entry.descriptor = key;
    } else if (component instanceof FragmentComponent) {
        const id = component.getFragment()?.toString();
        if (id != null) entry.fragment = id;
    }

    // ! Feed the iframe's `entryChanged` predicate a stable fingerprint of `config` so
    // ! InspectPanel edits (which leave type/descriptor/fragment/name untouched) still
    // ! trigger a `load(existing:true)` refresh. Without configHash, config-only edits
    // ! mutate CS state but never reach the iframe — the "edits lost until save" symptom.
    if (component instanceof ConfigBasedComponent) {
        const hash = computeConfigHash(component.getConfig());
        if (hash != null) entry.configHash = hash;
    }

    return entry;
}

function computeConfigHash(config: PropertyTree | null): string | undefined {
    if (config == null) return undefined;
    // ? PropertyArrayJson preserves insertion order, so the serialized form is stable
    // ? for a given logical config. A non-stable serializer would churn the hash on
    // ? every push and defeat the point.
    const json = JSON.stringify(config.toJson());
    return fnv1aHex(json);
}

// ? FNV-1a 32-bit. Fast, stable, no dependencies. Not cryptographic — only used to
// ? detect config drift, so collision resistance is not a requirement.
function fnv1aHex(input: string): string {
    let hash = 0x811c9dc5;
    for (let i = 0; i < input.length; i++) {
        hash ^= input.charCodeAt(i);
        hash = (hash + ((hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24))) >>> 0;
    }
    return hash.toString(16);
}
