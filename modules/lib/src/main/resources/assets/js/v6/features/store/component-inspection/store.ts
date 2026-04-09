import {atom, computed} from 'nanostores';
import type {Descriptor} from '../../../../app/page/Descriptor';
import {DescriptorBasedComponent} from '../../../../app/page/region/DescriptorBasedComponent';
import {$inspectedItem, $pageVersion} from '../page-editor/store';

//
// * State
//

export const $partDescriptorOptions = atom<Descriptor[]>([]);

export const $layoutDescriptorOptions = atom<Descriptor[]>([]);

export const $componentConfigDescriptor = atom<Descriptor | null>(null);

export const $isComponentInspectionLoading = atom<boolean>(false);

//
// * Computed
//

export const $selectedComponentDescriptorKey = computed(
    [$inspectedItem, $pageVersion],
    (item): string | null => {
        if (item instanceof DescriptorBasedComponent && item.hasDescriptor()) {
            return item.getDescriptorKey().toString();
        }
        return null;
    },
);
