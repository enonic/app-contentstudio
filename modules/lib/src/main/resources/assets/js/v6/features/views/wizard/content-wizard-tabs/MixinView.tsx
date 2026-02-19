import {useStore} from '@nanostores/preact';
import {type ReactElement, useMemo} from 'react';
import {$mixinsDescriptors} from '../../../store/wizardContent.store';
import {getMixinDataContext} from '../../../store/wizardMixinData.store';
import {FormDataContext} from './FormDataContext';
import {FormItemView} from './FormItemView';

type MixinViewProps = {
    mixinName: string;
    displayName: string;
};

export const MixinView = ({mixinName, displayName}: MixinViewProps): ReactElement => {
    const descriptors = useStore($mixinsDescriptors);

    const descriptor = useMemo(
        () => descriptors.find((d) => d.getName() === mixinName),
        [descriptors, mixinName],
    );

    const formDataContext = useMemo(() => getMixinDataContext(mixinName), [mixinName]);

    const formItems = descriptor?.getFormItems();

    if (!formItems || formItems.length === 0) {
        return <p className="text-subtle">{displayName} configuration</p>;
    }

    return (
        <FormDataContext.Provider value={formDataContext}>
            <div className="flex flex-col gap-7.5">
                {formItems.map(item => (
                    <FormItemView
                        key={item.getName()}
                        formItem={item}
                    />
                ))}
            </div>
        </FormDataContext.Provider>
    );
};

MixinView.displayName = 'MixinView';
