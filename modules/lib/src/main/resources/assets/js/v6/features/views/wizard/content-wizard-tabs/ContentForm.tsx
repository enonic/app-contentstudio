import {useStore} from '@nanostores/preact';
import {type ReactElement, useMemo} from 'react';
import {CONFIG} from '@enonic/lib-admin-ui/util/Config';
import {$contextContent} from '../../../store/context/contextContent.store';
import {$activeProject} from '../../../store/projects.store';
import {$contentType, $wizardDraftData} from '../../../store/wizardContent.store';
import {FormRenderer} from '../../../shared/form';
import {HtmlAreaProvider} from '../../../shared/form/input-types/html-area';
import {DisplayNameInput} from './DisplayNameInput';
import {useApplicationKeys} from './useApplicationKeys';

export const ContentForm = (): ReactElement | null => {
    const contentType = useStore($contentType);
    const draftData = useStore($wizardDraftData);
    const contextContent = useStore($contextContent);
    const activeProject = useStore($activeProject);
    const applicationKeys = useApplicationKeys();

    const contentSummary = useMemo(
        () => contextContent?.getContentSummary(),
        [contextContent],
    );

    const assetsUri = CONFIG.getString('assetsUri');

    if (!contentType || !draftData) {
        return null;
    }

    return (
        <div className="flex flex-col gap-7.5">
            <DisplayNameInput />
            <HtmlAreaProvider
                contentSummary={contentSummary}
                project={activeProject}
                applicationKeys={applicationKeys}
                assetsUri={assetsUri}
            >
                <FormRenderer
                    form={contentType.getForm()}
                    propertySet={draftData.getRoot()}
                />
            </HtmlAreaProvider>
        </div>
    );
};

ContentForm.displayName = 'ContentForm';
