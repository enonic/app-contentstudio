import type {ApplicationKey} from '@enonic/lib-admin-ui/application/ApplicationKey';
import type {Form} from '@enonic/lib-admin-ui/form/Form';
import type {PropertySet} from '@enonic/lib-admin-ui/data/PropertySet';
import {CONFIG} from '@enonic/lib-admin-ui/util/Config';
import {useStore} from '@nanostores/preact';
import {type ReactElement, type ReactNode, useMemo} from 'react';
import {useApplicationKeys} from '../../hooks/useApplicationKeys';
import {$contextContent} from '../../store/context/contextContent.store';
import {$activeProject} from '../../store/projects.store';
import {Input} from '@enonic/lib-admin-ui/form/Input';
import {instanceOf} from '../../utils/object/instanceOf';
import {FormRenderProvider} from './FormRenderContext';
import {FormItemRenderer} from './FormItemRenderer';
import {HtmlAreaProvider, useOptionalHtmlAreaContext} from './input-types/html-area';

type FormRendererProps = {
    form: Form;
    propertySet: PropertySet;
    enabled?: boolean;
    applicationKey?: ApplicationKey;
    excludeInputTypes?: string[];
};

export const FormRenderer = ({form, propertySet, enabled = true, applicationKey, excludeInputTypes}: FormRendererProps): ReactElement => {
    const existingHtmlAreaContext = useOptionalHtmlAreaContext();

    const excluded = useMemo(() => new Set((excludeInputTypes ?? []).map((name) => name.toLowerCase())), [excludeInputTypes]);

    const items =
        excluded.size === 0
            ? form.getFormItems()
            : form.getFormItems().filter((item) => {
                  if (!instanceOf(item, Input)) return true;
                  return !excluded.has(item.getInputType().getName().toLowerCase());
              });

    const renderedForm = (
        <FormRenderProvider enabled={enabled} applicationKey={applicationKey}>
            <div className="flex flex-col gap-7.5" data-component="FormRenderer">
                {items.map((item) => (
                    <FormItemRenderer key={item.getName()} formItem={item} propertySet={propertySet} />
                ))}
            </div>
        </FormRenderProvider>
    );

    if (existingHtmlAreaContext) {
        return renderedForm;
    }

    return <HtmlAreaShell>{renderedForm}</HtmlAreaShell>;
};

FormRenderer.displayName = 'FormRenderer';

//
// * HtmlAreaShell
//

// Mounts only when no HtmlAreaProvider exists above. Subscriptions live here
// so nested FormRenderers inheriting an existing provider don't pay for them.
const HtmlAreaShell = ({children}: {children: ReactNode}): ReactElement => {
    const contextContent = useStore($contextContent);
    const activeProject = useStore($activeProject);
    const applicationKeys = useApplicationKeys();

    return (
        <HtmlAreaProvider
            contentSummary={contextContent ?? undefined}
            project={activeProject}
            applicationKeys={applicationKeys}
            assetsUri={CONFIG.getString('assetsUri')}
        >
            {children}
        </HtmlAreaProvider>
    );
};

HtmlAreaShell.displayName = 'HtmlAreaShell';
