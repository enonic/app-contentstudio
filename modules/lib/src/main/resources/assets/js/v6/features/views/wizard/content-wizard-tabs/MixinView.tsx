import {useStore} from '@nanostores/preact';
import {type ReactElement, useMemo} from 'react';
import {RawValueProvider, ValidationVisibilityProvider} from '@enonic/lib-admin-ui/form2';
import {CONFIG} from '@enonic/lib-admin-ui/util/Config';
import {$contextContent} from '../../../store/context/contextContent.store';
import {$activeProject} from '../../../store/projects.store';
import {$mixinsDescriptors, $wizardDraftMixins} from '../../../store/wizardContent.store';
import {$validationVisibility, getMixinRawValueMap} from '../../../store/wizardValidation.store';
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
    const visibility = useStore($validationVisibility);
    const applicationKeys = useApplicationKeys();

    const rawValueMap = useMemo(() => getMixinRawValueMap(mixinName), [mixinName]);

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
        <ValidationVisibilityProvider visibility={visibility}>
            <RawValueProvider map={rawValueMap}>
                <HtmlAreaProvider
                    contentSummary={contentSummary}
                    project={activeProject}
                    applicationKeys={applicationKeys}
                    assetsUri={assetsUri}
                >
                    <FormRenderer
                        form={form}
                        propertySet={mixinData.getRoot()}
                    />
                </HtmlAreaProvider>
            </RawValueProvider>
        </ValidationVisibilityProvider>
    );
};

MixinView.displayName = 'MixinView';
