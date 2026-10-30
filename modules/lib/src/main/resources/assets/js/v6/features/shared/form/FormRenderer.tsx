import type { ApplicationKey } from '@enonic/lib-admin-ui/application/ApplicationKey';
import { showWarning } from '@enonic/lib-admin-ui/notify/MessageBus';
import { FormRenderer as ToolkitFormRenderer, LocaleProvider } from '@enonic/input-types';
import type { PropertySet } from '@enonic/input-types/data';
import type { Form } from '@enonic/input-types/schema';
import { useStore } from '@nanostores/preact';
import type { ReactElement, ReactNode } from 'react';
import { $config } from '../../../shared/config/config.store';
import { FormI18nProvider } from '../../../shared/ui/providers/FormI18nProvider';
import { useApplicationKeys } from '../hooks/useApplicationKeys';
import { type FormScope, FormScopeProvider, useFormScope } from './FormScopeContext';
import { HtmlAreaProvider, useOptionalHtmlAreaContext } from './input-types/html-area';

type FormRendererOwnProps = {
    form: Form;
    propertySet: PropertySet;
    enabled?: boolean;
    applicationKey?: ApplicationKey;
    excludeInputTypes?: readonly string[];
    revealFreshOccurrences?: boolean;
};

type FormRendererProps = FormScope & FormRendererOwnProps;

const notifyWarning = (message: string): void => {
    showWarning(message, true);
};

/**
 * The toolkit's form with what Content Studio wraps around it: its scope (project and
 * content), its phrases, the language, and what its HTML areas share (the app keys and
 * the assets). A nested form reuses the scope and the HTML area context above it unless
 * it sets its own scope, and still gets the phrases and the language, as the context may
 * come from outside a form.
 */
export const FormRenderer = ({ project, content, ...props }: FormRendererProps): ReactElement => {
    const ownScope = project !== undefined || content !== undefined;

    return (
        <FormScopeProvider project={project} content={content}>
            <ScopedForm {...props} ownScope={ownScope} />
        </FormScopeProvider>
    );
};

FormRenderer.displayName = 'FormRenderer';

//
// * ScopedForm
//

type ScopedFormProps = FormRendererOwnProps & {
    ownScope: boolean;
};

const ScopedForm = ({ applicationKey, ownScope, ...props }: ScopedFormProps): ReactElement => {
    const { project, content } = useFormScope();
    const existingHtmlAreaContext = useOptionalHtmlAreaContext();
    // A content without a language gets none, not the project's.
    const language = content ? content.getLanguage() : project?.getLanguage();
    const reuseHtmlAreaContext = existingHtmlAreaContext !== undefined && !ownScope;

    const renderedForm = (
        <ToolkitFormRenderer {...props} applicationKey={applicationKey?.toString()} notify={notifyWarning} />
    );

    return (
        <FormI18nProvider>
            <LocaleProvider locale={language}>
                {reuseHtmlAreaContext ? renderedForm : <HtmlAreaShell>{renderedForm}</HtmlAreaShell>}
            </LocaleProvider>
        </FormI18nProvider>
    );
};

ScopedForm.displayName = 'ScopedForm';

//
// * HtmlAreaShell
//

type HtmlAreaShellProps = {
    children: ReactNode;
};

// The app keys and the assets every HTML area in the form shares.
const HtmlAreaShell = ({ children }: HtmlAreaShellProps): ReactElement => {
    const { assetsUri } = useStore($config, { keys: ['assetsUri'] });
    const applicationKeys = useApplicationKeys();

    return (
        <HtmlAreaProvider applicationKeys={applicationKeys} assetsUri={assetsUri}>
            {children}
        </HtmlAreaProvider>
    );
};

HtmlAreaShell.displayName = 'HtmlAreaShell';
