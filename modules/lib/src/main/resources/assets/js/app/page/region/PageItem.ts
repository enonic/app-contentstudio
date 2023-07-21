import {ComponentPath} from './ComponentPath';

export interface PageItem {
    getPath(): ComponentPath;
    getParent(): PageItem;
    getComponentByPath(path: ComponentPath): PageItem;
}
