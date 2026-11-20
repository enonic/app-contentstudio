import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/preact';
import { type WritableAtom } from 'nanostores';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { $aiTopicProcessing } from '../../../../features/ai';
import { $displayName, $wizardReadOnly, setDraftDisplayName } from '../../model/wizardContent.store';
import { $validationVisibility } from '../../model/wizardValidation.store';
import { DisplayNameInput } from './DisplayNameInput';

vi.unmock('@enonic/ui');

vi.mock('../../../../features/ai', async () => {
    const { atom } = await import('nanostores');
    return {
        $aiPluginDialogOpen: atom({}),
        $aiTopicProcessing: atom(false),
        $aiTopicError: atom(null),
        $aiTopicHighlight: atom({ count: 0, scroll: false }),
        AI_TOPIC_PATH: '__topic__',
        clearAiTopicError: vi.fn(),
        sendPluginContext: vi.fn(),
    };
});
vi.mock('../../model/wizardContent.store', async () => {
    const { atom } = await import('nanostores');
    const displayName = atom('Article');
    return {
        $displayName: displayName,
        $displayNameInputFocusRequested: atom(false),
        $displayNamePlaceholder: atom(''),
        $wizardReadOnly: atom(false),
        clearDisplayNameInputFocusRequest: vi.fn(),
        setDraftDisplayName: (value: string) => displayName.set(value),
    };
});
vi.mock('../../model/wizardValidation.store', async () => {
    const { atom } = await import('nanostores');
    return { $validationVisibility: atom('interactive') };
});
vi.mock('../../../../shared/lib/hooks/useI18n', () => ({
    useI18n: (key: string) =>
        ({ 'field.displayName': 'Display Name', 'field.displayName.required': 'Display Name is required' })[key],
}));

const processing = $aiTopicProcessing as WritableAtom<boolean>;

beforeEach(() => {
    setDraftDisplayName('Article');
    $wizardReadOnly.set(false);
    $validationVisibility.set('interactive');
    processing.set(false);
});

afterEach(cleanup);

it('keeps an empty live region until validation reveals the error, without moving focus', async () => {
    setDraftDisplayName('');
    const { container } = render(
        <>
            <DisplayNameInput />
            <button type="button">Next field</button>
        </>,
    );
    const region = container.querySelector('[aria-live]')!;
    const displayName = screen.getByRole('button', { name: 'Display Name' });
    const nextField = screen.getByRole('button', { name: 'Next field' });
    nextField.focus();
    expect(region.textContent).toBe('');
    expect(region.getAttribute('aria-live')).toBe('polite');
    expect(region.getAttribute('aria-atomic')).toBe('true');
    expect(displayName.hasAttribute('aria-invalid')).toBe(false);
    expect(displayName.hasAttribute('aria-describedby')).toBe(false);

    await act(async () => $validationVisibility.set('all'));
    await waitFor(() => expect(region.textContent).toBe('Display Name is required'));
    expect(container.querySelector('[aria-live]')).toBe(region);
    expect(displayName.getAttribute('aria-invalid')).toBe('true');
    expect(displayName.getAttribute('aria-describedby')).toBe(region.id);
    expect(document.activeElement).toBe(nextField);
});

it('links the error in both display and edit modes, then clears it when corrected', async () => {
    const { container } = render(
        <>
            <DisplayNameInput />
            <button type="button">Next field</button>
        </>,
    );
    const region = container.querySelector('[aria-live]')!;
    fireEvent.click(screen.getByRole('button', { name: 'Article' }));
    const editor = screen.getByRole('textbox');
    fireEvent.input(editor, { target: { value: '' } });
    await waitFor(() => expect($displayName.get()).toBe(''));
    expect(region.textContent).toBe('');

    await act(async () => screen.getByRole<HTMLButtonElement>('button', { name: 'Next field' }).focus());
    await waitFor(() => expect(region.textContent).toBe('Display Name is required'));
    const displayName = screen.getByRole<HTMLButtonElement>('button', { name: 'Display Name' });
    expect(displayName.getAttribute('aria-describedby')).toBe(region.id);

    await act(async () => displayName.focus());
    const reopenedEditor = screen.getByRole('textbox');
    expect(reopenedEditor.getAttribute('aria-invalid')).toBe('true');
    expect(reopenedEditor.getAttribute('aria-describedby')).toBe(region.id);
    expect(document.activeElement).toBe(reopenedEditor);

    fireEvent.input(reopenedEditor, { target: { value: 'Corrected name' } });
    await waitFor(() => expect(region.textContent).toBe(''));
    expect(reopenedEditor.hasAttribute('aria-invalid')).toBe(false);
    expect(reopenedEditor.hasAttribute('aria-describedby')).toBe(false);
    expect(container.querySelector('[aria-live]')).toBe(region);
    expect(document.activeElement).toBe(reopenedEditor);
});

it('clears the live error and its connection while processing suppresses validation', async () => {
    setDraftDisplayName('');
    $validationVisibility.set('all');
    const { container } = render(<DisplayNameInput />);
    const region = container.querySelector('[aria-live]')!;
    const displayName = screen.getByRole('button', { name: 'Display Name' });
    expect(region.textContent).toBe('Display Name is required');

    await act(async () => processing.set(true));
    await waitFor(() => expect(region.textContent).toBe(''));
    expect(displayName.hasAttribute('aria-describedby')).toBe(false);
    expect(displayName.hasAttribute('aria-invalid')).toBe(false);
    expect(container.querySelector('[aria-live]')).toBe(region);
});
