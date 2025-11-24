import {LegacyElement} from '@enonic/lib-admin-ui/ui2/LegacyElement';
import React, {ReactElement, useEffect, useState} from 'react';
import {ContentSummaryAndCompareStatus} from '../../../../../../app/content/ContentSummaryAndCompareStatus';
import {WidgetItemViewInterface} from '../../../../../../app/view/context/WidgetItemView';
import {Title} from './utils';
import {GetContentAttachmentsRequest} from '../../../../../../app/resource/GetContentAttachmentsRequest';
import {Attachments} from '../../../../../../app/attachment/Attachments';
import {ContentPath} from '../../../../../../app/content/ContentPath';
import {Attachment} from '../../../../../../app/attachment/Attachment';
import {ContentId} from '../../../../../../app/content/ContentId';
import {AttachmentName} from '../../../../../../app/attachment/AttachmentName';
import Q from 'q';
import {Paperclip} from 'lucide-react';
import {IconButton, Link} from '@enonic/ui';
import {useI18n} from '../../../../hooks/useI18n';

type Props = {
    content?: ContentSummaryAndCompareStatus;
    contentRootPath?: string;
};

async function loadAttachments(contentId: ContentId, contentRootPath: string): Promise<Attachments | undefined> {
    try {
        const request = new GetContentAttachmentsRequest(contentId).setContentRootPath(contentRootPath);

        const attachments = await request.sendAndParse();

        return attachments;
    } catch (error) {
        console.error(error);

        return undefined;
    }
}

function getAttachmentUrl(contentId: ContentId, attachmentName: AttachmentName, contentRootPath: string) {
    return Attachment.getUrl(contentId.toString(), attachmentName.toString(), contentRootPath);
}

const DetailsWidgetAttachmentsSection = ({
    content,
    contentRootPath = ContentPath.CONTENT_ROOT,
}: Props): ReactElement => {
    const [attachments, setAttachments] = useState<Attachments>();

    useEffect(() => {
        if (!content) return;

        loadAttachments(content.getContentId(), contentRootPath).then(setAttachments);
    }, [content]);

    if (!content || !attachments || attachments.getSize() === 0) return undefined;

    return (
        <div>
            <Title text={useI18n('field.contextPanel.details.sections.attachments')} />
            <ul className="list-none my-5">
                {attachments.map((attachment) => (
                    <li key={attachment.getName().toString()} className="w-full">
                        <Link
                            href={getAttachmentUrl(content.getContentId(), attachment.getName(), contentRootPath)}
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

export class DetailsWidgetAttachmentsSectionElement
    extends LegacyElement<typeof DetailsWidgetAttachmentsSection>
    implements WidgetItemViewInterface
{
    constructor(props: Props) {
        super(props, DetailsWidgetAttachmentsSection);
    }

    // Backwards compatibility

    public static debug: boolean = false;

    public layout(): Q.Promise<void> {
        return Q();
    }

    public setContentRootPath(value: string) {
        console.log('setContentRootPath', value);

        this.props.setKey('contentRootPath', value);
    }

    public setContentAndUpdateView(item: ContentSummaryAndCompareStatus): Q.Promise<null | void> {
        if (!item) return;

        this.props.setKey('content', item);

        return Q();
    }

    public fetchWidgetContents(url: string, contentId: string): Q.Promise<void> {
        return Q();
    }

    public hide(): void {
        return;
    }

    public show(): void {
        return;
    }
}
