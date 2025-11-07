import {LegacyElement} from '@enonic/lib-admin-ui/ui2/LegacyElement';
import {Store} from '@enonic/lib-admin-ui/store/Store';
import type {ReactElement} from 'react';
import {ProjectSelectionDialog} from '../../../../app/ui2/dialog/ProjectSelectionDialog';

/**
 * AppShell component that renders the whole application layout.
 * Right now it only renders global dialogs and modals.
 * This component is rendered at the app root level to ensure dialogs
 * are portaled correctly and don't interfere with app layout.
 */
const AppShell = (): ReactElement => {
    return (
        <>
            <ProjectSelectionDialog />
        </>
    );
};

AppShell.displayName = 'AppShell';

export class AppShellElement extends LegacyElement<typeof AppShell> {
    private static INSTANCE: AppShellElement;

    private constructor() {
        super({}, AppShell);
    }

    static getInstance(): AppShellElement {
        if (!AppShellElement.INSTANCE) {
            AppShellElement.INSTANCE = new AppShellElement();
        }
        return AppShellElement.INSTANCE;
    }
}
