import type {ReactElement} from 'react';
import {BrowseAppShell} from './layout/BrowseAppShell';

export const BrowsePage = (): ReactElement => {
    return (
        <BrowseAppShell />
    );
};

BrowsePage.displayName = 'BrowsePage';
