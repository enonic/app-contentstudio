import {ContentTypeName} from '@enonic/lib-admin-ui/schema/content/ContentTypeName'
import {
    FolderOpen,
    ImageIcon,
    FileIcon,
    FileImage,
    FolderCog,
    FileText,
    Shapes,
    Globe,
    FileChartPie,
    SquarePlay,
    FileCog,
    SquareArrowOutUpRight,
    Film,
    SplinePointer,
    FileQuestionMark,
    FileType,
    FileSpreadsheet,
    Presentation,
    FileTerminal,
    Database,
    SquareCode,
    FileMusic,
    Archive
} from 'lucide-react';
import {useState, type JSX} from 'react';

const ImgWithFallback = ({
                             src,
                             alt = '',
                             fallback = <FileIcon/>,
                             imgClassName,
                         }: {
    src?: string | null;
    alt?: string;
    fallback?: JSX.Element;
    imgClassName?: string;
}): JSX.Element => {
    const [errored, setErrored] = useState(false);
    if (!src || errored) {
        return fallback;
    }
    return <img className={imgClassName} alt={alt} src={src} onError={() => setErrored(true)}/>;
};

interface Props {
    contentType: ContentTypeName;
    imageUrl?: string | null;
}

const fallbackIconFor = (contentType: ContentTypeName): JSX.Element => {
    const key = String(contentType);
    switch (key) {
    case String(ContentTypeName.IMAGE):
        return <FileImage/>;
    case String(ContentTypeName.MEDIA_IMAGE):
        return <ImageIcon/>;
    case String(ContentTypeName.MEDIA_VECTOR):
        return <SplinePointer/>;
    default:
        return <FileIcon/>;
    }
};

export const ContentIcon = ({contentType, imageUrl}: Props): JSX.Element => {
    switch (String(contentType)) {
    case String(ContentTypeName.FOLDER):
        return <FolderOpen/>;

    case String(ContentTypeName.FRAGMENT):
        return <FileChartPie/>;

    case String(ContentTypeName.IMAGE):
        return (
            <ImgWithFallback
                src={imageUrl}
                imgClassName="coverContentIcon"
                fallback={fallbackIconFor(contentType)}
            />
        );

    case String(ContentTypeName.MEDIA):
        return <SquarePlay/>;

    case String(ContentTypeName.MEDIA_ARCHIVE):
        return <Archive/>;

    case String(ContentTypeName.MEDIA_AUDIO):
        return <FileMusic/>;

    case String(ContentTypeName.MEDIA_CODE):
        return <SquareCode/>;

    case String(ContentTypeName.MEDIA_DATA):
        return <Database/>;

    case String(ContentTypeName.MEDIA_DOCUMENT):
        return <FileText/>;

    case String(ContentTypeName.MEDIA_EXECUTABLE):
        return <FileTerminal/>;

    case String(ContentTypeName.MEDIA_IMAGE):
        return (
            <ImgWithFallback
                src={imageUrl}
                fallback={fallbackIconFor(contentType)}
            />
        );

    case String(ContentTypeName.MEDIA_PRESENTATION):
        return <Presentation/>;

    case String(ContentTypeName.MEDIA_SPREADSHEET):
        return <FileSpreadsheet/>;

    case String(ContentTypeName.MEDIA_TEXT):
        return <FileType/>;

    case String(ContentTypeName.MEDIA_UNKNOWN):
        return <FileQuestionMark/>;

    case String(ContentTypeName.MEDIA_VECTOR):
        return (
            <ImgWithFallback
                src={imageUrl}
                imgClassName="coverContentIcon"
                fallback={fallbackIconFor(contentType)}
            />
        );

    case String(ContentTypeName.MEDIA_VIDEO):
        return <Film/>;

    case String(ContentTypeName.PAGE_TEMPLATE):
        return <FileCog/>;

    case String(ContentTypeName.SHORTCUT):
        return <SquareArrowOutUpRight/>;

    case String(ContentTypeName.SITE):
        return <Globe/>;

    case String(ContentTypeName.TEMPLATE_FOLDER):
        return <FolderCog/>;

    case String(ContentTypeName.UNSTRUCTURED):
        return <Shapes/>;

    default:
        return (
            <ImgWithFallback
                src={imageUrl}
                fallback={fallbackIconFor(contentType)}
            />
        );
    }
};
