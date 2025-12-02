import {Link, Separator} from '@enonic/ui';
import {useStore} from '@nanostores/preact';
import {Paperclip} from 'lucide-react';
import {ReactElement} from 'react';
import {Attachment} from '../../../../../../app/attachment/Attachment';
import {AttachmentName} from '../../../../../../app/attachment/AttachmentName';
import {ContentId} from '../../../../../../app/content/ContentId';
import {ContentPath} from '../../../../../../app/content/ContentPath';
import {useI18n} from '../../../../hooks/useI18n';
import {$contextContent} from '../../../../store/context/contextContent.store';
import {$detailsWidgetAttachments} from '../../../../store/context/detailsWidgets.store';

export function DetailsWidgetAttachmentsSection(): ReactElement {
    const content = useStore($contextContent);
    const attachments = useStore($detailsWidgetAttachments);
    const titleText = useI18n('field.contextPanel.details.sections.attachments');

    if (!content || !attachments || attachments.getSize() === 0) return null;

    return (
        <section className='flex flex-col gap-5'>
            <Separator label={titleText} />
            <ul className="list-none">
                {attachments.map((attachment) => (
                    <li key={attachment.getName().toString()} className="w-full">
                        <Link
                            className="flex items-center gap-2 shrink-1"
                            leftIcon={Paperclip}
                            href={getAttachmentUrl(content.getContentId(), attachment.getName())}
                            target="_blank"
                        >
                            <span className="text-xs truncate">{attachment.getName().toString()}</span>
                        </Link>
                    </li>
                ))}
            </ul>
        </section>
    );
}

function getAttachmentUrl(contentId: ContentId, attachmentName: AttachmentName) {
    return Attachment.getUrl(contentId.toString(), attachmentName.toString(), ContentPath.CONTENT_ROOT);
}
