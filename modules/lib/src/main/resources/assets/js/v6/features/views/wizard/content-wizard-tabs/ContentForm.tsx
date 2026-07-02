import {
    FieldRegistryProvider,
    RawValueProvider,
    ServerErrorsProvider,
    ValidationVisibilityProvider,
} from '@enonic/lib-admin-ui/form2';
import { useStore } from '@nanostores/preact';
import { type ReactElement, useEffect, useMemo } from 'react';
import { EditLockOverlay } from '../../../../shared/ui/EditLockOverlay';
import { FormRenderer } from '../../../shared/form';
import { useBreakpoints } from '../../../../shared/lib/hooks/useBreakpoints';
import { getAiFieldRegistry } from '../../../store/ai/ai.field-registry';
import {
    $contentType,
    $wizardDraftData,
    $wizardReadOnly,
    notifyContentFormMounted,
} from '../../../store/wizardContent.store';
import {
    $dataServerErrorEntries,
    $validationVisibility,
    clearServerErrorsAtPath,
    clearServerErrorsForField,
    getContentRawValueMap,
} from '../../../store/wizardValidation.store';
import { DisplayNameInput } from './DisplayNameInput';
import { ImageUploaderDescriptor } from '../../../shared/form/input-types/image-uploader';

const CONTENT_FORM_NAME = 'ContentForm';

export const ContentForm = (): ReactElement | null => {
    const contentType = useStore($contentType);
    const draftData = useStore($wizardDraftData);
    const visibility = useStore($validationVisibility);
    const dataServerErrorEntries = useStore($dataServerErrorEntries);
    const readOnly = useStore($wizardReadOnly);
    const { lg } = useBreakpoints();

    const isReady = contentType != null && draftData != null;
    const rawValueMap = useMemo(() => getContentRawValueMap(), []);
    const applicationKey = useMemo(() => contentType?.getContentTypeName().getApplicationKey(), [contentType]);
    const fieldRegistry = useMemo(() => getAiFieldRegistry('data'), []);

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
        <EditLockOverlay locked={readOnly} contentClassName="flex flex-col gap-7.5 pb-10">
            <DisplayNameInput />
            <ValidationVisibilityProvider visibility={visibility}>
                <RawValueProvider map={rawValueMap}>
                    <FieldRegistryProvider registry={fieldRegistry}>
                        <ServerErrorsProvider
                            entries={dataServerErrorEntries}
                            clear={clearServerErrorsAtPath}
                            clearField={clearServerErrorsForField}
                        >
                            <FormRenderer
                                form={contentType.getForm()}
                                propertySet={draftData.getRoot()}
                                applicationKey={applicationKey}
                                excludeInputTypes={excludeInputTypes}
                            />
                        </ServerErrorsProvider>
                    </FieldRegistryProvider>
                </RawValueProvider>
            </ValidationVisibilityProvider>
        </EditLockOverlay>
    );
};

ContentForm.displayName = CONTENT_FORM_NAME;
