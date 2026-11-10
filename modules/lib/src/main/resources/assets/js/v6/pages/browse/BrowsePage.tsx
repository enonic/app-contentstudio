import { useStore } from '@nanostores/preact';
import { lazy, type ReactElement, Suspense } from 'react';
import { $mode } from '../../shared/app-state/mode.store';
import { BrowseDialogs } from './BrowseDialogs';

// Loaded on demand: a wizard tab renders this page too, only for its dialogs.
const BrowseAppShell = lazy(() => import('./BrowseAppShell'));

export const BrowsePage = (): ReactElement => {
    const mode = useStore($mode);

    return (
        <>
            {mode === 'browser' && (
                <Suspense fallback={null}>
                    <BrowseAppShell />
                </Suspense>
            )}
            <BrowseDialogs />
        </>
    );
};

BrowsePage.displayName = 'BrowsePage';
