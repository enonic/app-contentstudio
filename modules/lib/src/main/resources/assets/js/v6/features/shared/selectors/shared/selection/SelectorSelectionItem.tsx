import {IconButton, ListItem, Tooltip} from '@enonic/ui';
import {useCallback, type ReactElement} from 'react';
import {useI18n} from '../../../../hooks/useI18n';
import {type ContentSummary} from '../../../../../../app/content/ContentSummary';
import {PenIcon, XIcon} from 'lucide-react';
import {EditContentEvent} from '../../../../../../app/event/EditContentEvent';
import {type Project} from '../../../../../../app/settings/data/project/Project';
import {type SortableGridListItemContext} from '@enonic/lib-admin-ui/form2/components';

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
    /** The context of the item */
    context: SortableGridListItemContext<ContentSummary>;
};

const SELECTOR_SELECTION_ITEM_NAME = 'SelectorSelectionItem';

// Wraps a custom content renderer with interactive edit & remove buttons on the right.
export const SelectorSelectionItem = ({
    project,
    selection,
    onSelectionChange,
    renderContent,
    disabled,
    context: {item: content},
}: SelectorSelectionItemProps): ReactElement => {
    // Content without a path is considered removed (deleted or archived)
    const isRemoved = !content.getPath();

    const removeLabel = useI18n('action.remove');
    const editLabel = useI18n('action.edit');

    const handleEdit = useCallback(() => {
        new EditContentEvent([content], project).fire();
    }, [content, project]);

    const handleRemove = useCallback(() => {
        const newSelection = selection.filter((id) => id !== content.getId());
        onSelectionChange(newSelection);
    }, [content, selection, onSelectionChange]);

    return (
        <div data-component={SELECTOR_SELECTION_ITEM_NAME} className="min-w-0 flex-1">
            <ListItem key={content.getId()} className="@container py-2.5 px-0">
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
        </div>
    );
};

SelectorSelectionItem.displayName = SELECTOR_SELECTION_ITEM_NAME;
