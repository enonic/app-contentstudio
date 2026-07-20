import { create as createDiffPatcher } from 'jsondiffpatch/with-text-diffs';
import { format } from 'jsondiffpatch/formatters/html';
import { type ContentJson } from '../../../../../../app/content/ContentJson';

export type DiffHtmlResult = {
    diffHtml: string;
    isEmpty: boolean;
};

export const buildDiffHtml = (
    older: ContentJson,
    newer: ContentJson,
): DiffHtmlResult => {
    const diffPatcher = createDiffPatcher();

    const delta = diffPatcher.diff(older, newer);

    if (delta) {
        return { diffHtml: format(delta, older), isEmpty: false };
    }

    return {
        diffHtml: format({}, older),
        isEmpty: true,
    };
};
