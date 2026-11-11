/** How a dialog steps back for another one that renders outside it. */
export type DialogYield = {
    /** The overlay goes while a dialog the host yields to is open. */
    overlayHidden: boolean;
    /** For the `Dialog.Content`: non-modal under an overlay, invisible under a dialog. */
    contentProps: { modal: boolean; className: string | undefined };
    /** A close request to ignore: an overlay is open and owns the click or the key. */
    shouldIgnoreClose: () => boolean;
};

/** Yields to every source: hidden, non-modal or deaf to a close as soon as one of them is. */
export function mergeDialogYields(...yields: DialogYield[]): DialogYield {
    return {
        overlayHidden: yields.some((y) => y.overlayHidden),
        contentProps: {
            modal: yields.every((y) => y.contentProps.modal),
            className: yields.map((y) => y.contentProps.className).find((className) => className != null),
        },
        shouldIgnoreClose: () => yields.some((y) => y.shouldIgnoreClose()),
    };
}
