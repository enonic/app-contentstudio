import type { SelfManagedComponentProps } from '@enonic/input-types';
import { Input, InputTypeName, Occurrences } from '@enonic/input-types/schema';
import { ContentTypeName } from '@enonic/lib-admin-ui/schema/content/ContentTypeName';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/preact';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ContentId } from '../../../../../../app/content/ContentId';
import { ContentPath } from '../../../../../../app/content/ContentPath';
import { ContentSummaryBuilder } from '../../../../../../app/content/ContentSummary';
import { fetchContentByIds } from '../../../../../entities/content';
import { setPhrases } from '../../../../../shared/i18n';
import type { ContentSelectorConfig } from './ContentSelectorConfig';
import { ContentSelectorInput } from './ContentSelectorInput';

const selection = vi.hoisted(() => ['first']);

vi.unmock('@enonic/ui');
vi.mock('../../../../../entities/content', () => ({ fetchContentByIds: vi.fn() }));
vi.mock('../../../../../shared/notifications', () => ({ handleError: vi.fn() }));
vi.mock('../../../../../../app/event/EditContentEvent', () => ({ EditContentEvent: vi.fn() }));
vi.mock('../../FormScopeContext', () => ({
    useFormScope: () => ({ project: undefined }),
    useFormScopeRequirement: () => ({ enabled: true }),
}));
vi.mock('../hooks', () => ({
    useFormApplicationKey: () => undefined,
    useSelectorInput: () => ({
        contextContent: undefined,
        selectionMode: 'multiple',
        hasErrors: false,
        hideToggleIcon: false,
        listMode: 'flat',
        selection,
        placeholder: '',
        emptyLabel: '',
        handleSelectionChange: vi.fn(),
    }),
}));
vi.mock('../../../selectors/content', () => ({ ContentCombobox: () => null }));
vi.mock('../../../selectors/shared/combobox/ContentRow', () => ({ ContentRow: () => null }));
vi.mock('./ContentSelectorInputAddButton', () => ({ ContentSelectorInputAddButton: () => null }));
vi.mock('./ContentSelectorDescriptor', () => ({ CONTENT_SELECTOR_SCOPE_REQUIREMENT: {} }));
vi.mock('../../../../../shared/socket/socket.store', () => {
    const event = { listen: () => () => {} };
    return {
        $contentArchived: event,
        $contentDeleted: event,
        $contentMoved: event,
        $contentPublished: event,
        $contentRenamed: event,
        $contentUnpublished: event,
        $contentUpdated: event,
    };
});

const input = Input.create()
    .setName('related')
    .setInputType(new InputTypeName('ContentSelector'))
    .setLabel('Related')
    .setOccurrences(Occurrences.minmax(0, 0))
    .build();

const props: SelfManagedComponentProps<ContentSelectorConfig> = {
    occurrenceIds: [],
    values: [],
    onChange: vi.fn(),
    onAdd: vi.fn(),
    onRemove: vi.fn(),
    onMove: vi.fn(),
    occurrences: input.getOccurrences(),
    config: { allowContentType: [], allowPath: [], treeMode: false, hideToggleIcon: false },
    input,
    enabled: true,
    errors: [],
};

const content = new ContentSummaryBuilder()
    .setId('first')
    .setContentId(new ContentId('first'))
    .setDisplayName('first')
    .setType(new ContentTypeName('base:folder'))
    .setPath(ContentPath.create().fromString('/first').build())
    .build();

const tooltips = (): string[] =>
    [...document.querySelectorAll('[data-component="Tooltip.Content"]')].map((node) => node.textContent);

describe('ContentSelectorInput', () => {
    beforeEach(() => {
        setPhrases({
            'action.edit': 'action.edit',
            'action.remove': 'action.remove',
            'field.invalid': 'field.invalid',
        });
        vi.mocked(fetchContentByIds).mockResolvedValue([content]);
    });

    afterEach(() => {
        cleanup();
        setPhrases({});
        vi.useRealTimers();
    });

    it('should show the workflow status of a single selected content on keyboard focus', async () => {
        render(<ContentSelectorInput {...props} />);
        const row = await screen.findByRole('group', { name: 'first', description: 'field.invalid' });
        vi.useFakeTimers();
        expect(row.tabIndex).toBe(0);
        await act(async () => {
            fireEvent.keyDown(document.body, { key: 'Tab' });
            row.focus();
        });
        await act(async () => {
            vi.advanceTimersByTime(500);
        });
        expect(tooltips()).toEqual(['field.invalid']);
    });
});
