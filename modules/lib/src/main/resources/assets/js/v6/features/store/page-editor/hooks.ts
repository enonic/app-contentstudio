import {useStore} from '@nanostores/preact';
import type {Page} from '../../../../app/page/Page';
import {$page, $pageVersion} from './store';

// Encapsulates the $page + $pageVersion subscription pattern.
// Components no longer need to remember to subscribe to $pageVersion.
export function usePageState(): Page | null {
    const page = useStore($page);
    useStore($pageVersion);
    return page;
}
