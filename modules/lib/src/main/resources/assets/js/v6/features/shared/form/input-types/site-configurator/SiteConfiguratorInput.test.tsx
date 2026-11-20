import { type Application } from '../../../../../entities/application';
import { type Value } from '@enonic/input-types/data';
import { Form, Input } from '@enonic/input-types/schema';
import { registerBuiltInTypes, type SelfManagedComponentProps } from '@enonic/input-types';
import { cleanup, fireEvent, render, screen } from '@testing-library/preact';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import type { AriaAttributes } from 'react';
import type { SiteConfiguratorConfig } from './SiteConfiguratorConfig';

const { scope } = vi.hoisted(() => ({ scope: { content: undefined as unknown } }));

vi.unmock('@enonic/ui');

vi.mock('../../../../../shared/lib/cms/security/auth', () => ({
    isContentAdmin: () => true,
}));

vi.mock('../../../../../shared/lib/hooks/useI18n', () => ({
    useI18n: (key: string) => key,
}));

// ConfirmationDialog spreads `{...Dialog}` at module load; the global @enonic/ui
// mock has no Dialog. It is not on this test's path (editing stays null), so stub it.
vi.mock('../../../../../shared/ui/dialogs/ConfirmationDialog', () => ({
    ConfirmationDialog: { Content: () => null, DefaultHeader: () => null, Footer: () => null },
}));

vi.mock('../../../selectors/ApplicationSelector', () => ({
    ApplicationSelector: ({
        onSelectionChange,
        ...props
    }: { onSelectionChange?: (selection: string[]) => void } & AriaAttributes) => (
        <button
            type="button"
            data-testid="select-app"
            aria-describedby={props['aria-describedby']}
            aria-invalid={props['aria-invalid']}
            onClick={() => onSelectionChange?.(['app:test'])}
        >
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

vi.mock('../../../../../pages/wizard/model/wizardContent.store', () => ({
    requestMixinSeed: vi.fn(),
}));

vi.mock('../../FormScopeContext', () => ({
    useFormScope: () => ({ project: undefined, content: scope.content }),
    useFormScopeRequirement: () => ({ enabled: true, missing: [] }),
}));

import { $applications } from '../../../../../entities/application/applications.store';
import { SiteConfiguratorInput } from './SiteConfiguratorInput';
import { $siteConfigErrorAnnouncers } from './siteConfigAnnouncement.store';

function checkboxForm(): Form {
    return new Form([
        Input.fromJson({
            formItemType: 'Input',
            name: 'agree',
            inputType: 'Checkbox',
            label: 'agree',
            occurrences: { minimum: 1, maximum: 1 },
            config: { default: [{ value: 'checked' }] },
            helpText: '',
        } as Parameters<typeof Input.fromJson>[0]),
    ]);
}

function createApp(key: string, form: Form): Application {
    return { key, form, displayName: key, state: 'started', description: '' };
}

function renderInput(
    onAdd: (value?: Value) => void,
    overrides: Partial<SelfManagedComponentProps<SiteConfiguratorConfig>> = {},
) {
    const props = {
        values: [],
        onAdd,
        onRemove: vi.fn(),
        onMove: vi.fn(),
        onChange: vi.fn(),
        enabled: true,
        errors: [],
        ...overrides,
    } as unknown as SelfManagedComponentProps<SiteConfiguratorConfig>;

    return { ...render(<SiteConfiguratorInput {...props} />), props };
}

describe('SiteConfiguratorInput', () => {
    beforeAll(() => {
        registerBuiltInTypes();
    });

    afterEach(() => {
        cleanup();
        scope.content = undefined;
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

    it('associates a visible error and releases announcement ownership when hidden or unmounted', () => {
        scope.content = { getId: () => 'site' };
        const { props, rerender, unmount } = renderInput(vi.fn(), {
            errors: [
                { index: 0, breaksRequired: false, validationResults: [{ message: 'Application config is invalid' }] },
            ],
        });
        const selector = screen.getByTestId('select-app');
        const errorId = selector.getAttribute('aria-describedby');
        expect(document.getElementById(errorId!)?.textContent).toBe('Application config is invalid');
        expect(selector.getAttribute('aria-invalid')).toBe('true');
        expect($siteConfigErrorAnnouncers.get().site).toBe(1);

        rerender(<SiteConfiguratorInput {...props} errors={[]} />);
        expect(selector.hasAttribute('aria-describedby')).toBe(false);
        expect(selector.hasAttribute('aria-invalid')).toBe(false);
        expect($siteConfigErrorAnnouncers.get().site).toBeUndefined();

        rerender(<SiteConfiguratorInput {...props} />);
        expect($siteConfigErrorAnnouncers.get().site).toBe(1);
        unmount();
        expect($siteConfigErrorAnnouncers.get().site).toBeUndefined();
    });
});
