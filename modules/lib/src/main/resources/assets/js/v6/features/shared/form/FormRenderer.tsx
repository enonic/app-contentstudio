import type { ApplicationKey } from '@enonic/lib-admin-ui/application/ApplicationKey';
import { showWarning } from '@enonic/lib-admin-ui/notify/MessageBus';
import {
    FormRenderer as ToolkitFormRenderer,
    type FormRendererProps as ToolkitFormRendererProps,
    LocaleProvider,
} from '@enonic/input-types';
import { useStore } from '@nanostores/preact';
import type { ReactElement, ReactNode } from 'react';
import { $contextContent } from '../../../widgets/context-panel/model/contextContent.store';
import { $activeProject } from '../../../entities/project';
import { $config } from '../../../shared/config/config.store';
import { useApplicationKeys } from '../hooks/useApplicationKeys';
import { FormI18nProvider } from './FormI18nProvider';
import { HtmlAreaProvider, useOptionalHtmlAreaContext } from './input-types/html-area';

type FormRendererProps = Omit<ToolkitFormRendererProps, 'applicationKey' | 'notify' | 'registry'> & {
    applicationKey?: ApplicationKey | string;
};

const notifyWarning = (message: string): void => {
    showWarning(message, true);
};

/**
 * The toolkit's form with what Content Studio wraps around it: its phrases, the content's
 * language, and the HTML area's context. A nested form finds the context above and adds nothing.
 */
export const FormRenderer = ({ applicationKey, ...props }: FormRendererProps): ReactElement => {
    const existingHtmlAreaContext = useOptionalHtmlAreaContext();

    const renderedForm = (
        <ToolkitFormRenderer
            {...props}
            applicationKey={typeof applicationKey === 'string' ? applicationKey : applicationKey?.toString()}
            notify={notifyWarning}
        />
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
const HtmlAreaShell = ({ children }: { children: ReactNode }): ReactElement => {
    const contextContent = useStore($contextContent);
    const activeProject = useStore($activeProject);
    const { assetsUri } = useStore($config, { keys: ['assetsUri'] });
    const applicationKeys = useApplicationKeys();

    return (
        <FormI18nProvider>
            <LocaleProvider locale={contextContent?.getLanguage()}>
                <HtmlAreaProvider
                    contentSummary={contextContent ?? undefined}
                    project={activeProject}
                    applicationKeys={applicationKeys}
                    assetsUri={assetsUri}
                >
                    {children}
                </HtmlAreaProvider>
            </LocaleProvider>
        </FormI18nProvider>
    );
};

HtmlAreaShell.displayName = 'HtmlAreaShell';
