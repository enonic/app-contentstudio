import type { ApplicationKey } from '@enonic/lib-admin-ui/application/ApplicationKey';
import { showWarning } from '@enonic/lib-admin-ui/notify/MessageBus';
import { FormRenderer as ToolkitFormRenderer, LocaleProvider } from '@enonic/input-types';
import type { PropertySet } from '@enonic/input-types/data';
import type { Form } from '@enonic/input-types/schema';
import { useStore } from '@nanostores/preact';
import type { ReactElement, ReactNode } from 'react';
import type { ContentSummary } from '../../../../app/content/ContentSummary';
import { $contextContent } from '../../../entities/content';
import { $activeProject } from '../../../entities/project';
import { $config } from '../../../shared/config/config.store';
import { FormI18nProvider } from '../../../shared/ui/providers/FormI18nProvider';
import { useApplicationKeys } from '../hooks/useApplicationKeys';
import { HtmlAreaProvider, useOptionalHtmlAreaContext } from './input-types/html-area';

type FormRendererProps = {
    form: Form;
    propertySet: PropertySet;
    enabled?: boolean;
    applicationKey?: ApplicationKey;
    excludeInputTypes?: readonly string[];
    revealFreshOccurrences?: boolean;
};

const notifyWarning = (message: string): void => {
    showWarning(message, true);
};

/**
 * The toolkit's form with what Content Studio wraps around it: its phrases, the content's
 * language, and the HTML area's context. A nested form reuses the HTML area context above it
 * and still gets the phrases and the language, as the context may come from outside a form.
 */
export const FormRenderer = ({ applicationKey, ...props }: FormRendererProps): ReactElement => {
    const contextContent = useStore($contextContent);
    const existingHtmlAreaContext = useOptionalHtmlAreaContext();

    const renderedForm = (
        <ToolkitFormRenderer {...props} applicationKey={applicationKey?.toString()} notify={notifyWarning} />
    );

    return (
        <FormI18nProvider>
            <LocaleProvider locale={contextContent?.getLanguage()}>
                {existingHtmlAreaContext ? (
                    renderedForm
                ) : (
                    <HtmlAreaShell contextContent={contextContent}>{renderedForm}</HtmlAreaShell>
                )}
            </LocaleProvider>
        </FormI18nProvider>
    );
};

FormRenderer.displayName = 'FormRenderer';

//
// * HtmlAreaShell
//

type HtmlAreaShellProps = {
    contextContent: ContentSummary | null;
    children: ReactNode;
};

// Mounts only when no HtmlAreaProvider exists above, so a nested form does not pay for its subscriptions.
const HtmlAreaShell = ({ contextContent, children }: HtmlAreaShellProps): ReactElement => {
    const activeProject = useStore($activeProject);
    const { assetsUri } = useStore($config, { keys: ['assetsUri'] });
    const applicationKeys = useApplicationKeys();

    return (
        <HtmlAreaProvider
            contentSummary={contextContent ?? undefined}
            project={activeProject}
            applicationKeys={applicationKeys}
            assetsUri={assetsUri}
        >
            {children}
        </HtmlAreaProvider>
    );
};

HtmlAreaShell.displayName = 'HtmlAreaShell';
