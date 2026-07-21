import { atom, computed } from 'nanostores';

//
// * Reveal-scroll signal
//
// Holds the id of a tree row the grid should scroll into view.
// Set by the reveal service, consumed and cleared by ContentTreeList.
//

const $revealScrollTargetAtom = atom<string | null>(null);

export const $revealScrollTarget = computed($revealScrollTargetAtom, (value) => value);

export function requestRevealScroll(id: string): void {
    $revealScrollTargetAtom.set(id);
}

export function clearRevealScroll(): void {
    if ($revealScrollTargetAtom.get() !== null) {
        $revealScrollTargetAtom.set(null);
    }
}
