import {atom} from 'nanostores';

export type PortalComponentType = 'part' | 'layout' | 'text' | 'fragment';

export type DragState = {
    itemType: PortalComponentType;
    itemLabel: string;
    x: number;
    y: number;
    dropAllowed: boolean;
};

//
// * Drag state for v6 InsertPanel -> legacy iframe drag bridge
//

export const $dragState = atom<DragState | null>(null);

export function startDrag(initial: DragState): void {
    $dragState.set(initial);
}

export function updateDrag(partial: Partial<DragState>): void {
    const current = $dragState.get();
    if (current == null) return;
    $dragState.set({...current, ...partial});
}

export function endDrag(): void {
    $dragState.set(null);
}
