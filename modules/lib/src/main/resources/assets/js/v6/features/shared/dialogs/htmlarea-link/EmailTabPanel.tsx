import {Input} from '@enonic/ui';
import {type ReactElement} from 'react';
import {useI18n} from '../../../hooks/useI18n';
import {useHtmlAreaLinkDialogContext} from './HtmlAreaLinkDialogContext';

const COMPONENT_NAME = 'EmailTabPanel';

export const EmailTabPanel = (): ReactElement => {
    const {
        state: {email, emailSubject},
        validationErrors: errors,
        setEmail,
        setEmailSubject,
    } = useHtmlAreaLinkDialogContext();

    const emailLabel = useI18n('dialog.link.formitem.email');
    const subjectLabel = useI18n('dialog.link.formitem.subject');

    return (
        <div data-component={COMPONENT_NAME} className='flex flex-col gap-4 pt-4'>
            <Input
                label={`${emailLabel} *`}
                value={email}
                required
                error={errors.email}
                onChange={(e) => setEmail((e.target as HTMLInputElement).value)}
            />
            <Input
                label={subjectLabel}
                value={emailSubject}
                onChange={(e) => setEmailSubject((e.target as HTMLInputElement).value)}
            />
        </div>
    );
};

EmailTabPanel.displayName = COMPONENT_NAME;
