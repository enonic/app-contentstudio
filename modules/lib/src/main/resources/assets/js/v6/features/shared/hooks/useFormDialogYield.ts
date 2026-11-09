import { useCallback, useRef } from 'react';
import { type DialogYield, mergeDialogYields } from '../../../shared/ui/dialogs/dialogYield';
import { useNewContentDialogYield } from '../../new-content/lib/useNewContentDialogYield';
import { useHtmlAreaDialogYield } from './useHtmlAreaDialogYield';

/**
 * How a dialog hosting a form yields to the dialogs its inputs open outside it: the HtmlArea's
 * overlays and dialogs, and the New Content dialog of a content selector's add button. A new
 * source gets its own hook and a place in the merge.
 */
export const useFormDialogYield = (): DialogYield => {
    const merged = mergeDialogYields(useHtmlAreaDialogYield(), useNewContentDialogYield());

    // Stable for the hosts' callback deps; reads the latest merge when called.
    const mergedRef = useRef(merged);
    mergedRef.current = merged;
    const shouldIgnoreClose = useCallback(() => mergedRef.current.shouldIgnoreClose(), []);

    return { ...merged, shouldIgnoreClose };
};
