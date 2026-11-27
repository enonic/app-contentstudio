// Comment field of the publish or request dialog's second step: the publish message,
// or the description of the publish request.

import { TextArea, usePrefixedId } from '@enonic/ui';
import { useStore } from '@nanostores/preact';
import { type ReactElement, useId } from 'react';
import { useI18n } from '../../../../shared/lib/hooks/useI18n';
import { setPublishOrRequestComment } from '../../model/commands/fields';
import { $publishOrRequestFieldStates, $publishOrRequestFields } from '../../model/publishOrRequestFields.store';
import { PublishOrRequestFieldLabel } from './PublishOrRequestFieldLabel';

const PUBLISH_OR_REQUEST_COMMENT_FIELD_NAME = 'PublishOrRequestCommentField';

export const PublishOrRequestCommentField = (): ReactElement => {
    const { comment } = useStore($publishOrRequestFields, { keys: ['comment'] });
    const { comment: state } = useStore($publishOrRequestFieldStates);

    const baseId = useId();
    const textAreaBaseId = `${PUBLISH_OR_REQUEST_COMMENT_FIELD_NAME}-${baseId}-textarea`;
    const helpId = `${PUBLISH_OR_REQUEST_COMMENT_FIELD_NAME}-${baseId}-help`;
    // ? The text area prefixes the id it is given, so the label points at the prefixed one.
    const textAreaId = usePrefixedId(textAreaBaseId);

    const label = useI18n('field.comment.label');
    const helpText = useI18n('dialog.publishOrRequest.comment.help');
    const placeholder = useI18n('field.comment.aria.label');

    return (
        <div data-component={PUBLISH_OR_REQUEST_COMMENT_FIELD_NAME} className="flex flex-col gap-2">
            <PublishOrRequestFieldLabel
                label={label}
                helpText={helpText}
                required={state.required}
                htmlFor={textAreaId}
                helpId={helpId}
            />
            <TextArea
                id={textAreaBaseId}
                placeholder={placeholder}
                value={comment}
                onInput={(event) => setPublishOrRequestComment(event.currentTarget.value)}
                rows={2}
                autoSize
                aria-describedby={helpId}
                aria-required={state.required}
            />
        </div>
    );
};

PublishOrRequestCommentField.displayName = PUBLISH_OR_REQUEST_COMMENT_FIELD_NAME;
