import {computed} from 'nanostores';
import {$contentTreeItems} from './contentTreeData.store';
import {$contentTreeUpload} from './contentTreeUpload.store';
import {ContentUploadData} from '../views/browse/grid/ContentUploadData';
import {ContentData} from '../views/browse/grid/ContentData';

export const $contentTreeMergedItems = computed([$contentTreeItems, $contentTreeUpload], (items, uploads) => {
    const contentEntries = Object.values(items.nodes);
    const uploadEntries = Object.values(uploads);

    if (uploadEntries.length === 0 || contentEntries.length === 0) return items;

    const nodes: Record<string, ContentData | ContentUploadData> = {...items.nodes};
    const children = {...items.children};

    uploadEntries.forEach((upload) => {
        nodes[upload.id] = upload;

        const parentChildren = children[upload?.parentId || '__root__'];

        if (!parentChildren || parentChildren.includes(upload.id)) return;

        children[upload?.parentId || '__root__'] = [upload.id, ...parentChildren];
    });

    return {nodes, children, hasMore: items.hasMore};
});
