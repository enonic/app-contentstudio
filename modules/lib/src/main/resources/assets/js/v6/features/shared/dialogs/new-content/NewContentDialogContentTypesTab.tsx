import {ContentTypeSummary} from '@enonic/lib-admin-ui/schema/content/ContentTypeSummary';
import {Button, Tab} from '@enonic/ui';
import {ReactElement} from 'react';
import type {ContentSummary} from '../../../../../app/content/ContentSummary';
import {NewContentEvent} from '../../../../../app/create/NewContentEvent';
import {useI18n} from '../../../hooks/useI18n';
import {closeNewContentDialog} from '../../../store/dialogs/newContentDialog.store';
import {ItemLabel} from '../../ItemLabel';
import {ContentIcon} from '../../icons/ContentIcon';

const NEW_CONTENT_DIALOG_CONTENT_TYPES_TAB_NAME = 'NewContentDialogContentTypesTab';

type NewContentDialogContentTypesTabProps = {
    tabName: string;
    contentTypes: ContentTypeSummary[];
    parentContent: ContentSummary;
};

export const NewContentDialogContentTypesTab = ({
    tabName,
    contentTypes,
    parentContent,
}: NewContentDialogContentTypesTabProps): ReactElement => {
    const notFoundLabel = useI18n('dialog.new.notFound');

    const handleContentTypeSelected = (contentType: ContentTypeSummary) => {
        new NewContentEvent(contentType, parentContent).fire();
        closeNewContentDialog();
    };

    return (
        <Tab.Content value={tabName}>
            {contentTypes.length > 0 && (
                <ul className='grid grid-cols-2 gap-y-1.5 gap-x-7.5'>
                    {contentTypes.map((contentType) => {
                        const key = contentType.getName();
                        const displayName = contentType.getTitle();
                        const description = contentType.getDescription() ?? '';
                        const iconUrl = contentType.getIconUrl();
                        const contentTypeName = String(contentType.getContentTypeName());

                        return (
                            <li key={key}>
                                <Button
                                    variant='text'
                                    className='w-full h-auto py-1.5 px-2 flex justify-start font-normal'
                                    onClick={() => handleContentTypeSelected(contentType)}
                                >
                                    <ItemLabel
                                        icon={
                                            <ContentIcon
                                                contentType={contentTypeName}
                                                url={iconUrl}
                                                className='size-12'
                                                imageSize={48}
                                            />
                                        }
                                        primary={displayName}
                                        secondary={description}
                                        className='[&>*:first-child]:size-12 ml-1.5 gap-4'
                                    />
                                </Button>
                            </li>
                        );
                    })}
                </ul>
            )}

            {contentTypes.length === 0 && <p className='text-sm text-subtle'>{notFoundLabel}</p>}
        </Tab.Content>
    );
};

NewContentDialogContentTypesTab.displayName = NEW_CONTENT_DIALOG_CONTENT_TYPES_TAB_NAME;
