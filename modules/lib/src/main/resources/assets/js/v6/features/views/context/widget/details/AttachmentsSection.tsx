import {ReactElement} from 'react';
import {Title} from './utils';
import {ContentPath} from '../../../../../../app/content/ContentPath';
import {Attachment} from '../../../../../../app/attachment/Attachment';
import {ContentId} from '../../../../../../app/content/ContentId';
import {AttachmentName} from '../../../../../../app/attachment/AttachmentName';
import {Paperclip} from 'lucide-react';
import {Link} from '@enonic/ui';
import {useI18n} from '../../../../hooks/useI18n';
import {useStore} from '@nanostores/preact';
import {$contextContent} from '../../../../store/context/contextContent.store';
import {$detailsWidgetAttachments} from '../../../../store/context/detailsWidgets.store';

export const DetailsWidgetAttachmentsSection = (): ReactElement => {
    const content = useStore($contextContent);
    const attachments = useStore($detailsWidgetAttachments);

    if (!content || !attachments || attachments.getSize() === 0) return undefined;

    return (
        <div>
            <Title text={useI18n('field.contextPanel.details.sections.attachments')} />
            <ul className="list-none my-5">
                {attachments.map((attachment) => (
                    <li key={attachment.getName().toString()} className="w-full">
                        <Link
                            href={getAttachmentUrl(content.getContentId(), attachment.getName())}
                            target="_blank"
                            className="flex items-center gap-2 shrink-1"
                        >
                            <Paperclip size="14" className="shrink-0" />
                            <span className="text-xs truncate">{attachment.getName().toString()}</span>
                        </Link>
                    </li>
                ))}
            </ul>
        </div>
    );
};

DetailsWidgetAttachmentsSection.displayName = 'DetailsWidgetAttachmentsSection';

function getAttachmentUrl(contentId: ContentId, attachmentName: AttachmentName) {
    return Attachment.getUrl(contentId.toString(), attachmentName.toString(), ContentPath.CONTENT_ROOT);
}
