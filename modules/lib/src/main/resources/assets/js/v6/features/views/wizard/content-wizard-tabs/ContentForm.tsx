import {RawValueProvider, ValidationVisibilityProvider} from '@enonic/lib-admin-ui/form2';
import {useStore} from '@nanostores/preact';
import {type ReactElement, useEffect, useMemo} from 'react';
import {FormRenderer} from '../../../shared/form';
import {$contentType, $wizardDraftData, notifyContentFormMounted} from '../../../store/wizardContent.store';
import {$validationVisibility, getContentRawValueMap} from '../../../store/wizardValidation.store';
import {DisplayNameInput} from './DisplayNameInput';
import {$isPreviewPanelVisible} from '../../../store/previewPanel.store';
import {ImageUploaderDescriptor} from '../../../shared/form/input-types/image-uploader';

const CONTENT_FORM_NAME = 'ContentForm';

export const ContentForm = (): ReactElement | null => {
    const contentType = useStore($contentType);
    const draftData = useStore($wizardDraftData);
    const visibility = useStore($validationVisibility);
    const isPreviewPanelVisible = useStore($isPreviewPanelVisible);

    const isReady = contentType != null && draftData != null;
    const rawValueMap = useMemo(() => getContentRawValueMap(), []);
    const applicationKey = useMemo(() => contentType?.getContentTypeName().getApplicationKey(), [contentType]);

    useEffect(() => {
        if (isReady) {
            notifyContentFormMounted();
        }
    }, [isReady]);

    // For image content types, the ImageUploader is rendered by `LiveViewImageEditor`
    // under the preview toolbar whenever the preview panel is visible. Exclude it from
    // the form here to avoid rendering the editor twice. When the preview is hidden,
    // fall back to the standard form rendering so the user still has access to it.
    const excludeInputTypes = useMemo<string[]>(() => {
        const excluded: string[] = [];

        if (contentType?.getContentTypeName().isImage() && isPreviewPanelVisible) {
            excluded.push(ImageUploaderDescriptor.name);
        }

        return excluded;
    }, [contentType, isPreviewPanelVisible]);

    if (!isReady) {
        return null;
    }

    return (
        <div data-component={CONTENT_FORM_NAME} className="flex flex-col gap-7.5">
            <DisplayNameInput />
            <ValidationVisibilityProvider visibility={visibility}>
                <RawValueProvider map={rawValueMap}>
                    <FormRenderer
                        form={contentType.getForm()}
                        propertySet={draftData.getRoot()}
                        applicationKey={applicationKey}
                        excludeInputTypes={excludeInputTypes}
                    />
                </RawValueProvider>
            </ValidationVisibilityProvider>
        </div>
    );
};

ContentForm.displayName = CONTENT_FORM_NAME;
