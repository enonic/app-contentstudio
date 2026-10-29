import type { ApplicationKey } from '@enonic/lib-admin-ui/application/ApplicationKey';
import { showWarning } from '@enonic/lib-admin-ui/notify/MessageBus';
import { FormRenderer as ToolkitFormRenderer, LocaleProvider } from '@enonic/input-types';
import type { PropertySet } from '@enonic/input-types/data';
import type { Form } from '@enonic/input-types/schema';
import { useStore } from '@nanostores/preact';
import type { ReactElement, ReactNode } from 'react';
import type { ContentSummary } from '../../../../app/content/ContentSummary';
import type { Project } from '../../../../app/settings/data/project/Project';
import { $config } from '../../../shared/config/config.store';
import { FormI18nProvider } from '../../../shared/ui/providers/FormI18nProvider';
import { useApplicationKeys } from '../hooks/useApplicationKeys';
import { FormScopeProvider, useFormScope } from './FormScopeContext';
import { HtmlAreaProvider, useOptionalHtmlAreaContext } from './input-types/html-area';

type FormRendererProps = {
    form: Form;
    propertySet: PropertySet;
    enabled?: boolean;
    applicationKey?: ApplicationKey;
    excludeInputTypes?: readonly string[];
    revealFreshOccurrences?: boolean;
    /** The project the inputs work against. Absent: the active project. `null`: none. */
    project?: Readonly<Project> | null;
    /** The content the inputs belong to. Absent: the context content. `null`: none. */
    content?: ContentSummary | null;
};

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

type ScopedFormProps = Omit<FormRendererProps, 'project' | 'content'> & {
    ownScope: boolean;
};

const ScopedForm = ({ applicationKey, ownScope, ...props }: ScopedFormProps): ReactElement => {
    const { project, content } = useFormScope();
    const existingHtmlAreaContext = useOptionalHtmlAreaContext();
    // A content without a language gets none, not the project's.
    const language = content ? content.getLanguage() : project?.getLanguage();
    // The app keys above were derived from another scope when this form sets its own.
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

// Shares the scope's app keys with every HTML area in the form. Mounts only when no HtmlAreaProvider
// exists above or the form sets its own scope, so a nested form without one does not pay for the subscriptions.
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
