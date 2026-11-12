import { Action } from '@enonic/lib-admin-ui/ui/Action';
import { KeyBindings } from '@enonic/lib-admin-ui/ui/KeyBindings';
import { render, waitFor } from '@testing-library/preact';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { start as startKeyBindingsGuard } from '../../../../app/keyBindingsGuard.service';
import { ContentBrowseWidget } from './ContentBrowseWidget';

vi.mock('../../../../../app/browse/ContentBrowsePanel', () => ({
    ContentBrowsePanel: class {
        private readonly actions = [new Action('Edit', 'mod+e')];

        getActions(): Action[] {
            return this.actions;
        }
    },
}));

// ! Loads the preview widgets over the network on import.
vi.mock('../../../../widgets/inspectors/model/liveViewWidgets.store', () => ({
    $activeWidget: { get: () => undefined },
}));

vi.mock('../../../../shared/ui/dialogs/DialogPreset', () => ({
    DialogPresetConfirmElement: class {},
}));

vi.mock('../../../../shared/ui/LegacyElementHost', () => ({
    LegacyElementHost: () => <div data-component="LegacyElementHost" />,
}));

function openModal(): HTMLElement {
    const modal = document.createElement('div');
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    document.body.append(modal);
    return modal;
}

describe('ContentBrowseWidget', () => {
    afterEach(() => {
        KeyBindings.get().reset();
    });

    it('binds the browse shortcuts only after a dialog that was open before the panel closes', async () => {
        const modal = openModal();
        startKeyBindingsGuard();

        render(<ContentBrowseWidget active />);
        await waitFor(() => {
            expect(document.querySelector('[data-component="LegacyElementHost"]')).not.toBeNull();
        });

        expect(KeyBindings.get().getActiveBindings()).toHaveLength(0);

        modal.remove();

        await waitFor(() => {
            expect(KeyBindings.get().getActiveBindings().length).toBeGreaterThan(0);
        });
    });
});
