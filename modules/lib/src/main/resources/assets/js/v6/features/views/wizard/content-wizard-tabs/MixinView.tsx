import {useStore} from '@nanostores/preact';
import {type ReactElement, useMemo} from 'react';
import {$mixinsDescriptors, $wizardDraftMixins} from '../../../store/wizardContent.store';
import {FormRenderer} from '../../../shared/form';

type MixinViewProps = {
    mixinName: string;
    displayName: string;
};

export const MixinView = ({mixinName, displayName}: MixinViewProps): ReactElement => {
    const descriptors = useStore($mixinsDescriptors);
    const draftMixins = useStore($wizardDraftMixins);

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
        <FormRenderer
            form={form}
            propertySet={mixinData.getRoot()}
        />
    );
};

MixinView.displayName = 'MixinView';
