import { atom, computed } from 'nanostores';
import type { PageTemplate } from '../../../../app/content/PageTemplate';
import type { Descriptor } from '../../../../app/page/Descriptor';
import {
    $contentContext,
    $hasDefaultPageTemplate,
    $page,
    $pageEditorLifecycle,
    $pageVersion,
} from './page-editor/store';

export const AUTO_KEY = '__auto__';

//
// * State
//

export const $pageTemplateOptions = atom<PageTemplate[]>([]);

export const $pageControllerOptions = atom<Descriptor[]>([]);

export const $pageConfigDescriptor = atom<Descriptor | null>(null);

export const $isPageInspectionLoading = atom<boolean>(false);

export const $arePageTemplatesResolved = atom<boolean>(false);

//
// * Computed
//

export const $selectedPageOptionKey = computed([$page, $pageVersion], (page): string | null => {
    if (!page) return AUTO_KEY;
    if (page.hasController()) return page.getController().toString();
    if (page.hasTemplate()) return page.getTemplate().toString();
    return AUTO_KEY;
});

// A template outside the loaded options was deleted, or its application is no
// longer assigned to the site. Either way the reference is dead.
export const $isSelectedTemplateMissing = computed(
    [$page, $pageVersion, $selectedPageOptionKey, $pageTemplateOptions, $arePageTemplatesResolved],
    (page, _version, selectedKey, templates, isResolved): boolean => {
        if (!isResolved) {
            return false;
        }
        if (selectedKey == null || selectedKey === AUTO_KEY) return false;
        if (page?.hasController() || !page?.hasTemplate()) return false;

        return !templates.some((template) => template.getKey().toString() === selectedKey);
    },
);

export const $isCustomizeVisible = computed(
    [$pageEditorLifecycle, $contentContext, $page, $pageVersion, $hasDefaultPageTemplate, $isSelectedTemplateMissing],
    (lifecycle, ctx, page, _version, hasDefaultTemplate, isTemplateMissing): boolean => {
        if (!ctx || !lifecycle.isPageLocked || !lifecycle.isPageRenderable) return false;
        // Only a template-driven page can be detached from its template.
        if (page?.hasController() || isTemplateMissing) return false;
        if (!hasDefaultTemplate && !page?.hasTemplate()) return false;

        return !ctx.isInherited || !ctx.isDataInherited;
    },
);

export const $isPageInspectionEmpty = computed(
    [$pageTemplateOptions, $pageControllerOptions, $isPageInspectionLoading, $selectedPageOptionKey],
    (templates, controllers, isLoading, selectedKey): boolean => {
        if (isLoading && templates.length === 0 && controllers.length === 0) {
            return false;
        }
        if (selectedKey !== AUTO_KEY) return false;
        return templates.length === 0 && controllers.length === 0;
    },
);

//
// * Commands
//

export function resetPageInspection(): void {
    $pageTemplateOptions.set([]);
    $arePageTemplatesResolved.set(false);
    $pageControllerOptions.set([]);
    $pageConfigDescriptor.set(null);
    $isPageInspectionLoading.set(false);
}
