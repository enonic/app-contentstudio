import {type ReactElement} from 'react';

export const SetConfirmOverlay = (): ReactElement => {
    return (
        <div
            data-component="SetConfirmOverlay"
            className="fixed inset-0 z-30 bg-overlay backdrop-blur-xs"
            aria-hidden="true"
        />
    );
};

SetConfirmOverlay.displayName = 'SetConfirmOverlay';
