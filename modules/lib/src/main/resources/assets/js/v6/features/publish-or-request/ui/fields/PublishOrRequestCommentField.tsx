// Comment field of the publish or request dialog's second step: the publish message,
// or the description of the publish request.

import { TextArea } from '@enonic/ui';
import { useStore } from '@nanostores/preact';
import { type ReactElement } from 'react';
import { useI18n } from '../../../../shared/lib/hooks/useI18n';
import { setPublishOrRequestComment } from '../../model/commands/fields';
import { $publishOrRequestFields } from '../../model/publishOrRequestFields.store';

const PUBLISH_OR_REQUEST_COMMENT_FIELD_NAME = 'PublishOrRequestCommentField';

export const PublishOrRequestCommentField = (): ReactElement => {
    const { comment } = useStore($publishOrRequestFields, { keys: ['comment'] });

    const label = useI18n('field.comment.label');
    const helpText = useI18n('dialog.publishOrRequest.comment.help');
    const placeholder = useI18n('field.comment.aria.label');

    return (
        <div data-component={PUBLISH_OR_REQUEST_COMMENT_FIELD_NAME}>
            <TextArea
                label={label}
                description={helpText}
                placeholder={placeholder}
                value={comment}
                onInput={(event) => setPublishOrRequestComment(event.currentTarget.value)}
                rows={2}
                autoSize
            />
        </div>
    );
};

PublishOrRequestCommentField.displayName = PUBLISH_OR_REQUEST_COMMENT_FIELD_NAME;
