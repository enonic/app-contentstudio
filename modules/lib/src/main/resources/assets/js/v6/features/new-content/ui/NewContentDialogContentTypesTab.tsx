import { ContentTypeSummary } from '@enonic/lib-admin-ui/schema/content/ContentTypeSummary';
import { Button, Tab } from '@enonic/ui';
import { Loader2 } from 'lucide-react';
import { type KeyboardEvent, type ReactElement, useRef, useState } from 'react';
import type { ContentSummary } from '../../../../app/content/ContentSummary';
import { NewContentEvent } from '../../../../app/create/NewContentEvent';
import { useI18n } from '../../../shared/lib/hooks/useI18n';
import { closeNewContentDialog } from '../model/newContentDialog.store';
import { ItemLabel } from '../../../shared/ui/ItemLabel';
import { ContentIcon } from '../../../shared/ui/icons/ContentIcon';

const NEW_CONTENT_DIALOG_CONTENT_TYPES_TAB_NAME = 'NewContentDialogContentTypesTab';
const NEW_CONTENT_DIALOG_CONTENT_TYPES_LOADER_NAME = 'NewContentDialogContentTypesLoader';

type NewContentDialogContentTypesTabProps = {
    tabName: string;
    contentTypes: ContentTypeSummary[];
    parentContent: ContentSummary;
    loading: boolean;
};

export const NewContentDialogContentTypesTab = ({
    tabName,
    contentTypes,
    parentContent,
    loading,
}: NewContentDialogContentTypesTabProps): ReactElement => {
    const notFoundLabel = useI18n('dialog.new.notFound');
    const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);
    const [focusedContentType, setFocusedContentType] = useState<string>();
    const focusedIndex = Math.max(
        0,
        contentTypes.findIndex((type) => type.getName() === focusedContentType),
    );

    buttonRefs.current.length = contentTypes.length;

    const handleContentTypeSelected = (contentType: ContentTypeSummary) => {
        new NewContentEvent(contentType, parentContent).fire();
        closeNewContentDialog();
    };

    // Measure the rendered row so navigation follows the responsive column count.
    const getColumnCount = (): number => {
        const firstTop = buttonRefs.current[0]?.offsetTop;
        let count = 0;

        for (const button of buttonRefs.current) {
            if (!button || button.offsetTop !== firstTop) {
                break;
            }
            count += 1;
        }

        return Math.max(count, 1);
    };

    const handleContentTypeKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number): void => {
        let nextIndex: number;

        switch (event.key) {
            case 'ArrowRight':
                nextIndex = index + 1;
                break;
            case 'ArrowLeft':
                nextIndex = index - 1;
                break;
            case 'ArrowDown':
                nextIndex = index + getColumnCount();
                break;
            case 'ArrowUp':
                nextIndex = index - getColumnCount();
                break;
            case 'Home':
                nextIndex = 0;
                break;
            case 'End':
                nextIndex = contentTypes.length - 1;
                break;
            default:
                return;
        }

        event.preventDefault();
        if (nextIndex < 0 || nextIndex >= contentTypes.length) {
            return;
        }
        buttonRefs.current[nextIndex]?.focus({
            focusVisible: true,
        });
    };

    return (
        <Tab.Content
            value={tabName}
            tabIndex={!loading && contentTypes.length > 0 ? -1 : -0}
            className="mt-0 pt-2 h-full"
        >
            {loading && (
                <div
                    data-component={NEW_CONTENT_DIALOG_CONTENT_TYPES_LOADER_NAME}
                    className="flex items-center justify-center h-full"
                >
                    <Loader2 className="size-12 animate-spin text-subtle" />
                </div>
            )}

            {!loading && contentTypes.length > 0 && (
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-y-1.5 gap-x-7.5">
                    {contentTypes.map((contentType, index) => {
                        const key = contentType.getName();
                        const displayName = contentType.getTitle();
                        const description = contentType.getDescription() ?? '';
                        const iconUrl = contentType.getIconUrl();
                        const contentTypeName = String(contentType.getContentTypeName());

                        return (
                            <li key={key}>
                                <Button
                                    ref={(button) => {
                                        buttonRefs.current[index] = button;
                                    }}
                                    variant="text"
                                    className="w-full h-auto py-1.5 px-0 md:px-2 flex justify-start font-normal"
                                    tabIndex={focusedIndex === index ? 0 : -1}
                                    onFocus={() => setFocusedContentType(key)}
                                    onKeyDown={(event) => handleContentTypeKeyDown(event, index)}
                                    onClick={() => handleContentTypeSelected(contentType)}
                                >
                                    <ItemLabel
                                        icon={
                                            <ContentIcon
                                                contentType={contentTypeName}
                                                url={iconUrl}
                                                className="size-12"
                                                imageSize={48}
                                                typeIcon
                                            />
                                        }
                                        primary={displayName}
                                        secondary={description}
                                        className="[&>*:first-child]:size-12 md:ml-1.5 gap-4"
                                    />
                                </Button>
                            </li>
                        );
                    })}
                </ul>
            )}

            {!loading && contentTypes.length === 0 && <p className="text-sm text-subtle">{notFoundLabel}</p>}
        </Tab.Content>
    );
};

NewContentDialogContentTypesTab.displayName = NEW_CONTENT_DIALOG_CONTENT_TYPES_TAB_NAME;
