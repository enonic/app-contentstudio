import {cn, IconButton, ListItem} from '@enonic/ui';
import {useCallback, type ReactElement} from 'react';
import {type ContentSummaryAndCompareStatus} from '../../../../../../app/content/ContentSummaryAndCompareStatus';
import {type ImageSelectorMode} from '../image-selector.types';
import {ImageSelectionItemView} from './ImageSelectionItemView';
import {GripVertical, PenIcon, XIcon} from 'lucide-react';
import {EditContentEvent} from '../../../../../../app/event/EditContentEvent';
import {type Project} from '../../../../../../app/settings/data/project/Project';
import {type SortableListItemRenderContext} from '../../../lists';

export type ImageSelectionItemProps = {
    /** The current active project */
    project: Readonly<Project>;
    /** The content to display */
    content: ContentSummaryAndCompareStatus;
    /** Selected content IDs */
    selection: readonly string[];
    /** Callback when selection changes */
    onSelectionChange: (selection: readonly string[]) => void;
    /** Selection mode */
    selectionMode?: ImageSelectorMode;
    /** Whether the interactive buttons are disabled */
    disabled?: boolean;
    /** The context of the item */
    context: SortableListItemRenderContext;
};

const IMAGE_SELECTION_ITEM_NAME = 'ImageSelectionItem';

// Wraps the ImageSelectionItemView component with a GripVertical icon on the left and interactive edit & remove buttons on the right.
export const ImageSelectionItem = ({
    project,
    content,
    selection,
    selectionMode,
    onSelectionChange,
    disabled,
    context: {interactionProps, isMovable, isFocused},
}: ImageSelectionItemProps): ReactElement => {
    const handleEdit = useCallback(() => {
        new EditContentEvent([content], project as Project).fire();
    }, [content, project]);

    const handleRemove = useCallback(() => {
        const newSelection = selection.filter((id) => id !== content.getId());
        onSelectionChange(newSelection);
    }, [content, selection, onSelectionChange]);

    return (
        <div data-component={IMAGE_SELECTION_ITEM_NAME}>
            <ListItem
                key={content.getId()}
                selected={isMovable}
                className={cn(
                    '@container cursor-move py-2.5',
                    isMovable && 'bg-surface-selected',
                    isFocused && !isMovable && 'bg-surface-neutral-hover'
                )}
                {...interactionProps}
            >
                {selectionMode === 'multiple' && (
                    <ListItem.Left>
                        <GripVertical className="size-5 shrink-0 text-subtle group-data-[tone=inverse]:text-alt" />
                    </ListItem.Left>
                )}

                <ListItem.Content>
                    <ImageSelectionItemView content={content} />
                </ListItem.Content>

                <ListItem.Right className="gap-0 ml-0 @min-[400px]:gap-2.5 @min-[400px]:ml-2.5 @min-[560px]:gap-5 @min-[560px]:ml-5">
                    <IconButton
                        icon={PenIcon}
                        onClick={handleEdit}
                        disabled={disabled}
                        className={'bg-transparent hover:bg-transparent group-data-[tone=inverse]:text-alt'}
                    />
                    <IconButton
                        icon={XIcon}
                        onClick={handleRemove}
                        disabled={disabled}
                        className={'bg-transparent hover:bg-transparent group-data-[tone=inverse]:text-alt'}
                    />
                </ListItem.Right>
            </ListItem>
        </div>
    );
};

ImageSelectionItem.displayName = IMAGE_SELECTION_ITEM_NAME;
