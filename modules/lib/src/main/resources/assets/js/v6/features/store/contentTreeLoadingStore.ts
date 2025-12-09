import {atom} from 'nanostores';
import {resetContentTreeItems} from './contentTreeData.store';

export type ContentTreeNodeLoadingState = 'ok' | 'loading' | 'error' | 'requested';

export const $contentTreeRootLoadingState = atom<ContentTreeNodeLoadingState>('requested');

export function reload(): void {
    resetContentTreeItems();
    $contentTreeRootLoadingState.set('requested');
}
