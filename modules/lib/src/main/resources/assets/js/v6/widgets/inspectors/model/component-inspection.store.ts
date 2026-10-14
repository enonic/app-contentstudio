import { atom, computed } from 'nanostores';
import type { ContentSummary } from '../../../../app/content/ContentSummary';
import type { Descriptor } from '../../../../app/page/Descriptor';
import type { Page } from '../../../../app/page/Page';
import { ComponentPath } from '../../../../app/page/region/ComponentPath';
import { DescriptorBasedComponent } from '../../../../app/page/region/DescriptorBasedComponent';
import { FragmentComponent } from '../../../../app/page/region/FragmentComponent';
import type { PageItem } from '../../../../app/page/region/PageItem';
import { $inspectedItem, $pageVersion } from './page-editor/store';

//
// * State
//

export const $partDescriptorOptions = atom<Descriptor[]>([]);

export const $layoutDescriptorOptions = atom<Descriptor[]>([]);

export const $arePartDescriptorsResolved = atom(false);

export const $areLayoutDescriptorsResolved = atom(false);

export const $partDescriptorRefreshVersion = atom(0);

export const $componentConfigDescriptor = atom<Descriptor | null>(null);

export const $isComponentInspectionLoading = atom<boolean>(false);

//
// * Computed
//

export const $selectedComponentDescriptorKey = computed([$inspectedItem, $pageVersion], (item): string | null => {
    if (item instanceof DescriptorBasedComponent && item.hasDescriptor()) {
        return item.getDescriptorKey().toString();
    }
    return null;
});

//
// * API
//

// Returns true when the component at nodeId points at a reference that no longer
// exists: a fragment whose content was removed, or a part/layout whose descriptor
// is missing from the loaded options.
export function isComponentReferenceMissing(
    nodeId: string,
    page: Page | null,
    fragments: ContentSummary[],
    descriptors: Descriptor[],
    isResolved: boolean,
): boolean {
    if (!isResolved) {
        return false;
    }

    const component = page?.getComponentByPath(ComponentPath.fromString(nodeId)) ?? null;
    return isReferenceMissing(component, fragments, descriptors);
}

export function isReferenceMissing(
    component: PageItem | null,
    fragments: ContentSummary[],
    descriptors: Descriptor[],
    resolved?: { fragment: boolean; part: boolean; layout: boolean },
): boolean {
    if (component instanceof FragmentComponent) {
        if (resolved && !resolved.fragment) {
            return false;
        }
        if (!component.hasFragment()) return false;
        const id = component.getFragment().toString();
        return !fragments.some((f) => f.getId() === id);
    }

    if (component instanceof DescriptorBasedComponent) {
        const type = component.getType().getShortName();
        if (resolved && ((type === 'part' && !resolved.part) || (type === 'layout' && !resolved.layout))) {
            return false;
        }
        if (!component.hasDescriptor()) return false;
        const key = component.getDescriptorKey().toString();
        return !descriptors.some((d) => d.getKey().toString() === key);
    }

    return false;
}

//
// * Commands
//

export function resetComponentInspection(): void {
    $partDescriptorOptions.set([]);
    $layoutDescriptorOptions.set([]);
    $arePartDescriptorsResolved.set(false);
    $areLayoutDescriptorsResolved.set(false);
    $componentConfigDescriptor.set(null);
    $isComponentInspectionLoading.set(false);
}
