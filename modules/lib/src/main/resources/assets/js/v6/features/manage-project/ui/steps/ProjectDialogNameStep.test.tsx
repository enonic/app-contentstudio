import { act, cleanup, render, screen } from '@testing-library/preact';
import { atom, map } from 'nanostores';
import { forwardRef, type ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
    setProjectDialogName: vi.fn(),
}));

vi.mock('@enonic/ui', () => ({
    Dialog: {
        StepContent: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
        StepHeader: () => null,
    },
    Input: forwardRef<
        HTMLInputElement,
        {
            label: string;
            value: string;
            error?: string;
            onChange: (e: { currentTarget: HTMLInputElement }) => void;
        }
    >(({ label, value, error, onChange }, ref) => (
        <label>
            {label}
            <input ref={ref} value={value} onChange={onChange} />
            {error && <div role="alert">{error}</div>}
        </label>
    )),
}));

vi.mock('../../../../shared/lib/hooks/useI18n', () => ({
    useI18n: (key: string) => key,
}));

vi.mock('../../../../entities/project', () => ({
    $projects: atom({ projects: [] }),
}));

vi.mock('../../model/projectDialog.store', () => ({
    $projectDialog: map({
        mode: 'create',
        nameData: { name: '', identifier: '', description: '', hasError: false },
    }),
    setProjectDialogName: mocks.setProjectDialogName,
}));

import { ProjectDialogNameStepContent } from './ProjectDialogNameStep';

// Dispatches a native input event without act(), so effects stay pending like in the browser.
function typeWithoutFlush(input: HTMLInputElement, value: string): void {
    input.value = value;
    input.dispatchEvent(new Event('input', { bubbles: true }));
}

// Lets Preact's debounced render run while its after-paint effects stay pending.
async function letRenderHappen(): Promise<void> {
    await Promise.resolve();
    await Promise.resolve();
}

describe('ProjectDialogNameStepContent', () => {
    beforeEach(() => {
        mocks.setProjectDialogName.mockClear();
    });

    afterEach(() => {
        cleanup();
        vi.restoreAllMocks();
    });

    function getInputs(): { name: HTMLInputElement; identifier: HTMLInputElement; description: HTMLInputElement } {
        return {
            name: screen.getByLabelText('field.displayName *') as HTMLInputElement,
            identifier: screen.getByLabelText('settings.field.project.name *') as HTMLInputElement,
            description: screen.getByLabelText('field.description') as HTMLInputElement,
        };
    }

    it('should keep a keystroke typed before the effects of the previous render have run', async () => {
        render(<ProjectDialogNameStepContent />);
        const { name, identifier } = getInputs();

        typeWithoutFlush(name, 'layer345');
        await letRenderHappen();
        typeWithoutFlush(name, 'layer3454');
        await act(async () => {});

        expect(name.value).toBe('layer3454');
        expect(identifier.value).toBe('layer3454');
    });

    it('should derive the identifier from the display name', async () => {
        render(<ProjectDialogNameStepContent />);
        const { name, identifier } = getInputs();

        await act(async () => typeWithoutFlush(name, 'My Project'));

        expect(identifier.value).toBe('my-project');
        expect(mocks.setProjectDialogName).toHaveBeenLastCalledWith({
            name: 'My Project',
            identifier: 'my-project',
            description: '',
            hasError: false,
        });
    });

    it('should stop deriving the identifier once the user has typed a custom one', async () => {
        render(<ProjectDialogNameStepContent />);
        const { name, identifier } = getInputs();

        await act(async () => typeWithoutFlush(name, 'My Project'));
        await act(async () => typeWithoutFlush(identifier, 'custom-id'));
        await act(async () => typeWithoutFlush(name, 'My Project 2'));

        expect(identifier.value).toBe('custom-id');
    });

    it('should show the required errors when a description is typed while the name is empty', async () => {
        render(<ProjectDialogNameStepContent />);
        const { description } = getInputs();

        expect(screen.queryAllByRole('alert')).toHaveLength(0);

        await act(async () => typeWithoutFlush(description, 'Some description'));

        const errors = screen.getAllByRole('alert').map((el) => el.textContent);
        expect(errors).toEqual(['field.value.required', 'field.value.required']);
        expect(mocks.setProjectDialogName).toHaveBeenLastCalledWith(
            expect.objectContaining({ description: 'Some description', hasError: true }),
        );
    });

    it('should show the required error when the display name is cleared', async () => {
        render(<ProjectDialogNameStepContent />);
        const { name } = getInputs();

        await act(async () => typeWithoutFlush(name, 'a'));
        await act(async () => typeWithoutFlush(name, ''));

        expect(screen.getAllByRole('alert').map((el) => el.textContent)).toContain('field.value.required');
        expect(mocks.setProjectDialogName).toHaveBeenLastCalledWith(
            expect.objectContaining({ name: '', hasError: true }),
        );
    });
});
