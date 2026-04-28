import {atom, computed, map} from 'nanostores';
import type {Page} from '../../../../app/page/Page';
import {ComponentPath} from '../../../../app/page/region/ComponentPath';
import type {PageItem} from '../../../../app/page/region/PageItem';
import type {PageItemType} from '../../../../app/page/region/PageItemType';
import {PageState} from '../../../../app/wizard/page/PageState';
import type {PageEditorContentContext, PageEditorLifecycle} from './types';

//
// * State
//

export const $pageEditorLifecycle = map<PageEditorLifecycle>({
    isPageLocked: false,
    isPageRenderable: undefined,
    isPageReady: false,
});

export const $page = atom<Page | null>(null);

export const $pageVersion = atom<number>(0);

export const $hasDefaultPageTemplate = atom<boolean>(false);

export const $defaultPageTemplateName = atom<string | null>(null);

export const $contentContext = atom<PageEditorContentContext | null>(null);

export const $inspectedPath = atom<string | null>(null);

// ? Bumps on every explicit selection event (SELECT/INSPECT/inspectItem),
// ? even when $inspectedPath value is unchanged. Lets consumers react to
// ? "user reselected the same path" (e.g. tab switch) which an atom set
// ? with an identical value would otherwise swallow.
export const $selectionEventNonce = atom<number>(0);

export const $insertTabActivateNonce = atom<number>(0);

//
// * Computed
//

export const $hasControllerOrTemplate = computed(
    [$page, $pageVersion],
    (page): boolean => {
        return !!page && (page.hasController() || !!page.getTemplate() || page.isFragment());
    },
);

export const $isFragment = computed(
    [$page, $pageVersion],
    (page): boolean => page?.isFragment() ?? false,
);

export const $isInsertTabAvailable = computed(
    [$pageEditorLifecycle, $hasControllerOrTemplate, $hasDefaultPageTemplate],
    (lifecycle, hasControllerOrTemplate, hasDefaultTemplate): boolean => {
        if (!lifecycle.isPageReady || lifecycle.isPageLocked || !lifecycle.isPageRenderable) {
            return false;
        }
        return hasControllerOrTemplate || hasDefaultTemplate;
    },
);

export const $isInspecting = computed($inspectedPath, (path): boolean => path != null);

// Resolves the string path to the actual PageItem from the page model.
// Depends on $pageVersion to re-evaluate when mutable Page objects change.
export const $inspectedItem = computed(
    [$inspectedPath, $page, $pageVersion],
    (path, page): PageItem | null => {
        if (path == null || page == null) return null;
        return page.getComponentByPath(ComponentPath.fromString(path));
    },
);

export const $inspectedItemType = computed(
    $inspectedItem,
    (item): PageItemType | null => item?.getType() ?? null,
);

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
