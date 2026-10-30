import type { SelfManagedComponentProps } from '@enonic/input-types';
import { Input, InputTypeName, Occurrences } from '@enonic/input-types/schema';
import { cleanup, render, screen } from '@testing-library/preact';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../../../../entities/content', async () => {
    const { atom } = await import('nanostores');
    return { $contextContent: atom(null) };
});
vi.mock('../../../../../entities/project', async () => {
    const { atom } = await import('nanostores');
    return { $activeProject: atom(undefined) };
});
vi.mock('../../../selectors/image', () => ({
    ImageSelector: ({ disabled }: { disabled?: boolean }) => (
        <div data-testid="image-selector" data-disabled={String(disabled)} />
    ),
}));
vi.mock('../hooks', () => ({
    useFormApplicationKey: () => undefined,
    useSelectorInput: () => ({
        contextContent: undefined,
        selectionMode: 'single',
        hasErrors: false,
        hideToggleIcon: false,
        listMode: 'flat',
        selection: [],
        placeholder: '',
        emptyLabel: '',
        handleSelectionChange: vi.fn(),
    }),
}));

import type { Project } from '../../../../../../app/settings/data/project/Project';
import { FormScopeProvider } from '../../FormScopeContext';
import type { ImageSelectorConfig } from './ImageSelectorConfig';
import { ImageSelectorInput } from './ImageSelectorInput';

const input = Input.create()
    .setName('hero')
    .setInputType(new InputTypeName('ImageSelector'))
    .setLabel('Hero')
    .setOccurrences(Occurrences.minmax(0, 1))
    .build();

const props = {
    values: [],
    onChange: vi.fn(),
    onAdd: vi.fn(),
    onRemove: vi.fn(),
    onMove: vi.fn(),
    occurrences: input.getOccurrences(),
    config: { allowPath: [] },
    input,
    enabled: true,
    errors: [],
} as unknown as SelfManagedComponentProps<ImageSelectorConfig>;

const project = { getName: () => 'a' } as unknown as Project;

const isDisabled = (): string | undefined => screen.getByTestId('image-selector').dataset.disabled;

describe('ImageSelectorInput', () => {
    afterEach(() => {
        cleanup();
        vi.restoreAllMocks();
    });

    it('should be disabled and warn once in a form scope without a project', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

        render(
            <FormScopeProvider project={null}>
                <ImageSelectorInput {...props} />
            </FormScopeProvider>,
        );

        expect(isDisabled()).toBe('true');
        expect(warn).toHaveBeenCalledOnce();
        expect(warn).toHaveBeenCalledWith("ImageSelector 'hero' is disabled: the form scope has no project.");
    });

    it('should be enabled and silent in a form scope with a project', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

        render(
            <FormScopeProvider project={project}>
                <ImageSelectorInput {...props} />
            </FormScopeProvider>,
        );

        expect(isDisabled()).toBe('false');
        expect(warn).not.toHaveBeenCalled();
    });
});
