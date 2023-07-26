import {ComponentPath} from './ComponentPath';
import {Cloneable} from '@enonic/lib-admin-ui/Cloneable';

export interface PageItem extends Cloneable {
    getPath(): ComponentPath;
    getParent(): PageItem;
    getComponentByPath(path: ComponentPath): PageItem;
}
