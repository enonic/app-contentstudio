import {Button, Tab} from '@enonic/ui';
import {ReactElement} from 'react';
import {ItemLabel} from '../../ItemLabel';
import {ContentIcon} from '../../icons/ContentIcon';
import {NewContentEvent} from '../../../../../app/create/NewContentEvent';
import {ContentSummaryAndCompareStatus} from '../../../../../app/content/ContentSummaryAndCompareStatus';
import {ContentTypeSummary} from '@enonic/lib-admin-ui/schema/content/ContentTypeSummary';
import {useI18n} from '../../../hooks/useI18n';

const NEW_CONTENT_DIALOG_CONTENT_TYPES_TAB_NAME = 'NewContentDialogContentTypesTab';

export const NewContentDialogContentTypesTab = ({
    tabName,
    contentTypes,
    parentContent,
}: {
    tabName: string;
    contentTypes: ContentTypeSummary[];
    parentContent: ContentSummaryAndCompareStatus;
}): ReactElement => {
    const notFoundLabel = useI18n('dialog.new.notFound');

    const handleContentTypeSelected = (contentType: ContentTypeSummary) => {
        new NewContentEvent(contentType, parentContent?.getContentSummary()).fire();
    };

    return (
        <Tab.Content value={tabName} className="py-7.5">
            {contentTypes.length > 0 && (
                <ul className="grid grid-cols-2 gap-2.5">
                    {contentTypes.map((contentType) => {
                        const key = contentType.getName();
                        const displayName = contentType.getDisplayName().toString();
                        const description = contentType.getDescription().toString();
                        const iconUrl = contentType.getIconUrl();
                        const contentTypeName = contentType.getContentTypeName().toString();

                        return (
                            <li key={key}>
                                <Button
                                    variant="text"
                                    className="w-full h-auto py-1 pl-2.5 pr-6.75 flex justify-start"
                                    onClick={() => handleContentTypeSelected(contentType)}
                                >
                                    <ItemLabel
                                        icon={<ContentIcon contentType={contentTypeName} url={iconUrl} />}
                                        primary={displayName}
                                        secondary={description}
                                    />
                                </Button>
                            </li>
                        );
                    })}
                </ul>
            )}

            {contentTypes.length === 0 && <p className="text-sm text-subtle">{notFoundLabel}</p>}
        </Tab.Content>
    );
};

NewContentDialogContentTypesTab.displayName = NEW_CONTENT_DIALOG_CONTENT_TYPES_TAB_NAME;
