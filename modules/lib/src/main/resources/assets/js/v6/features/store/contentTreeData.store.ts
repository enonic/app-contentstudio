import {atom, computed} from 'nanostores';
import {ContentData} from '../views/browse/grid/ContentData';

export const $contentTreeItems = atom<ContentData[]>([]); // to be moved to another store later

export const $flatContentTreeItems = computed($contentTreeItems, (items) => {
    return flattenTree(items);
});

function flattenTree(items: ContentData[]): ContentData[] {
    let flatItems: ContentData[] = [];

    items.forEach(item => {
        flatItems.push(item);
        if (item.children?.length > 0) {
            flatItems = [...flatItems, ...flattenTree(item.children as ContentData[])];
        }
    });

    return flatItems;
}
