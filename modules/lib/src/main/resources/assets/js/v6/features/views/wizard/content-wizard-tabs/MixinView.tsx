import {useStore} from '@nanostores/preact';
import {type ReactElement, useMemo} from 'react';
import {CONFIG} from '@enonic/lib-admin-ui/util/Config';
import type {Project} from '../../../../../app/settings/data/project/Project';
import {$contextContent} from '../../../store/context/contextContent.store';
import {$activeProject} from '../../../store/projects.store';
import {$mixinsDescriptors, $wizardDraftMixins} from '../../../store/wizardContent.store';
import {FormRenderer} from '../../../shared/form';
import {HtmlAreaProvider} from '../../../shared/form/input-types/html-area';
import {useApplicationKeys} from './useApplicationKeys';

type MixinViewProps = {
    mixinName: string;
    displayName: string;
};

export const MixinView = ({mixinName, displayName}: MixinViewProps): ReactElement => {
    const descriptors = useStore($mixinsDescriptors);
    const draftMixins = useStore($wizardDraftMixins);
    const contextContent = useStore($contextContent);
    const activeProject = useStore($activeProject);
    const applicationKeys = useApplicationKeys();

    const contentSummary = useMemo(
        () => contextContent?.getContentSummary(),
        [contextContent],
    );

    const assetsUri = CONFIG.getString('assetsUri');

    const descriptor = useMemo(
        () => descriptors.find((d) => d.getName() === mixinName),
        [descriptors, mixinName],
    );

    const mixinData = useMemo(
        () => draftMixins.find((m) => m.getName().toString() === mixinName)?.getData() ?? null,
        [draftMixins, mixinName],
    );

    const form = useMemo(() => descriptor?.toForm(), [descriptor]);

    if (!form || form.getFormItems().length === 0 || !mixinData) {
        return <p className="text-subtle">{displayName} configuration</p>;
    }

    return (
        <HtmlAreaProvider
            contentSummary={contentSummary}
            project={activeProject as Project}
            applicationKeys={applicationKeys}
            assetsUri={assetsUri}
        >
            <FormRenderer
                form={form}
                propertySet={mixinData.getRoot()}
            />
        </HtmlAreaProvider>
    );
};

MixinView.displayName = 'MixinView';
