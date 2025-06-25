import {ContentTypeName} from '@enonic/lib-admin-ui/schema/content/ContentTypeName';
import {useEffect, useState} from 'react';

import {
    Archive, Database, FileChartPie, FileCog, FileIcon, FileImage, FileMusic, FileQuestionMark,
    FileSpreadsheet, FileTerminal, FileText, FileType, Film, FolderCog, FolderOpen, Globe,
    ImageIcon, LucideIcon, Presentation,
    Shapes,
    SplinePointer, SquareArrowOutUpRight, SquareCode, SquarePlay,
} from 'lucide-react';
import {Image} from '../primitives/Image';
import {createImageUrl} from '../../utils/url/images';
import {cn} from '@enonic/ui';

type Props = {
    className?: string;
    contentType: string;
    url?: string | null;
    imageSize?: number;
    crop?: boolean;
};

type BuiltInIconProps = Pick<Props, 'contentType'> & React.ComponentProps<LucideIcon>;

const IMAGE_TYPES = new Set<string>([
    String(ContentTypeName.IMAGE),
    String(ContentTypeName.MEDIA_IMAGE),
    String(ContentTypeName.MEDIA_VECTOR),
]);

const CONTENT_TYPE_ICON_MAP = new Map<string, LucideIcon>([
    [String(ContentTypeName.FOLDER), FolderOpen],
    [String(ContentTypeName.FRAGMENT), FileChartPie],
    [String(ContentTypeName.IMAGE), FileImage],
    [String(ContentTypeName.MEDIA), SquarePlay],
    [String(ContentTypeName.MEDIA_ARCHIVE), Archive],
    [String(ContentTypeName.MEDIA_AUDIO), FileMusic],
    [String(ContentTypeName.MEDIA_CODE), SquareCode],
    [String(ContentTypeName.MEDIA_DATA), Database],
    [String(ContentTypeName.MEDIA_DOCUMENT), FileText],
    [String(ContentTypeName.MEDIA_EXECUTABLE), FileTerminal],
    [String(ContentTypeName.MEDIA_IMAGE), ImageIcon],
    [String(ContentTypeName.MEDIA_PRESENTATION), Presentation],
    [String(ContentTypeName.MEDIA_SPREADSHEET), FileSpreadsheet],
    [String(ContentTypeName.MEDIA_TEXT), FileType],
    [String(ContentTypeName.MEDIA_UNKNOWN), FileQuestionMark],
    [String(ContentTypeName.MEDIA_VECTOR), SplinePointer],
    [String(ContentTypeName.MEDIA_VIDEO), Film],
    [String(ContentTypeName.PAGE_TEMPLATE), FileCog],
    [String(ContentTypeName.SHORTCUT), SquareArrowOutUpRight],
    [String(ContentTypeName.SITE), Globe],
    [String(ContentTypeName.TEMPLATE_FOLDER), FolderCog],
    [String(ContentTypeName.UNSTRUCTURED), Shapes],
]);

const BuiltInIcon = ({contentType, ...props}: BuiltInIconProps): React.ReactElement => {
    const Icon = CONTENT_TYPE_ICON_MAP.get(contentType) ?? FileIcon;
    return <Icon {...props} />;
};

export const ContentIcon = ({
    className,
    contentType,
    url,
    imageSize = 64,
    crop,
}: Props): React.ReactElement => {
    const src = url ? createImageUrl(url, {size: imageSize * 2, crop}) : undefined;

    const [isImageBroken, setImageBroken] = useState(false);

    useEffect(() => {
        setImageBroken(false);
    }, [src]);

    const isImageType = IMAGE_TYPES.has(contentType);
    const isUnknownType = !CONTENT_TYPE_ICON_MAP.has(contentType);

    const canShowImage = (isImageType || isUnknownType) && !isImageBroken;

    if (canShowImage && src) {
        // 2x size for better quality
        return <Image
            className={cn('w-6 h-6', isImageType ? 'object-cover' : 'object-contain', className)}
            alt={contentType}
            src={src}
            onError={() => setImageBroken(true)}
        />;
    }

    return <BuiltInIcon className={cn('w-6 h-6', className)} contentType={contentType} />;
};
