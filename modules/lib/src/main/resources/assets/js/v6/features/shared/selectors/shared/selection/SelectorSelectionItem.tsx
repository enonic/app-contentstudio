import {IconButton, ListItem} from '@enonic/ui';
import {useCallback, type ReactElement} from 'react';
import {type ContentSummaryAndCompareStatus} from '../../../../../../app/content/ContentSummaryAndCompareStatus';
import {PenIcon, XIcon} from 'lucide-react';
import {EditContentEvent} from '../../../../../../app/event/EditContentEvent';
import {type Project} from '../../../../../../app/settings/data/project/Project';
import {type SortableListItemContext} from '@enonic/lib-admin-ui/form2/components';
import {CompareStatus} from '../../../../../../app/content/CompareStatus';

export type SelectorSelectionItemProps = {
    /** The current active project */
    project: Readonly<Project>;
    /** Selected content IDs */
    selection: readonly string[];
    /** Callback when selection changes */
    onSelectionChange: (selection: readonly string[]) => void;
    /** Render callback for the item content */
    renderContent: (content: ContentSummaryAndCompareStatus) => ReactElement;
    /** Whether the interactive buttons are disabled */
    disabled?: boolean;
    /** The context of the item */
    context: SortableListItemContext<ContentSummaryAndCompareStatus>;
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
    const isRemoved = [CompareStatus.UNKNOWN, CompareStatus.ARCHIVED].includes(content.getCompareStatus());

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
                        <IconButton
                            icon={PenIcon}
                            onClick={handleEdit}
                            disabled={disabled}
                            className={'bg-transparent group-data-[tone=inverse]:text-alt'}
                        />
                    )}
                    <IconButton
                        icon={XIcon}
                        onClick={handleRemove}
                        disabled={disabled}
                        className={'bg-transparent group-data-[tone=inverse]:text-alt'}
                    />
                </ListItem.Right>
            </ListItem>
        </div>
    );
};

SelectorSelectionItem.displayName = SELECTOR_SELECTION_ITEM_NAME;
