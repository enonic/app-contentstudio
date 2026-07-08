import { Tooltip } from '@enonic/ui';
import { showError } from '@enonic/lib-admin-ui/notify/MessageBus';
import { i18n } from '@enonic/lib-admin-ui/util/Messages';
import { type ChangeEvent, type ReactElement, useRef, useState } from 'react';
import type { ContentSummary } from '../../../../../app/content/ContentSummary';
import { setContent } from '../../../../entities/content';
import { useI18n } from '../../../../shared/lib/hooks/useI18n';
import { ContentIcon } from '../../../../shared/ui/icons/ContentIcon';
import { setWizardContent } from '../../model/contextContent.store';
import { updateContentIcon } from '../../../../entities/content/api/updateContentIcon.api';

const DETAILS_WIDGET_CONTENT_ICON_NAME = 'DetailsWidgetContentIcon';

const ACCEPTED_ICON_TYPES = 'image/jpeg,image/png,image/gif,image/svg+xml';

type Props = {
    content: ContentSummary;
};

export const DetailsWidgetContentIcon = ({ content }: Props): ReactElement => {
    const uploadLabel = useI18n('field.contextPanel.details.sections.content.uploadIcon');

    const inputRef = useRef<HTMLInputElement>(null);
    const [progress, setProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);

    const iconElement = (
        <ContentIcon contentType={String(content.getType())} url={content.getIconUrl()} hasThumbnail={content.hasThumbnail()} />
    );

    const handleClick = (): void => {
        inputRef.current?.click();
    };

    const handleChange = async (event: ChangeEvent<HTMLInputElement>): Promise<void> => {
        const file = event.currentTarget.files?.[0];
        event.currentTarget.value = '';

        if (!file) return;

        setIsUploading(true);
        await updateContentIcon({ contentId: content.getId(), file, onProgress: (_, p) => setProgress(p) }).match(
            ({ content: updated }) => {
                setContent(updated);
                setWizardContent(updated);
            },
            (error) => {
                showError(i18n('notify.upload.error', file.name, error.message));
            }
        );
        setProgress(0);
        setIsUploading(false);
    };

    // Image content renders its own image as the icon, so uploading a separate icon is not applicable.
    if (content.isImage()) {
        return iconElement;
    }

    return (
        <Tooltip delay={300} value={isUploading ? undefined : uploadLabel}>
            <button
                data-component={DETAILS_WIDGET_CONTENT_ICON_NAME}
                type="button"
                onClick={handleClick}
                disabled={isUploading}
                aria-label={uploadLabel}
                className="relative inline-flex cursor-pointer overflow-hidden rounded transition-opacity hover:opacity-70 disabled:cursor-default disabled:opacity-50"
            >
                {progress > 0 && (
                    <div
                        className="animate-pulse absolute top-0 left-0 h-full bg-success-rev opacity-30"
                        style={{ width: `${progress}%` }}
                    />
                )}
                {iconElement}
                <input ref={inputRef} type="file" accept={ACCEPTED_ICON_TYPES} className="hidden" onChange={handleChange} />
            </button>
        </Tooltip>
    );
};

DetailsWidgetContentIcon.displayName = DETAILS_WIDGET_CONTENT_ICON_NAME;
