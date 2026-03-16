import {PropertyPath, PropertyPathElement} from '@enonic/lib-admin-ui/data/PropertyPath';
import {type Input} from '@enonic/lib-admin-ui/form/Input';
import {type FormSet} from '@enonic/lib-admin-ui/form/set/FormSet';

function getIndexedPath(name: string, parentPath?: PropertyPath, index: number = 0): PropertyPath {
    const pathElement = new PropertyPathElement(name, index);
    return parentPath ? PropertyPath.fromParent(parentPath, pathElement) : PropertyPath.fromPathElement(pathElement);
}

export function getInputPath(input: Input, parentPath?: PropertyPath, index: number = 0): PropertyPath {
    return getIndexedPath(input.getName(), parentPath, index);
}

export function getFormSetPath(formSet: FormSet, parentPath?: PropertyPath, index: number = 0): PropertyPath {
    return getIndexedPath(formSet.getName(), parentPath, index);
}

export function toPathKey(path: PropertyPath): string {
    const pathString = path.toString();
    return pathString.startsWith('.') ? pathString.slice(1) : pathString;
}
