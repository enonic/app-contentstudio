import {type PropertyPath} from '@enonic/lib-admin-ui/data/PropertyPath';
import {type PropertyTree} from '@enonic/lib-admin-ui/data/PropertyTree';

export function getOccurrenceCount(path: PropertyPath, tree: PropertyTree | null): number {
    if (!tree || path.elementCount() === 0) {
        return 0;
    }

    const parentPath = path.getParentPath();
    const parentSet = !parentPath || parentPath.elementCount() === 0
        ? tree.getRoot()
        : tree.getPropertySet(parentPath);

    if (!parentSet) {
        return 0;
    }

    const propertyArray = parentSet.getPropertyArray(path.getLastElement().getName());
    return propertyArray?.getSize() ?? 0;
}
