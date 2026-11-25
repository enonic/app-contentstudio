import { IconButton, ListItem, Tooltip } from '@enonic/ui';
import { useCallback, useId, type ReactElement } from 'react';
import { useI18n } from '../../../../../shared/lib/hooks/useI18n';
import { type ContentSummary } from '../../../../../../app/content/ContentSummary';
import { PenIcon, XIcon } from 'lucide-react';
import { EditContentEvent } from '../../../../../../app/event/EditContentEvent';
import { type Project } from '../../../../../../app/settings/data/project/Project';
import type { ContentState } from '../../../../../shared/lib/cms/content/ContentState';
import { i18n } from '../../../../../shared/i18n';
import { getStatusTooltipKey } from '../../../../../shared/ui/icons/StatusIcon';
import type { SelectorSelectionItemContext } from './SelectorSelection';

export type SelectorSelectionItemProps = {
    /** The current active project */
    project: Readonly<Project>;
    /** Selected content IDs */
    selection: readonly string[];
    /** Callback when selection changes */
    onSelectionChange: (selection: readonly string[]) => void;
    /** Render callback for the item content */
    renderContent: (content: ContentSummary) => ReactElement;
    /** Whether the interactive buttons are disabled */
    disabled?: boolean;
    /** Workflow status actually shown by the content renderer, if any. */
    status?: ContentState | null;
    /** The context of the item */
    context: SelectorSelectionItemContext;
};

const SELECTOR_SELECTION_ITEM_NAME = 'SelectorSelectionItem';

// Wraps a custom content renderer with interactive edit & remove buttons on the right.
export const SelectorSelectionItem = ({
    project,
    selection,
    onSelectionChange,
    renderContent,
    disabled,
    status,
    context: { item: content, itemCount },
}: SelectorSelectionItemProps): ReactElement => {
    // Content without a path is considered removed (deleted or archived)
    const isRemoved = !content.getPath();
    const isStatusFocusable = itemCount === 1 && !disabled && !isRemoved && status != null;
    const statusDescriptionId = useId();
    const statusLabel = status ? i18n(getStatusTooltipKey(status)) : undefined;
    const displayName = content.getDisplayName() || content.getType()?.getLocalName() || content.getId();

    const removeLabel = useI18n('action.remove');
    const editLabel = useI18n('action.edit');

    const handleEdit = useCallback(() => {
        new EditContentEvent([content], project?.getName()).fire();
    }, [content, project]);

    const handleRemove = useCallback(() => {
        const newSelection = selection.filter((id) => id !== content.getId());
        onSelectionChange(newSelection);
    }, [content, selection, onSelectionChange]);

    return (
        <div
            data-component={SELECTOR_SELECTION_ITEM_NAME}
            tabIndex={isStatusFocusable ? 0 : undefined}
            role={isStatusFocusable ? 'group' : undefined}
            aria-label={isStatusFocusable ? displayName : undefined}
            aria-describedby={isStatusFocusable ? statusDescriptionId : undefined}
            className="min-w-0 flex-1 rounded outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
        >
            <ListItem key={content.getId()} className="@container py-2.5 px-0" role="presentation">
                <ListItem.Content>{renderContent(content)}</ListItem.Content>

                <ListItem.Right className="gap-0.5 ml-0 @min-[400px]:ml-2.5 @min-[560px]:ml-5">
                    {!isRemoved && (
                        <Tooltip delay={300} value={editLabel || 'Edit'}>
                            <IconButton
                                icon={PenIcon}
                                onClick={handleEdit}
                                disabled={disabled}
                                aria-label={editLabel || 'Edit'}
                                className={'bg-transparent group-data-[tone=inverse]:text-alt'}
                            />
                        </Tooltip>
                    )}
                    <Tooltip delay={300} value={removeLabel}>
                        <IconButton
                            icon={XIcon}
                            onClick={handleRemove}
                            disabled={disabled}
                            aria-label={removeLabel}
                            className={'bg-transparent group-data-[tone=inverse]:text-alt'}
                        />
                    </Tooltip>
                </ListItem.Right>
            </ListItem>
            {isStatusFocusable && (
                <span id={statusDescriptionId} hidden>
                    {statusLabel}
                </span>
            )}
        </div>
    );
};

SelectorSelectionItem.displayName = SELECTOR_SELECTION_ITEM_NAME;
