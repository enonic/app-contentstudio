import {type ComponentPath} from './ComponentPath';
import {type Cloneable} from '@enonic/lib-admin-ui/Cloneable';
import {type PageItemType} from './PageItemType';

export interface PageItem extends Cloneable {
    getPath(): ComponentPath;
    getParent(): PageItem;
    getComponentByPath(path: ComponentPath): PageItem;
    getType(): PageItemType;
}
