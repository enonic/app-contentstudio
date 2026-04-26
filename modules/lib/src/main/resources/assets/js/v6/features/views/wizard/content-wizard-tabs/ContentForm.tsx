import {RawValueProvider, ValidationVisibilityProvider} from '@enonic/lib-admin-ui/form2';
import {CONFIG} from '@enonic/lib-admin-ui/util/Config';
import {useStore} from '@nanostores/preact';
import {type ReactElement, useEffect, useMemo} from 'react';
import {FormRenderer} from '../../../shared/form';
import {HtmlAreaProvider} from '../../../shared/form/input-types/html-area';
import {$contextContent} from '../../../store/context/contextContent.store';
import {$activeProject} from '../../../store/projects.store';
import {$contentType, $wizardDraftData, notifyContentFormMounted} from '../../../store/wizardContent.store';
import {$validationVisibility, getContentRawValueMap} from '../../../store/wizardValidation.store';
import {DisplayNameInput} from './DisplayNameInput';
import {useApplicationKeys} from './useApplicationKeys';

const CONTENT_FORM_NAME = 'ContentForm';

export const ContentForm = (): ReactElement | null => {
    const contentType = useStore($contentType);
    const draftData = useStore($wizardDraftData);
    const contextContent = useStore($contextContent);
    const activeProject = useStore($activeProject);
    const visibility = useStore($validationVisibility);
    const applicationKeys = useApplicationKeys();

    const isReady = contentType != null && draftData != null;

    useEffect(() => {
        if (isReady) {
            notifyContentFormMounted();
        }
    }, [isReady]);

    const rawValueMap = useMemo(() => getContentRawValueMap(), []);

    const contentSummary = contextContent ?? undefined;

    const applicationKey = useMemo(
        () => contentType?.getContentTypeName().getApplicationKey(),
        [contentType],
    );

    const assetsUri = CONFIG.getString('assetsUri');

    if (!isReady) {
        return null;
    }

    return (
        <div data-component={CONTENT_FORM_NAME} className="flex flex-col gap-7.5">
            <DisplayNameInput />
            <ValidationVisibilityProvider visibility={visibility}>
                <RawValueProvider map={rawValueMap}>
                    <HtmlAreaProvider
                        contentSummary={contentSummary}
                        project={activeProject}
                        applicationKeys={applicationKeys}
                        assetsUri={assetsUri}
                    >
                        <FormRenderer
                            form={contentType.getForm()}
                            propertySet={draftData.getRoot()}
                            applicationKey={applicationKey}
                        />
                    </HtmlAreaProvider>
                </RawValueProvider>
            </ValidationVisibilityProvider>
        </div>
    );
};

ContentForm.displayName = CONTENT_FORM_NAME;
