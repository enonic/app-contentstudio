import {atom} from 'nanostores';
import {$contentTreeItems} from './contentTreeData.store';

export type ContentTreeNodeLoadingState = 'ok' | 'loading' | 'error' | 'requested';

export const $contentTreeRootLoadingState = atom<ContentTreeNodeLoadingState>('requested');

export function reload(): void {
    $contentTreeItems.set([]);
    $contentTreeRootLoadingState.set('requested');
}
