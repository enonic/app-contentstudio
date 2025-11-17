import {AggregationSelection} from '@enonic/lib-admin-ui/aggregation/AggregationSelection';
import {atom, map} from 'nanostores';

type ContentFilterStore = {
    value: string;
    selection: AggregationSelection[];
};

export const $contentFilterState = map<ContentFilterStore>({
    value: '',
    selection: [],
});

export const $contentFilterOpen = atom<boolean>(false);

export function setContentFilterValue(value: string): void {
    $contentFilterState.setKey('value', value);
}

export function setContentFilterSelection(selection: AggregationSelection[]): void {
    $contentFilterState.setKey('selection', selection);
}

export function setContentFilterOpen(open: boolean): void {
    $contentFilterOpen.set(open);
}

// TODO: Enonic UI - Remove legacy functions

export function getFilterValue(): string {
    return $contentFilterState.get().value;
}

export function getFilterSelection(): AggregationSelection[] {
    return $contentFilterState.get().selection;
}

export function hasFilterSet(): boolean {
    return hasFilterValueSet() || hasFilterSelectionSet();
}

export function hasFilterValueSet(): boolean {
    const value = getFilterValue();
    return typeof value === 'string' && value.trim().length > 0;
}

export function hasFilterSelectionSet(): boolean {
    return getFilterSelection().length > 0;
}

export function resetContentFilter(): void {
    $contentFilterState.set({
        value: '',
        selection: [],
    });
}

export function deselectAllFilterBuckets(): void {
    $contentFilterState.setKey('selection', []);
}
