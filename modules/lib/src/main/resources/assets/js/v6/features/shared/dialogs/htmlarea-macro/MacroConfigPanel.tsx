import {ValidationVisibilityProvider} from '@enonic/lib-admin-ui/form2';
import {type ReactElement} from 'react';
import {useI18n} from '../../../hooks/useI18n';
import {FormRenderer} from '../../form/FormRenderer';
import {useHtmlAreaMacroDialogContext} from './HtmlAreaMacroDialogContext';

const COMPONENT_NAME = 'MacroConfigPanel';

export const MacroConfigPanel = (): ReactElement => {
    const {
        state: {selectedDescriptor, data, configLoading},
        validationVisibility,
    } = useHtmlAreaMacroDialogContext();

    const noConfigLabel = useI18n('dialog.macro.form.noconfig');
    const loadingLabel = useI18n('dialog.macro.list.loading');

    if (!selectedDescriptor) {
        return <div data-component={COMPONENT_NAME} />;
    }

    const form = selectedDescriptor.getForm();

    if (!form || form.getFormItems().length === 0) {
        return (
            <div data-component={COMPONENT_NAME} className='py-4 text-sm text-subtle'>
                {noConfigLabel}
            </div>
        );
    }

    return (
        <div data-component={COMPONENT_NAME} className='relative py-2'>
            <ValidationVisibilityProvider visibility={validationVisibility}>
                <FormRenderer form={form} propertySet={data} enabled={!configLoading} />
            </ValidationVisibilityProvider>
            {configLoading && (
                <div className='absolute inset-0 flex items-center justify-center bg-surface/50'>
                    <span className='text-sm text-subtle'>{loadingLabel}</span>
                </div>
            )}
        </div>
    );
};

MacroConfigPanel.displayName = COMPONENT_NAME;
