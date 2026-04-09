import {showError, showSuccess} from '@enonic/lib-admin-ui/notify/MessageBus';
import {QueryField} from '@enonic/lib-admin-ui/query/QueryField';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {computed, map} from 'nanostores';
import type {ContentSummary} from '../../../../app/content/ContentSummary';
import {ContentSummaryAndCompareStatusFetcher} from '../../../../app/resource/ContentSummaryAndCompareStatusFetcher';
import {OrderChildContentRequest} from '../../../../app/resource/OrderChildContentRequest';
import {OrderContentRequest} from '../../../../app/resource/OrderContentRequest';
import {ChildOrder} from '../../../../app/resource/order/ChildOrder';
import {FieldOrderExprBuilder} from '../../../../app/resource/order/FieldOrderExpr';
import {OrderChildMovement} from '../../../../app/resource/order/OrderChildMovement';
import {OrderChildMovements} from '../../../../app/resource/order/OrderChildMovements';
import type {
    SortDirection,
    SortElementId,
    SortManualMovement,
    SortOrderOption,
    SortOrderOptionId,
} from './sortDialog.types';

type SortDialogStore = {
    open: boolean;
    loading: boolean;
    submitting: boolean;
    failed: boolean;
    parent: ContentSummary | undefined;
    items: ContentSummary[];
    selectedOptionId: SortOrderOptionId;
    initialOptionId: SortOrderOptionId;
    hasManualChanges: boolean;
    manualMovements: SortManualMovement[];
};

const DEFAULT_SORT_OPTION_ID: SortOrderOptionId = 'modified:DESC';

const initialState: SortDialogStore = {
    open: false,
    loading: false,
    submitting: false,
    failed: false,
    parent: undefined,
    items: [],
    selectedOptionId: DEFAULT_SORT_OPTION_ID,
    initialOptionId: DEFAULT_SORT_OPTION_ID,
    hasManualChanges: false,
    manualMovements: [],
};

const SORT_OPTION_MAP: Record<SortOrderOptionId, SortOrderOption> = {
    'modified:ASC': {element: 'modified', direction: 'ASC'},
    'modified:DESC': {element: 'modified', direction: 'DESC'},
    'created:ASC': {element: 'created', direction: 'ASC'},
    'created:DESC': {element: 'created', direction: 'DESC'},
    'displayName:ASC': {element: 'displayName', direction: 'ASC'},
    'displayName:DESC': {element: 'displayName', direction: 'DESC'},
    'publish:ASC': {element: 'publish', direction: 'ASC'},
    'publish:DESC': {element: 'publish', direction: 'DESC'},
    manual: {element: 'manual', direction: 'DESC'},
};

const SORT_ELEMENT_FIELD: Record<SortElementId, string> = {
    modified: QueryField.MODIFIED_TIME,
    created: QueryField.CREATED_TIME,
    displayName: QueryField.DISPLAY_NAME,
    publish: QueryField.PUBLISH_FIRST,
    manual: QueryField.MANUAL_ORDER_VALUE,
};

const fetcher = new ContentSummaryAndCompareStatusFetcher();
let instanceId = 0;

const moveItem = (
    items: ContentSummary[],
    fromIndex: number,
    toIndex: number
): ContentSummary[] => {
    if (fromIndex === toIndex) {
        return items;
    }

    const nextItems = [...items];
    const [movedItem] = nextItems.splice(fromIndex, 1);
    nextItems.splice(toIndex, 0, movedItem);
    return nextItems;
};

const createManualMovement = (
    items: readonly ContentSummary[],
    fromIndex: number,
    toIndex: number
): SortManualMovement => {
    const movedItem = items[fromIndex];
    const moveBeforeItem = items[toIndex > fromIndex ? toIndex + 1 : toIndex];

    return {
        contentId: movedItem.getContentId(),
        moveBefore: moveBeforeItem?.getContentId(),
    };
};

const toOrderChildMovements = (movements: SortManualMovement[]): OrderChildMovements => {
    const result = new OrderChildMovements();
    movements.forEach(({contentId, moveBefore}) => {
        result.addChildMovement(new OrderChildMovement(contentId, moveBefore));
    });
    return result;
};

const startsWithField = (orderExprText: string, field: string): boolean => {
    return orderExprText.startsWith(field.toLowerCase());
};

const isSortOrderOptionId = (value: string): value is SortOrderOptionId => {
    return value in SORT_OPTION_MAP;
};

const toSortOrderOptionIdFromChildOrder = (order: ChildOrder | null | undefined): SortOrderOptionId => {
    if (!order) {
        return DEFAULT_SORT_OPTION_ID;
    }

    if (order.isManual()) {
        return 'manual';
    }

    const direction: SortDirection = order.isDesc() ? 'DESC' : 'ASC';
    const firstExprText = order.getOrderExpressions()[0]?.toString().toLowerCase() ?? '';

    if (startsWithField(firstExprText, QueryField.CREATED_TIME)) {
        return `created:${direction}`;
    }
    if (startsWithField(firstExprText, QueryField.DISPLAY_NAME)) {
        return `displayName:${direction}`;
    }
    if (startsWithField(firstExprText, QueryField.PUBLISH_FIRST)) {
        return `publish:${direction}`;
    }
    if (startsWithField(firstExprText, QueryField.MODIFIED_TIME)) {
        return `modified:${direction}`;
    }

    return DEFAULT_SORT_OPTION_ID;
};

const toChildOrder = (optionId: SortOrderOptionId): ChildOrder => {
    const {element, direction} = SORT_OPTION_MAP[optionId];
    const field = SORT_ELEMENT_FIELD[element];

    const order = new ChildOrder();
    order.addOrderExpr(
        new FieldOrderExprBuilder()
            .setFieldName(field)
            .setDirection(element === 'manual' ? 'DESC' : direction)
            .build(),
    );

    return order;
};

// TODO: Rewrite the loading from scratch:
// - use content tore to manage the loading state
// - load in batches
// - preload the ids first and keep them or fake them with known count to avoid dialog resize
// - Use ResultAsync and modern fetchers
async function reloadSortDialogItems(): Promise<void> {
    const callId = ++instanceId;
    const {open, parent, selectedOptionId} = $sortDialog.get();
    if (!open || !parent) {
        return;
    }

    $sortDialog.setKey('loading', true);
    $sortDialog.setKey('failed', false);

    try {
        const order = toChildOrder(selectedOptionId);
        const response = await fetcher.fetchChildren(parent.getContentId(), 0, 200, order);
        if (callId !== instanceId) {
            return;
        }

        $sortDialog.set({
            ...$sortDialog.get(),
            items: response.getContents().map(c => c.getContentSummary()),
            loading: false,
            failed: false,
        });
    } catch (error) {
        if (callId !== instanceId) {
            return;
        }
        $sortDialog.setKey('failed', true);
        $sortDialog.setKey('loading', false);
        showError(error?.message ?? String(error));
    }
}

export const $sortDialog = map<SortDialogStore>(structuredClone(initialState));

export const $isSortDialogAltered = computed($sortDialog, (state) => {
    return state.selectedOptionId !== state.initialOptionId || state.hasManualChanges;
});

export const $isSortDialogReady = computed([$sortDialog, $isSortDialogAltered], (state, altered) => {
    return state.open && !state.loading && !state.submitting && !state.failed && altered;
});

export const setSortDialogOrderSelection = (selection: readonly string[]): void => {
    const next = selection[0];
    if (!next || !isSortOrderOptionId(next)) {
        return;
    }

    const current = $sortDialog.get();
    $sortDialog.set({
        ...current,
        selectedOptionId: next,
        hasManualChanges: next === 'manual' ? current.hasManualChanges : false,
        manualMovements: next === 'manual' ? current.manualMovements : [],
    });
};

export const startSortDialogManualReorder = (): void => {
    const state = $sortDialog.get();
    if (state.selectedOptionId === 'manual') {
        return;
    }

    $sortDialog.set({
        ...state,
        selectedOptionId: 'manual',
    });
};

export const reorderSortDialogItems = (fromIndex: number, toIndex: number): void => {
    const state = $sortDialog.get();
    const isWithinBounds = fromIndex >= 0
        && toIndex >= 0
        && fromIndex < state.items.length
        && toIndex < state.items.length;
    if (!isWithinBounds || fromIndex === toIndex) {
        return;
    }

    const nextMovement = createManualMovement(state.items, fromIndex, toIndex);
    $sortDialog.set({
        ...state,
        selectedOptionId: 'manual',
        items: moveItem(state.items, fromIndex, toIndex),
        hasManualChanges: true,
        manualMovements: [...state.manualMovements, nextMovement],
    });
};

export const submitSortDialogAction = async (): Promise<boolean> => {
    const state = $sortDialog.get();
    if (state.loading || state.failed || state.submitting || !state.parent) {
        return false;
    }

    const isAltered = $isSortDialogAltered.get();
    if (!isAltered) {
        return false;
    }

    const {parent, selectedOptionId, manualMovements} = state;
    const order = toChildOrder(selectedOptionId);

    $sortDialog.setKey('submitting', true);

    try {
        if (selectedOptionId === 'manual') {
            const movements = toOrderChildMovements(manualMovements);
            await new OrderChildContentRequest()
                .setManualOrder(true)
                .setContentId(parent.getContentId())
                .setChildOrder(order)
                .setContentMovements(movements)
                .sendAndParse();
        } else {
            await new OrderContentRequest()
                .setContentId(parent.getContentId())
                .setChildOrder(order)
                .sendAndParse();
        }

        const parentDisplayName = parent.getDisplayName() || parent.getPath()?.toString() || i18n('dialog.sort');
        showSuccess(i18n('dialog.sort.success', parentDisplayName));
        closeSortDialog();
        return true;
    } catch {
        showError(i18n('dialog.sort.failed'));
        $sortDialog.setKey('submitting', false);
        return false;
    }
};

export const openSortDialog = (parent: ContentSummary): void => {
    const initialOptionId = toSortOrderOptionIdFromChildOrder(parent.getChildOrder());

    $sortDialog.set({
        ...structuredClone(initialState),
        open: true,
        parent,
        selectedOptionId: initialOptionId,
        initialOptionId,
    });
};

export const closeSortDialog = (): void => {
    $sortDialog.set(structuredClone(initialState));
};

$sortDialog.subscribe((state, previous) => {
    if (!state.open) {
        return;
    }

    const openedNow = !previous?.open;
    const sortChanged = state.selectedOptionId !== previous?.selectedOptionId;

    const shouldReload = openedNow || (sortChanged && state.selectedOptionId !== 'manual');
    if (shouldReload) {
        void reloadSortDialogItems();
    }
});
