import { type ResultAsync } from 'neverthrow';
import { type ContentId } from '../../../../app/content/ContentId';
import { type ChildOrder } from '../../../../app/resource/order/ChildOrder';
import { type OrderChildMovements } from '../../../../app/resource/order/OrderChildMovements';
import { requestJson } from '../../../shared/api/client';
import { type AppError } from '../../../shared/api/errors';
import { getCmsApiUrl } from '../../../shared/lib/url/cms';

export type ReorderChildrenParams = {
    contentId: ContentId;
    childOrder: ChildOrder;
    movements: OrderChildMovements;
};

export type SetChildOrderParams = {
    contentId: ContentId;
    childOrder: ChildOrder;
};

/**
 * Manually reorder the children of a content, persisting the explicit movements.
 * Used by: features/sort/model/sortDialog.store.
 */
export function reorderChildren(params: ReorderChildrenParams): ResultAsync<void, AppError> {
    const body = {
        manualOrder: true,
        contentId: params.contentId.toString(),
        childOrder: params.childOrder.toJson(),
        reorderChildren: params.movements.toArrayJson(),
    };

    return requestJson<unknown>(getCmsApiUrl('reorderChildren'), { method: 'POST', body }).map(() => undefined);
}

/**
 * Apply a fixed child order to a content.
 * Used by: features/sort/model/sortDialog.store.
 */
export function setChildOrder(params: SetChildOrderParams): ResultAsync<void, AppError> {
    const body = {
        childOrder: params.childOrder.toJson(),
        contentId: params.contentId.toString(),
    };

    return requestJson<unknown>(getCmsApiUrl('setChildOrder'), { method: 'POST', body }).map(() => undefined);
}
