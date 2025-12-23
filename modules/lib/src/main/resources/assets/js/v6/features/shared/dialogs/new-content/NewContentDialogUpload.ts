import {ContentSummaryAndCompareStatus} from 'src/main/resources/assets/js/app/content/ContentSummaryAndCompareStatus';
import {
    uploadDataUrlImage,
    UploadMediaError,
    uploadMediaFile,
    UploadMediaSuccess,
    uploadRemoteImage,
} from '../../../api/uploadMedia';
import {
    addContentTreeUploadItem,
    removeContentTreeUploadItem,
    updateContentTreeUploadItemProgress,
} from '../../../store/contentTreeUpload.store';
import {generateUniqueName} from '../../../utils/image/generateUniqueName';
import {reload} from '../../../store/contentTreeLoadingStore';
import {NotifyManager} from '@enonic/lib-admin-ui/notify/NotifyManager';

type UploadOptions = {
    dataTransfer: DataTransfer;
    parentContent?: ContentSummaryAndCompareStatus;
};

export function uploadMediaFiles({dataTransfer, parentContent}: UploadOptions) {
    if (dataTransfer.files.length === 0) return;

    const files = Array.from(dataTransfer.files);

    const tasks = files.map((file) => {
        const id = file.name;
        const name = file.name;
        const parentId = parentContent?.getContentId()?.toString();

        addContentTreeUploadItem(id, name, parentId);

        return uploadMediaFile({
            id,
            file,
            parentContent,
            onProgress: (id, progress) => updateContentTreeUploadItemProgress(id, progress),
        });
    });

    tasks.forEach((task) => {
        task.match(handlers.onEachSuccess, handlers.onEachError);
    });
}

export function uploadDragImages({dataTransfer, parentContent}: UploadOptions) {
    const htmlData = dataTransfer.getData('text/html');
    const imgSources = extractImageSources(htmlData);

    if (imgSources.length === 0) return;

    const tasks = imgSources.map((src) => {
        if (!src.startsWith('data:')) return uploadRemoteImage({imageSource: src, parentContent});

        const id = src;
        const name = generateUniqueName(src);
        const parentId = parentContent?.getContentId()?.toString();

        addContentTreeUploadItem(id, name, parentId);

        return uploadDataUrlImage({
            id,
            name,
            imageSource: src,
            parentContent,
            onProgress: (id, progress) => updateContentTreeUploadItemProgress(id, progress),
        });
    });

    tasks.forEach((task) => {
        task.match(handlers.onEachSuccess, handlers.onEachError);
    });
}

//
// * Internal
//
const handlers = {
    onEachSuccess: (success: UploadMediaSuccess) => {
        removeContentTreeUploadItem(success.mediaIdentifier);

        reload();

        NotifyManager.get().showSuccess(`${success.mediaIdentifier} uploaded successfully!`);
    },
    onEachError: (error: UploadMediaError) => {
        console.error(error);

        removeContentTreeUploadItem(error.mediaIdentifier);

        NotifyManager.get().showError(`${error.mediaIdentifier} failed to upload: ${error.message}`);
    },
};

function extractImageSources(htmlData: string): string[] {
    if (!htmlData || !/<img.*\ssrc="/i.test(htmlData)) {
        return [];
    }

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlData;
    const images = tempDiv.getElementsByTagName('img');

    return Array.from(images)
        .map((img) => img.getAttribute('src'))
        .filter((src): src is string => src != null);
}
