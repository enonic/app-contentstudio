import {ContentTypeName} from '@enonic/lib-admin-ui/schema/content/ContentTypeName';
import {useEffect, useState, type JSX} from 'react';

import {
    Archive, Database, FileChartPie, FileCog, FileIcon, FileImage, FileMusic, FileQuestionMark,
    FileSpreadsheet, FileTerminal, FileText, FileType, Film, FolderCog, FolderOpen, Globe,
    ImageIcon, LucideIcon, Presentation,
    Shapes,
    SplinePointer, SquareArrowOutUpRight, SquareCode, SquarePlay,
} from 'lucide-react';
import {Image} from '../images/Image';
import {createImageUrl} from '../util/url';
import {cn} from '@enonic/ui';

type Props = {
    className?: string;
    contentType: string;
    url?: string | null;
    size?: number;
    crop?: boolean;
};

type BuiltInIconProps = Pick<Props, 'className' | 'contentType' | 'size'>;

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

const BuiltInIcon = ({className, contentType, size}: BuiltInIconProps): JSX.Element => {
    const Icon = CONTENT_TYPE_ICON_MAP.get(contentType) ?? FileIcon;
    return <Icon size={size} strokeWidth={2} className={className} />;
};

export const ContentIcon = ({
    className,
    contentType,
    url,
    size = 64,
    crop,
}: Props): JSX.Element => {
    const src = url ? createImageUrl(url, {size: size * 2, crop}) : undefined;

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

    return <BuiltInIcon contentType={contentType} size={size}/>;
};
