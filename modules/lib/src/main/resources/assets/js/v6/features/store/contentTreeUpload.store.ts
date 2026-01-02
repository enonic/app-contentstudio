import {map} from 'nanostores';
import {ContentUploadData} from '../views/browse/grid/ContentUploadData';

type ContentTreeUploadStore = Record<string, ContentUploadData>;

export const $contentTreeUpload = map<ContentTreeUploadStore>({});

export function addContentTreeUploadItem(id: string, name: string, parentId?: string): void {
    $contentTreeUpload.setKey(id, {id, name, progress: 0, parentId, hasChildren: false});
}

export function updateContentTreeUploadItemProgress(id: string, progress: number): void {
    const upload = $contentTreeUpload.get()[id];

    if (!upload) return;

    $contentTreeUpload.setKey(id, {...upload, progress});
}

export function removeContentTreeUploadItem(id: string): void {
    const {[id]: _, ...remaining} = $contentTreeUpload.get();

    $contentTreeUpload.set(remaining);
}
