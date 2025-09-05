import {useState, useEffect, type JSX} from 'react';
import {ContentTypeName} from '@enonic/lib-admin-ui/schema/content/ContentTypeName';
import {ContentSummary} from '../../content/ContentSummary';
import {ContentIconUrlResolver} from '../../content/ContentIconUrlResolver';
import {UriHelper} from '@enonic/lib-admin-ui/util/UriHelper';

import {
    Archive, Database, FileChartPie, FileCog, FileIcon, FileImage, FileMusic, FileQuestionMark,
    FileSpreadsheet, FileTerminal, FileText, FileType, Film, FolderCog, FolderOpen, Globe,
    ImageIcon, Presentation, SplinePointer, SquareArrowOutUpRight, SquareCode, SquarePlay, Shapes,
} from 'lucide-react';
import {Image} from '../images/Image';

type Props = {
    contentType: ContentTypeName;
    summary?: ContentSummary | null;
    size?: number;
    crop?: boolean;
    imgClassName?: string;
};

const buildIconUrl = (summary: ContentSummary, size = 64, crop?: boolean): string => {
    const url = new ContentIconUrlResolver().setContent(summary).resolve();
    const params: Record<string, string | number | boolean> = {size};
    if (crop) {
        params.crop = true;
    }
    return `${UriHelper.trimUrlParams(url)}?${UriHelper.encodeUrlParams(params)}`;
};

const ICONS: Record<string, JSX.Element> = {
    [String(ContentTypeName.FOLDER)]: <FolderOpen/>,
    [String(ContentTypeName.FRAGMENT)]: <FileChartPie/>,
    [String(ContentTypeName.MEDIA)]: <SquarePlay/>,
    [String(ContentTypeName.MEDIA_ARCHIVE)]: <Archive/>,
    [String(ContentTypeName.MEDIA_AUDIO)]: <FileMusic/>,
    [String(ContentTypeName.MEDIA_CODE)]: <SquareCode/>,
    [String(ContentTypeName.MEDIA_DATA)]: <Database/>,
    [String(ContentTypeName.MEDIA_DOCUMENT)]: <FileText/>,
    [String(ContentTypeName.MEDIA_EXECUTABLE)]: <FileTerminal/>,
    [String(ContentTypeName.MEDIA_IMAGE)]: <ImageIcon/>,
    [String(ContentTypeName.MEDIA_PRESENTATION)]: <Presentation/>,
    [String(ContentTypeName.MEDIA_SPREADSHEET)]: <FileSpreadsheet/>,
    [String(ContentTypeName.MEDIA_TEXT)]: <FileType/>,
    [String(ContentTypeName.MEDIA_UNKNOWN)]: <FileQuestionMark/>,
    [String(ContentTypeName.MEDIA_VECTOR)]: <SplinePointer/>,
    [String(ContentTypeName.MEDIA_VIDEO)]: <Film/>,
    [String(ContentTypeName.PAGE_TEMPLATE)]: <FileCog/>,
    [String(ContentTypeName.SHORTCUT)]: <SquareArrowOutUpRight/>,
    [String(ContentTypeName.SITE)]: <Globe/>,
    [String(ContentTypeName.TEMPLATE_FOLDER)]: <FolderCog/>,
    [String(ContentTypeName.UNSTRUCTURED)]: <Shapes/>,
    [String(ContentTypeName.IMAGE)]: <FileImage/>,
};

const IMAGE_TYPES = new Set<string>([
    String(ContentTypeName.IMAGE),
    String(ContentTypeName.MEDIA_IMAGE),
    String(ContentTypeName.MEDIA_VECTOR),
]);

export const ContentIcon = ({
                                contentType,
                                summary,
                                size = 64,
                                crop,
                                imgClassName,
                            }: Props): JSX.Element => {
    const [broken, setBroken] = useState(false);
    const key = String(contentType);
    const icon = ICONS[key];
    const src = summary ? buildIconUrl(summary, size, crop) : undefined;

    useEffect(() => {
        setBroken(false);
    }, [src]);

    const tryImage = (className?: string) =>
        src && !broken ? (
            <Image className={className} alt="" src={src} onError={() => setBroken(true)}/>
        ) : null;

    const isImageType = IMAGE_TYPES.has(key);

    if (isImageType) {
        return tryImage(imgClassName) ?? icon ?? <FileIcon/>;
    }

    if (icon) {
        return icon;
    }

    return tryImage() ?? <FileIcon/>;
};
