import {RawValueProvider, ValidationVisibilityProvider} from '@enonic/lib-admin-ui/form2';
import {useStore} from '@nanostores/preact';
import {type ReactElement, useEffect, useMemo} from 'react';
import {FormRenderer} from '../../../shared/form';
import {useBreakpoints} from '../../../hooks/useBreakpoints';
import {$contentType, $wizardDraftData, notifyContentFormMounted} from '../../../store/wizardContent.store';
import {$validationVisibility, getContentRawValueMap} from '../../../store/wizardValidation.store';
import {DisplayNameInput} from './DisplayNameInput';
import {ImageUploaderDescriptor} from '../../../shared/form/input-types/image-uploader';

const CONTENT_FORM_NAME = 'ContentForm';

export const ContentForm = (): ReactElement | null => {
    const contentType = useStore($contentType);
    const draftData = useStore($wizardDraftData);
    const visibility = useStore($validationVisibility);
    const {lg} = useBreakpoints();

    const isReady = contentType != null && draftData != null;
    const rawValueMap = useMemo(() => getContentRawValueMap(), []);
    const applicationKey = useMemo(() => contentType?.getContentTypeName().getApplicationKey(), [contentType]);

    useEffect(() => {
        if (isReady) {
            notifyContentFormMounted();
        }
    }, [isReady]);

    // For image content types, the ImageUploader is rendered by `LiveViewImageEditor`
    // under the preview toolbar. Exclude it from the form on non-mobile resolutions
    // where the preview panel is visible, to avoid rendering the editor twice (and
    // briefly flashing it inside the form panel during initial load). On mobile the
    // preview is hidden, so fall back to the standard form rendering.
    const excludeInputTypes = useMemo<string[]>(() => {
        const excluded: string[] = [];

        if (contentType?.getContentTypeName().isImage() && lg) {
            excluded.push(ImageUploaderDescriptor.name);
        }

        return excluded;
    }, [contentType, lg]);

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
