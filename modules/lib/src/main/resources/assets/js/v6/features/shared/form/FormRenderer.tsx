import type {ApplicationKey} from '@enonic/lib-admin-ui/application/ApplicationKey';
import type {Form} from '@enonic/lib-admin-ui/form/Form';
import type {PropertySet} from '@enonic/lib-admin-ui/data/PropertySet';
import {type ReactElement} from 'react';
import {FormRenderProvider} from './FormRenderContext';
import {FormItemRenderer} from './FormItemRenderer';

type FormRendererProps = {
    form: Form;
    propertySet: PropertySet;
    enabled?: boolean;
    applicationKey?: ApplicationKey;
};

export const FormRenderer = ({form, propertySet, enabled = true, applicationKey}: FormRendererProps): ReactElement => {
    return (
        <FormRenderProvider enabled={enabled} applicationKey={applicationKey}>
            <div className="flex flex-col gap-7.5" data-component="FormRenderer">
                {form.getFormItems().map(item => (
                    <FormItemRenderer key={item.getName()} formItem={item} propertySet={propertySet} />
                ))}
            </div>
        </FormRenderProvider>
    );
};

FormRenderer.displayName = 'FormRenderer';
