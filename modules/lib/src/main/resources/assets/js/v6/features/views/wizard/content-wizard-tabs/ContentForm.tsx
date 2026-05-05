import {RawValueProvider, ValidationVisibilityProvider} from '@enonic/lib-admin-ui/form2';
import {useStore} from '@nanostores/preact';
import {type ReactElement, useEffect, useMemo} from 'react';
import {FormRenderer} from '../../../shared/form';
import {$contentType, $wizardDraftData, notifyContentFormMounted} from '../../../store/wizardContent.store';
import {$validationVisibility, getContentRawValueMap} from '../../../store/wizardValidation.store';
import {DisplayNameInput} from './DisplayNameInput';

const CONTENT_FORM_NAME = 'ContentForm';

export const ContentForm = (): ReactElement | null => {
    const contentType = useStore($contentType);
    const draftData = useStore($wizardDraftData);
    const visibility = useStore($validationVisibility);

    const isReady = contentType != null && draftData != null;

    useEffect(() => {
        if (isReady) {
            notifyContentFormMounted();
        }
    }, [isReady]);

    const rawValueMap = useMemo(() => getContentRawValueMap(), []);

    const applicationKey = useMemo(
        () => contentType?.getContentTypeName().getApplicationKey(),
        [contentType],
    );

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
                    />
                </RawValueProvider>
            </ValidationVisibilityProvider>
        </div>
    );
};

ContentForm.displayName = CONTENT_FORM_NAME;
