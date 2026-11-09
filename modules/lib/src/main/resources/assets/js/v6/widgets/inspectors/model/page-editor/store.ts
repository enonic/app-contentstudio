import { atom, computed, map } from 'nanostores';
import type { Page } from '../../../../../app/page/Page';
import { ComponentPath } from '../../../../../app/page/region/ComponentPath';
import type { PageItem } from '../../../../../app/page/region/PageItem';
import type { PageItemType } from '../../../../../app/page/region/PageItemType';
import { PageState } from '../../../../../app/wizard/page/PageState';
import type { PageEditorContentContext, PageEditorLifecycle } from './types';
import { CONTENT_TYPE } from '../../../../shared/lib/cms/schema/contentTypeName';
import { Component } from '../../../../../app/page/region/Component';

//
// * State
//

export const $pageEditorLifecycle = map<PageEditorLifecycle>({
    inlineEditing: true,
    isPageRenderable: undefined,
    isPageReady: false,
});

export const $page = atom<Page | null>(null);

export const $pageVersion = atom<number>(0);

export const $hasDefaultPageTemplate = atom<boolean>(false);

export const $defaultPageTemplateName = atom<string | null>(null);

export const $contentContext = atom<PageEditorContentContext | null>(null);

// Mirrors what the wizard tells the page editor through `set-modify-allowed`.
export const $isPageModifyAllowed = atom<boolean>(true);

// A save replaces the context object without changing what inspection data applies.
export const $contentScopeKey = computed($contentContext, (ctx): string | null =>
    ctx
        ? JSON.stringify([ctx.contentId.toString(), ctx.contentTypeName, ctx.siteId?.toString() ?? null, ctx.sitePath])
        : null,
);

export const $inspectedPath = atom<string | null>(null);

// ? Bumps on every event accepted for inspection (SELECT/INSPECT/inspectItem),
// ? even when $inspectedPath value is unchanged. Lets consumers react to
// ? "user reselected the same path" (e.g. tab switch) which an atom set
// ? with an identical value would otherwise swallow.
export const $selectionEventNonce = atom<number>(0);

export const $insertTabActivateNonce = atom<number>(0);

//
// * Computed
//

export const $hasControllerOrTemplate = computed([$page, $pageVersion], (page): boolean => {
    return !!page && (page.hasController() || !!page.getTemplate() || page.isFragment());
});

export const $isFragment = computed([$page, $pageVersion], (page): boolean => page?.isFragment() ?? false);

// The page model is not editable: it is driven by a template (Customize
// detaches it) or the content is read-only. Derived from the host's own
// state only; the page editor never decides this.
export const $isPageLocked = computed(
    [$contentContext, $page, $pageVersion, $isPageModifyAllowed],
    (ctx, page, _version, modifyAllowed): boolean => {
        if (!modifyAllowed) return true;
        if (ctx == null) return false;
        return !ctx.isPageTemplate && ctx.contentTypeName !== CONTENT_TYPE.FRAGMENT && !page?.hasController();
    },
);

export const $isInsertTabAvailable = computed(
    [$pageEditorLifecycle, $isPageLocked, $hasControllerOrTemplate, $hasDefaultPageTemplate],
    (lifecycle, isPageLocked, hasControllerOrTemplate, hasDefaultTemplate): boolean => {
        if (!lifecycle.isPageReady || !lifecycle.inlineEditing || !lifecycle.isPageRenderable || isPageLocked) {
            return false;
        }
        return hasControllerOrTemplate || hasDefaultTemplate;
    },
);

export const $isInspecting = computed($inspectedPath, (path): boolean => path != null);

// Resolves the string path to the actual PageItem from the page model.
// Depends on $pageVersion to re-evaluate when mutable Page objects change.
export const $inspectedItem = computed([$inspectedPath, $page, $pageVersion], (path, page): PageItem | null => {
    if (path == null || page == null) return null;
    return page.getComponentByPath(ComponentPath.fromString(path));
});

export const $inspectedItemType = computed($inspectedItem, (item): PageItemType | null => item?.getType() ?? null);

//
// * API
//

export function isComponentEmpty(nodeId: string): boolean {
    const page = $page.get();
    const component = page?.getComponentByPath(ComponentPath.fromString(nodeId)) ?? null;
    return component instanceof Component ? component?.isEmpty() : false;
}

//
// * Internal
//

export function bumpPageVersion(): void {
    $pageVersion.set($pageVersion.get() + 1);
}

export function bumpSelectionEventNonce(): void {
    $selectionEventNonce.set($selectionEventNonce.get() + 1);
}

export function bumpInsertTabActivateNonce(): void {
    $insertTabActivateNonce.set($insertTabActivateNonce.get() + 1);
}

export function syncPageFromState(): void {
    const currentPage = PageState.getState();
    if (currentPage !== $page.get()) {
        $page.set(currentPage);
    }
    bumpPageVersion();
}
