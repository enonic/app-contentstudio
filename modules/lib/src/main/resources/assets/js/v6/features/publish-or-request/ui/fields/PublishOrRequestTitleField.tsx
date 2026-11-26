// Title field of the publish or request dialog's second step: the title of the publish request.

import { Input } from '@enonic/ui';
import { useStore } from '@nanostores/preact';
import { type ReactElement } from 'react';
import { useI18n } from '../../../../shared/lib/hooks/useI18n';
import { setPublishOrRequestTitle } from '../../model/commands/fields';
import { $publishOrRequestFields } from '../../model/publishOrRequestFields.store';

const PUBLISH_OR_REQUEST_TITLE_FIELD_NAME = 'PublishOrRequestTitleField';

export const PublishOrRequestTitleField = (): ReactElement => {
    const { title } = useStore($publishOrRequestFields, { keys: ['title'] });

    const label = useI18n('field.title');
    const helpText = useI18n('dialog.publishOrRequest.title.help');

    return (
        <div data-component={PUBLISH_OR_REQUEST_TITLE_FIELD_NAME}>
            <Input
                label={label}
                description={helpText}
                value={title}
                onInput={(event) => setPublishOrRequestTitle(event.currentTarget.value)}
            />
        </div>
    );
};

PublishOrRequestTitleField.displayName = PUBLISH_OR_REQUEST_TITLE_FIELD_NAME;
