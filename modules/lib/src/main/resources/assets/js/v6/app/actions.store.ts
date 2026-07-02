import { atom } from 'nanostores';

//
// * Actions Refresh Signal
//
// This store signals when toolbar/context menu actions need to be refreshed
// due to content changes (publish, update, permissions) for currently selected items.
//
// Currently, actions are only re-evaluated on selection change. This store bridges
// the gap by detecting when selected content changes and signaling a refresh.
// The socket wiring lives in actions.service.ts, started from the app root.
//

//
// * Future: Action State Calculations
//
// This store can be extended to centralize action state calculations:
//
// 1. Move enabled/disabled logic from ContentTreeActions.updateActionsEnabledState()
//    to computed stores here, e.g.:
//    - $canPublish = computed([$currentItems, $permissions], ...)
//    - $canDelete = computed([$currentItems, $permissions], ...)
//    - $canEdit = computed([$currentItems, $permissions], ...)
//
// 2. ContentTreeGridItemsState could become a computed store combining:
//    - Current selection items
//    - Cached permissions
//    - Derived action availability flags
//
// 3. Actions would subscribe to these computed stores instead of being
//    imperatively updated via updateActionsEnabledState()
//
// This would eliminate the need for manual refresh signals and make
// action state fully reactive.
//

//
// * Stores
//

/**
 * Signals when actions need refresh due to content changes.
 * Value is timestamp of last signal, 0 means no refresh needed.
 *
 * Components should subscribe to this and call their action refresh logic
 * when a non-zero timestamp is received.
 */
export const $actionsNeedRefresh = atom<number>(0);

//
// * Actions
//

/** Clear the refresh signal after handling */
export function clearActionsRefreshSignal(): void {
    $actionsNeedRefresh.set(0);
}
