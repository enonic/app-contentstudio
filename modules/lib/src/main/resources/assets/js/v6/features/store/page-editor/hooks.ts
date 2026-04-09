import {useStore} from '@nanostores/preact';
import type {Page} from '../../../../app/page/Page';
import type {PageItem} from '../../../../app/page/region/PageItem';
import type {PageItemType} from '../../../../app/page/region/PageItemType';
import {$contentContext, $defaultPageTemplateName, $inspectedItem, $inspectedItemType, $page, $pageEditorLifecycle, $pageVersion} from './store';
import type {PageEditorContentContext, PageEditorLifecycle} from './types';

// Encapsulates the $page + $pageVersion subscription pattern.
// Components no longer need to remember to subscribe to $pageVersion.
export function usePageState(): Page | null {
    const page = useStore($page);
    useStore($pageVersion);
    return page;
}

export function useContentContext(): PageEditorContentContext | null {
    return useStore($contentContext);
}

export function usePageEditorLifecycle(): PageEditorLifecycle {
    return useStore($pageEditorLifecycle);
}

export function useDefaultPageTemplateName(): string | null {
    return useStore($defaultPageTemplateName);
}

export function useInspectedItem(): PageItem | null {
    return useStore($inspectedItem);
}

export function useInspectedItemType(): PageItemType | null {
    return useStore($inspectedItemType);
}
