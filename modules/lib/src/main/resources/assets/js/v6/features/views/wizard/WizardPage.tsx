import type {ReactElement} from 'react';
import {WizardAppShell} from './layout/WizardAppShell';

export const WizardPage = (): ReactElement => {
    return (
        <WizardAppShell />
    );
};

WizardPage.displayName = 'WizardPage';
