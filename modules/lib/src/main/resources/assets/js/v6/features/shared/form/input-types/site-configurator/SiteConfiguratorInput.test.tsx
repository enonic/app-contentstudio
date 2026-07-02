import { type Application } from '@enonic/lib-admin-ui/application/Application';
import { ApplicationKey } from '@enonic/lib-admin-ui/application/ApplicationKey';
import { type Value } from '@enonic/lib-admin-ui/data/Value';
import { FormBuilder } from '@enonic/lib-admin-ui/form/Form';
import { Input } from '@enonic/lib-admin-ui/form/Input';
import { initBuiltInTypes, type SelfManagedComponentProps } from '@enonic/lib-admin-ui/form2';
import { cleanup, fireEvent, render, screen } from '@testing-library/preact';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import type { SiteConfiguratorConfig } from './SiteConfiguratorConfig';

vi.mock('@enonic/lib-admin-ui/auth/AuthHelper', () => ({
    AuthHelper: { isContentAdmin: () => true },
}));

vi.mock('../../../../../shared/lib/hooks/useI18n', () => ({
    useI18n: (key: string) => key,
}));

// ConfirmationDialog spreads `{...Dialog}` at module load; the global @enonic/ui
// mock has no Dialog. It is not on this test's path (editing stays null), so stub it.
vi.mock('../../../dialogs/ConfirmationDialog', () => ({
    ConfirmationDialog: { Content: () => null, DefaultHeader: () => null, Footer: () => null },
}));

vi.mock('../../../selectors/ApplicationSelector', () => ({
    ApplicationSelector: ({ onSelectionChange }: { onSelectionChange?: (selection: string[]) => void }) => (
        <button type="button" data-testid="select-app" onClick={() => onSelectionChange?.(['app:test'])}>
            select
        </button>
    ),
}));

vi.mock('../../../../../entities/application/applications.store', async () => {
    const { map } = await import('nanostores');
    return {
        $applications: map({ applications: [], loading: false, loaded: false }),
        loadApplications: vi.fn(),
        reloadApplications: vi.fn(),
    };
});

vi.mock('../../../../store/wizardContent.store', () => ({
    requestMixinSeed: vi.fn(),
}));

import { $applications } from '../../../../../entities/application/applications.store';
import { SiteConfiguratorInput } from './SiteConfiguratorInput';

function checkboxForm(): ReturnType<FormBuilder['build']> {
    const builder = new FormBuilder();
    builder.addFormItem(
        Input.fromJson({
            name: 'agree',
            inputType: 'Checkbox',
            label: 'agree',
            occurrences: { minimum: 1, maximum: 1 },
            config: { default: [{ value: 'checked' }] },
            helpText: '',
        } as Parameters<typeof Input.fromJson>[0]),
    );
    return builder.build();
}

function createApp(key: string, form: ReturnType<FormBuilder['build']>): Application {
    return {
        getApplicationKey: () => ApplicationKey.fromString(key),
        getForm: () => form,
        getDisplayName: () => key,
        isStopped: () => false,
        getState: () => 'started',
        getDescription: () => '',
    } as unknown as Application;
}

function renderInput(onAdd: (value?: Value) => void): void {
    const props = {
        values: [],
        onAdd,
        onRemove: vi.fn(),
        onMove: vi.fn(),
        onChange: vi.fn(),
        enabled: true,
        errors: [],
    } as unknown as SelfManagedComponentProps<SiteConfiguratorConfig>;

    render(<SiteConfiguratorInput {...props} />);
}

describe('SiteConfiguratorInput', () => {
    beforeAll(() => {
        initBuiltInTypes();
    });

    afterEach(() => {
        cleanup();
        $applications.set({ applications: [], loading: false, loaded: false });
        vi.restoreAllMocks();
    });

    it('seeds the application form defaults into the config when an app is selected', () => {
        $applications.set({ applications: [createApp('app:test', checkboxForm())], loading: false, loaded: true });

        const onAdd = vi.fn();
        renderInput(onAdd);

        fireEvent.click(screen.getByTestId('select-app'));

        expect(onAdd).toHaveBeenCalledTimes(1);

        const value = onAdd.mock.calls[0][0] as Value;
        const config = value.getPropertySet()?.getPropertySet('config');
        expect(config?.getPropertyArray('agree')?.get(0)?.getValue().getBoolean()).toBe(true);
    });
});
