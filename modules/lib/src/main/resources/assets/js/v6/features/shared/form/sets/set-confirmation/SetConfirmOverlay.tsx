import {createPortal, ReactElement} from 'react';

export const SetConfirmOverlay = (): ReactElement | null => {
    return createPortal(<div className="fixed inset-0 z-30 bg-overlay backdrop-blur-xs" aria-hidden="true" />, document.body);
};

SetConfirmOverlay.displayName = 'SetConfirmOverlay';
