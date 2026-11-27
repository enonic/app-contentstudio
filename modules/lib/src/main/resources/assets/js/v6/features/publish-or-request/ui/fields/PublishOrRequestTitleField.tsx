// Title field of the publish or request dialog's second step: the title of the publish request.

import { Input, usePrefixedId } from '@enonic/ui';
import { useStore } from '@nanostores/preact';
import { type ReactElement, useId } from 'react';
import { useI18n } from '../../../../shared/lib/hooks/useI18n';
import { setPublishOrRequestTitle } from '../../model/commands/fields';
import { $publishOrRequestFieldStates, $publishOrRequestFields } from '../../model/publishOrRequestFields.store';
import { PublishOrRequestFieldLabel } from './PublishOrRequestFieldLabel';

const PUBLISH_OR_REQUEST_TITLE_FIELD_NAME = 'PublishOrRequestTitleField';

export const PublishOrRequestTitleField = (): ReactElement => {
    const { title } = useStore($publishOrRequestFields, { keys: ['title'] });
    const { title: state } = useStore($publishOrRequestFieldStates);

    const baseId = useId();
    const inputBaseId = `${PUBLISH_OR_REQUEST_TITLE_FIELD_NAME}-${baseId}-input`;
    const helpId = `${PUBLISH_OR_REQUEST_TITLE_FIELD_NAME}-${baseId}-help`;
    // ? The input prefixes the id it is given, so the label points at the prefixed one.
    const inputId = usePrefixedId(inputBaseId);

    const label = useI18n('field.title');
    const helpText = useI18n('dialog.publishOrRequest.title.help');

    return (
        <div data-component={PUBLISH_OR_REQUEST_TITLE_FIELD_NAME} className="flex flex-col gap-2">
            <PublishOrRequestFieldLabel
                label={label}
                helpText={helpText}
                required={state.required}
                htmlFor={inputId}
                helpId={helpId}
            />
            <Input
                id={inputBaseId}
                value={title}
                onInput={(event) => setPublishOrRequestTitle(event.currentTarget.value)}
                aria-describedby={helpId}
                aria-required={state.required}
            />
        </div>
    );
};

PublishOrRequestTitleField.displayName = PUBLISH_OR_REQUEST_TITLE_FIELD_NAME;
