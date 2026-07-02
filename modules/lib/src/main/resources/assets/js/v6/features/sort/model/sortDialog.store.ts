import { showError, showSuccess } from '@enonic/lib-admin-ui/notify/MessageBus';
import { QueryField } from '@enonic/lib-admin-ui/query/QueryField';
import { i18n } from '@enonic/lib-admin-ui/util/Messages';
import { computed, map } from 'nanostores';
import { ContentId } from '../../../../app/content/ContentId';
import type { ContentSummary } from '../../../../app/content/ContentSummary';
import { OrderChildContentRequest } from '../../../../app/resource/OrderChildContentRequest';
import { OrderContentRequest } from '../../../../app/resource/OrderContentRequest';
import { ChildOrder } from '../../../../app/resource/order/ChildOrder';
import { FieldOrderExprBuilder } from '../../../../app/resource/order/FieldOrderExpr';
import { OrderChildMovement } from '../../../../app/resource/order/OrderChildMovement';
import { OrderChildMovements } from '../../../../app/resource/order/OrderChildMovements';
import { fetchContentByIds, $contentCache, getMissingIds } from '../../../entities/content';
import type {
    SortDialogRow,
    SortDirection,
    SortElementId,
    SortManualMovement,
    SortOrderOption,
    SortOrderOptionId,
} from './sortDialog.types';

//
// * Types
//

type SortDialogStore = {
    open: boolean;
    idsLoading: boolean;
    submitting: boolean;
    idsFailed: boolean;
    // Lifecycle guard against stale async results; bumped on close and on each ids reload
    instance: number;
    parent: ContentSummary | undefined;
    itemIds: string[];
    failedBatches: number[];
    selectedOptionId: SortOrderOptionId;
    initialOptionId: SortOrderOptionId;
    hasManualChanges: boolean;
    manualMovements: SortManualMovement[];
};

//
// * Config
//

const DEFAULT_SORT_OPTION_ID: SortOrderOptionId = 'modified:DESC';

const SORT_BATCH_SIZE = 24;

const initialState: SortDialogStore = {
    open: false,
    idsLoading: false,
    submitting: false,
    idsFailed: false,
    instance: 0,
    parent: undefined,
    itemIds: [],
    failedBatches: [],
    selectedOptionId: DEFAULT_SORT_OPTION_ID,
    initialOptionId: DEFAULT_SORT_OPTION_ID,
    hasManualChanges: false,
    manualMovements: [],
};

const SORT_OPTION_MAP: Record<SortOrderOptionId, SortOrderOption> = {
    'modified:ASC': { element: 'modified', direction: 'ASC' },
    'modified:DESC': { element: 'modified', direction: 'DESC' },
    'created:ASC': { element: 'created', direction: 'ASC' },
    'created:DESC': { element: 'created', direction: 'DESC' },
    'displayName:ASC': { element: 'displayName', direction: 'ASC' },
    'displayName:DESC': { element: 'displayName', direction: 'DESC' },
    'publish:ASC': { element: 'publish', direction: 'ASC' },
    'publish:DESC': { element: 'publish', direction: 'DESC' },
    manual: { element: 'manual', direction: 'DESC' },
};

const SORT_ELEMENT_FIELD: Record<SortElementId, string> = {
    modified: QueryField.MODIFIED_TIME,
    created: QueryField.CREATED_TIME,
    displayName: QueryField.DISPLAY_NAME,
    publish: QueryField.PUBLISH_FIRST,
    manual: QueryField.MANUAL_ORDER_VALUE,
};

//
// * Internal State
//

// Tracks in-flight batch loads; shared with the sort dialog service.
export const loadingBatches = new Set<number>();

//
// * Helpers
//

const moveId = (itemIds: string[], fromIndex: number, toIndex: number): string[] => {
    if (fromIndex === toIndex) {
        return itemIds;
    }

    const nextIds = [...itemIds];
    const [movedId] = nextIds.splice(fromIndex, 1);
    nextIds.splice(toIndex, 0, movedId);
    return nextIds;
};

const createManualMovement = (itemIds: readonly string[], fromIndex: number, toIndex: number): SortManualMovement => {
    const movedId = itemIds[fromIndex];
    const moveBeforeId = itemIds[toIndex > fromIndex ? toIndex + 1 : toIndex];

    return {
        contentId: new ContentId(movedId),
        moveBefore: moveBeforeId ? new ContentId(moveBeforeId) : undefined,
    };
};

const toOrderChildMovements = (movements: SortManualMovement[]): OrderChildMovements => {
    const result = new OrderChildMovements();
    movements.forEach(({ contentId, moveBefore }) => {
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

const toBatchStart = (index: number): number => {
    return Math.floor(index / SORT_BATCH_SIZE) * SORT_BATCH_SIZE;
};

const clearFailedBatch = (batchStart: number): void => {
    const { failedBatches } = $sortDialog.get();
    if (!failedBatches.includes(batchStart)) {
        return;
    }
    $sortDialog.setKey(
        'failedBatches',
        failedBatches.filter((start) => start !== batchStart),
    );
};

const markFailedBatch = (batchStart: number): void => {
    const { failedBatches } = $sortDialog.get();
    if (failedBatches.includes(batchStart)) {
        return;
    }
    $sortDialog.setKey('failedBatches', [...failedBatches, batchStart]);
};

export const dropSortDialogItems = (ids: string[]): void => {
    if (ids.length === 0) {
        return;
    }
    const idSet = new Set(ids);
    const state = $sortDialog.get();
    const nextItemIds = state.itemIds.filter((id) => !idSet.has(id));
    if (nextItemIds.length === state.itemIds.length) {
        return;
    }

    // Prune manual movements that reference removed content so submit cannot
    // send a movement for an item that no longer exists.
    const nextMovements = state.manualMovements
        .filter((movement) => !idSet.has(movement.contentId.toString()))
        .map((movement) =>
            movement.moveBefore && idSet.has(movement.moveBefore.toString())
                ? { ...movement, moveBefore: undefined }
                : movement,
        );

    $sortDialog.set({
        ...state,
        itemIds: nextItemIds,
        manualMovements: nextMovements,
    });
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

export const toChildOrder = (optionId: SortOrderOptionId): ChildOrder => {
    const { element, direction } = SORT_OPTION_MAP[optionId];
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

//
// * Stores
//

export const $sortDialog = map<SortDialogStore>(structuredClone(initialState));

export const $sortDialogRows = computed([$sortDialog, $contentCache], (state, cache): SortDialogRow[] => {
    return state.itemIds.map((id) => ({ id, content: cache[id] }));
});

export const $isSortDialogAltered = computed($sortDialog, (state) => {
    return state.selectedOptionId !== state.initialOptionId || state.hasManualChanges;
});

export const $isSortDialogReady = computed([$sortDialog, $isSortDialogAltered], (state, altered) => {
    return state.open && !state.idsLoading && !state.submitting && !state.idsFailed && altered;
});

//
// * Public API
//

export const isSortDialogBatchFailed = (failedBatches: readonly number[], index: number): boolean => {
    return failedBatches.includes(toBatchStart(index));
};

export const ensureSortDialogBatchLoaded = async (index: number): Promise<void> => {
    const { itemIds, instance: callId } = $sortDialog.get();
    const batchStart = toBatchStart(index);
    if (batchStart < 0 || batchStart >= itemIds.length) {
        return;
    }
    if (loadingBatches.has(batchStart)) {
        return;
    }

    const slice = itemIds.slice(batchStart, batchStart + SORT_BATCH_SIZE);
    if (getMissingIds(slice).length === 0) {
        clearFailedBatch(batchStart);
        return;
    }

    loadingBatches.add(batchStart);
    clearFailedBatch(batchStart);

    try {
        await fetchContentByIds(slice);
        if (callId !== $sortDialog.get().instance || !$sortDialog.get().open) {
            return;
        }

        dropSortDialogItems(getMissingIds(slice));
    } catch (error) {
        if (callId !== $sortDialog.get().instance || !$sortDialog.get().open) {
            return;
        }
        markFailedBatch(batchStart);
        showError(error instanceof Error ? error.message : String(error));
    } finally {
        if (callId === $sortDialog.get().instance) {
            loadingBatches.delete(batchStart);
        }
    }
};

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
    const isWithinBounds =
        fromIndex >= 0 && toIndex >= 0 && fromIndex < state.itemIds.length && toIndex < state.itemIds.length;
    if (!isWithinBounds || fromIndex === toIndex) {
        return;
    }

    const nextMovement = createManualMovement(state.itemIds, fromIndex, toIndex);
    $sortDialog.set({
        ...state,
        selectedOptionId: 'manual',
        itemIds: moveId(state.itemIds, fromIndex, toIndex),
        failedBatches: state.failedBatches.length > 0 ? [] : state.failedBatches,
        hasManualChanges: true,
        manualMovements: [...state.manualMovements, nextMovement],
    });
};

export const submitSortDialogAction = async (): Promise<boolean> => {
    const state = $sortDialog.get();
    if (state.idsLoading || state.idsFailed || state.submitting || !state.parent) {
        return false;
    }

    const isAltered = $isSortDialogAltered.get();
    if (!isAltered) {
        return false;
    }

    const { parent, selectedOptionId, manualMovements } = state;
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
            await new OrderContentRequest().setContentId(parent.getContentId()).setChildOrder(order).sendAndParse();
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

    loadingBatches.clear();
    $sortDialog.set({
        ...structuredClone(initialState),
        instance: $sortDialog.get().instance,
        open: true,
        parent,
        selectedOptionId: initialOptionId,
        initialOptionId,
    });
};

export const closeSortDialog = (): void => {
    loadingBatches.clear();
    $sortDialog.set({ ...structuredClone(initialState), instance: $sortDialog.get().instance + 1 });
};
