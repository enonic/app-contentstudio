import {atom, computed} from 'nanostores';
import type {PageTemplate} from '../../../../app/content/PageTemplate';
import type {Descriptor} from '../../../../app/page/Descriptor';
import {$contentContext, $page, $pageEditorLifecycle, $pageVersion} from '../page-editor/store';

//
// * State
//

export const $pageTemplateOptions = atom<PageTemplate[]>([]);

export const $pageControllerOptions = atom<Descriptor[]>([]);

export const $pageConfigDescriptor = atom<Descriptor | null>(null);

export const $isPageInspectionLoading = atom<boolean>(false);

//
// * Computed
//

export const $selectedPageOptionKey = computed(
    [$page, $pageVersion],
    (page): string | null => {
        if (!page) return '__auto__';
        if (page.hasController()) return page.getController().toString();
        if (page.hasTemplate()) return page.getTemplate().toString();
        return '__auto__';
    },
);

export const $isCustomizeVisible = computed(
    [$pageEditorLifecycle, $contentContext],
    (lifecycle, ctx): boolean => {
        if (!ctx || !lifecycle.isPageLocked || !lifecycle.isPageRenderable) return false;
        return !ctx.isInherited || !ctx.isDataInherited;
    },
);
