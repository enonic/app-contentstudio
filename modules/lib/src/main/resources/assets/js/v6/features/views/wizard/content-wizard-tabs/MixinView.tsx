import {Button} from '@enonic/ui';
import {useStore} from '@nanostores/preact';
import {OctagonAlert} from 'lucide-react';
import {type ReactElement, useCallback, useEffect, useMemo} from 'react';
import {RawValueProvider, ValidationVisibilityProvider} from '@enonic/lib-admin-ui/form2';
import {CONFIG} from '@enonic/lib-admin-ui/util/Config';
import {useI18n} from '../../../hooks/useI18n';
import {$contextContent} from '../../../store/context/contextContent.store';
import {$activeProject} from '../../../store/projects.store';
import {$mixinsDescriptors, $wizardDraftMixins, notifyMixinMounted, setDraftMixinEnabled} from '../../../store/wizardContent.store';
import {$validationVisibility, getMixinRawValueMap} from '../../../store/wizardValidation.store';
import {FormRenderer} from '../../../shared/form';
import {HtmlAreaProvider} from '../../../shared/form/input-types/html-area';
import {useApplicationKeys} from './useApplicationKeys';

type MixinViewProps = {
    mixinName: string;
};

export const MixinView = ({mixinName}: MixinViewProps): ReactElement | null => {
    const descriptors = useStore($mixinsDescriptors);
    const draftMixins = useStore($wizardDraftMixins);
    const contextContent = useStore($contextContent);
    const activeProject = useStore($activeProject);
    const visibility = useStore($validationVisibility);
    const applicationKeys = useApplicationKeys();
    const unknownMessage = useI18n('field.mixin.unavailable');
    const detachLabel = useI18n('action.mixin.detach');

    const rawValueMap = useMemo(() => getMixinRawValueMap(mixinName), [mixinName]);

    const contentSummary = contextContent ?? undefined;

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

    const applicationKey = useMemo(
        () => descriptor?.getMixinName().getApplicationKey(),
        [descriptor],
    );

    const isUnknown = !descriptor && draftMixins.some((mixin) => mixin.getName().toString() === mixinName);

    const handleDetach = useCallback(() => {
        setDraftMixinEnabled(mixinName, false);
    }, [mixinName]);

    useEffect(() => {
        notifyMixinMounted(mixinName);
    }, [mixinName]);

    if (isUnknown) {
        return (
            <div className="flex items-start gap-3 rounded border border-error/40 bg-error/5 p-4">
                <OctagonAlert className="mt-0.5 size-5 shrink-0 text-error" strokeWidth={2}/>
                <div className="flex flex-col gap-3">
                    <p className="text-sm">{unknownMessage}</p>
                    <Button
                        className="self-start font-semibold"
                        size="sm"
                        variant="outline"
                        label={detachLabel}
                        onClick={handleDetach}
                    />
                </div>
            </div>
        );
    }

    if (!form || !mixinData) return null;

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
                        applicationKey={applicationKey}
                    />
                </HtmlAreaProvider>
            </RawValueProvider>
        </ValidationVisibilityProvider>
    );
};

MixinView.displayName = 'MixinView';
