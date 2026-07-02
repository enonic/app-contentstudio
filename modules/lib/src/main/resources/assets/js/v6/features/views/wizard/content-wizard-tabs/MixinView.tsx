import { FieldRegistryProvider, RawValueProvider, ValidationVisibilityProvider } from '@enonic/lib-admin-ui/form2';
import { Button } from '@enonic/ui';
import { useStore } from '@nanostores/preact';
import { OctagonAlert } from 'lucide-react';
import { type ReactElement, useCallback, useEffect, useMemo } from 'react';
import { useI18n } from '../../../../shared/lib/hooks/useI18n';
import { getAiFieldRegistry } from '../../../store/ai/ai.field-registry';
import {
    $mixinsDescriptors,
    $wizardDraftMixins,
    $wizardReadOnly,
    notifyMixinMounted,
    setDraftMixinEnabled,
} from '../../../store/wizardContent.store';
import { $validationVisibility, getMixinRawValueMap } from '../../../store/wizardValidation.store';
import { EditLockOverlay } from '../../../../shared/ui/EditLockOverlay';
import { FormRenderer } from '../../../shared/form';

type MixinViewProps = {
    mixinName: string;
};

const MIXIN_VIEW_NAME = 'MixinView';

export const MixinView = ({ mixinName }: MixinViewProps): ReactElement | null => {
    const descriptors = useStore($mixinsDescriptors);
    const draftMixins = useStore($wizardDraftMixins);
    const visibility = useStore($validationVisibility);
    const readOnly = useStore($wizardReadOnly);
    const unknownMessage = useI18n('field.mixin.unavailable');
    const detachLabel = useI18n('action.mixin.detach');

    const rawValueMap = useMemo(() => getMixinRawValueMap(mixinName), [mixinName]);

    const descriptor = useMemo(() => descriptors.find((d) => d.getName() === mixinName), [descriptors, mixinName]);

    const mixinData = useMemo(
        () => draftMixins.find((m) => m.getName().toString() === mixinName)?.getData() ?? null,
        [draftMixins, mixinName],
    );

    const form = useMemo(() => descriptor?.toForm(), [descriptor]);

    const applicationKey = useMemo(() => descriptor?.getMixinName().getApplicationKey(), [descriptor]);

    const fieldRegistry = useMemo(() => getAiFieldRegistry('mixin'), []);

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
                <OctagonAlert className="mt-0.5 size-5 shrink-0 text-error" strokeWidth={2} />
                <div className="flex flex-col gap-3">
                    <p className="text-sm">{unknownMessage}</p>
                    <Button
                        className="self-start font-semibold"
                        size="sm"
                        variant="outline"
                        label={detachLabel}
                        disabled={readOnly}
                        onClick={handleDetach}
                    />
                </div>
            </div>
        );
    }

    if (!form || !mixinData) return null;

    return (
        <EditLockOverlay locked={readOnly}>
            <ValidationVisibilityProvider visibility={visibility}>
                <RawValueProvider map={rawValueMap}>
                    <FieldRegistryProvider registry={fieldRegistry}>
                        <FormRenderer form={form} propertySet={mixinData.getRoot()} applicationKey={applicationKey} />
                    </FieldRegistryProvider>
                </RawValueProvider>
            </ValidationVisibilityProvider>
        </EditLockOverlay>
    );
};

MixinView.displayName = MIXIN_VIEW_NAME;
