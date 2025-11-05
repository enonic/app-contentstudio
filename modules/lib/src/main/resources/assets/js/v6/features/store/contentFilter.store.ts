import {AggregationSelection} from '@enonic/lib-admin-ui/aggregation/AggregationSelection';
import {map} from 'nanostores';

type ContentFilterStore = {
    value: string | undefined;
    selection: AggregationSelection[];
};

export const $contentFilterState = map<ContentFilterStore>({
    value: undefined,
    selection: [],
});

export function setContentFilterValue(value: string | undefined): void {
    $contentFilterState.setKey('value', value);
}

export function setContentFilterSelection(selection: AggregationSelection[]): void {
    $contentFilterState.setKey('selection', selection);
}

// LEGACY functions for backward compatibility

export function getFilterValue(): string | undefined {
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
        value: undefined,
        selection: [],
    });
}

export function deselectAllFilterBuckets(): void {
    $contentFilterState.setKey('selection', []);
}
