import { useEffect, useState } from 'react';

import {
    Archive,
    Database,
    FileChartPie,
    FileCog,
    FileIcon,
    FileMusic,
    FileQuestionMark,
    FileSpreadsheet,
    FileTerminal,
    FileText,
    FileType,
    Film,
    FolderCog,
    FolderOpen,
    Globe,
    ImageIcon,
    type LucideIcon,
    Presentation,
    Shapes,
    SplinePointer,
    SquareArrowOutUpRight,
    SquareCode,
    SquarePlay,
} from 'lucide-react';
import { Image } from '../primitives/Image';
import { createImageUrl } from '../../lib/url/images';
import { cn } from '@enonic/ui';
import { CONTENT_TYPE } from '../../lib/cms/schema/contentTypeName';

type Props = {
    className?: string;
    /** Content type name, e.g. `base:folder` or `com.myapp:person`. */
    contentType: string;
    /** Server icon URL: a content's image/thumbnail or a content type's icon glyph. */
    url?: string | null;
    /** Requested image size in px; fetched at 2x for sharpness. */
    imageSize?: number;
    /** Crop the image to a square instead of fitting it. */
    crop?: boolean;
    /** The content has an uploaded thumbnail, so `url` resolves to a photo. */
    hasThumbnail?: boolean;
    /**
     * Declares that `url` points to the content type's own icon (a monochrome glyph)
     * rather than a content item's image or thumbnail. Known image types then render
     * their built-in vector icon, which stays visible in dark mode.
     */
    typeIcon?: boolean;
};

type BuiltInIconProps = Pick<Props, 'contentType'> & React.ComponentProps<LucideIcon>;

const IMAGE_CONTENT_TYPES = new Set<string>([CONTENT_TYPE.MEDIA_IMAGE, CONTENT_TYPE.MEDIA_VECTOR]);

const BUILT_IN_CONTENT_TYPE_ICON_MAP = new Map<string, LucideIcon>([
    [CONTENT_TYPE.FOLDER, FolderOpen],
    [CONTENT_TYPE.FRAGMENT, FileChartPie],
    [CONTENT_TYPE.MEDIA, SquarePlay],
    [CONTENT_TYPE.MEDIA_ARCHIVE, Archive],
    [CONTENT_TYPE.MEDIA_AUDIO, FileMusic],
    [CONTENT_TYPE.MEDIA_CODE, SquareCode],
    [CONTENT_TYPE.MEDIA_DATA, Database],
    [CONTENT_TYPE.MEDIA_DOCUMENT, FileText],
    [CONTENT_TYPE.MEDIA_EXECUTABLE, FileTerminal],
    [CONTENT_TYPE.MEDIA_IMAGE, ImageIcon],
    [CONTENT_TYPE.MEDIA_PRESENTATION, Presentation],
    [CONTENT_TYPE.MEDIA_SPREADSHEET, FileSpreadsheet],
    [CONTENT_TYPE.MEDIA_TEXT, FileType],
    [CONTENT_TYPE.MEDIA_UNKNOWN, FileQuestionMark],
    [CONTENT_TYPE.MEDIA_VECTOR, SplinePointer],
    [CONTENT_TYPE.MEDIA_VIDEO, Film],
    [CONTENT_TYPE.PAGE_TEMPLATE, FileCog],
    [CONTENT_TYPE.SHORTCUT, SquareArrowOutUpRight],
    [CONTENT_TYPE.SITE, Globe],
    [CONTENT_TYPE.TEMPLATE_FOLDER, FolderCog],
    [CONTENT_TYPE.UNSTRUCTURED, Shapes],
]);

/** Set by the server on SVG type icons painted only with `currentColor`. */
const COLORABLE_PARAM = 'colorable';

function isColorableIconUrl(url: string): boolean {
    const queryIndex = url.indexOf('?');
    return queryIndex >= 0 && new URLSearchParams(url.substring(queryIndex + 1)).get(COLORABLE_PARAM) === 'true';
}

const BuiltInIcon = ({ contentType, ...props }: BuiltInIconProps): React.ReactElement => {
    const Icon = BUILT_IN_CONTENT_TYPE_ICON_MAP.get(contentType) ?? FileIcon;
    return <Icon {...props} />;
};

export const ContentIcon = ({
    className,
    contentType,
    url,
    imageSize = 64,
    crop = false,
    hasThumbnail = false,
    typeIcon = false,
}: Props): React.ReactElement => {
    // 2x size for better quality
    const src = url ? createImageUrl(url, { size: imageSize * 2, crop }) : undefined;

    const [isImageBroken, setImageBroken] = useState(false);

    useEffect(() => {
        setImageBroken(false);
    }, [src]);

    // A photo is a content's own image or uploaded thumbnail.
    const isPhoto = !typeIcon && (IMAGE_CONTENT_TYPES.has(contentType) || hasThumbnail);

    // Custom type glyphs: a colorable SVG is masked with the text colour, like the built-in icons;
    // anything else was authored for a light background and keeps one on dark surfaces.
    const isCustomTypeGlyph = !isPhoto && !BUILT_IN_CONTENT_TYPE_ICON_MAP.has(contentType);

    if (src && !isImageBroken && (isPhoto || isCustomTypeGlyph)) {
        if (isCustomTypeGlyph && isColorableIconUrl(src)) {
            return (
                <span
                    role="img"
                    aria-label={contentType}
                    className={cn(
                        'inline-block size-6 p-px bg-current mask-contain mask-center mask-no-repeat',
                        className,
                    )}
                    style={{ maskImage: `url("${src}")` }}
                />
            );
        }

        return (
            <Image
                className={cn(
                    'size-6 p-px object-contain',
                    !isPhoto && 'rounded-sm group-data-[tone=inverse]:bg-alt dark:bg-alt',
                    className,
                )}
                alt={contentType}
                src={src}
                onError={() => setImageBroken(true)}
            />
        );
    }

    return <BuiltInIcon className={cn('size-6', className)} contentType={contentType} strokeWidth={1.75} />;
};

ContentIcon.displayName = 'ContentIcon';
