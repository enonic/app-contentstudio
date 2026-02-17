import {StringHelper} from '@enonic/lib-admin-ui/util/StringHelper';
import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';
import {type Equitable} from '@enonic/lib-admin-ui/Equitable';

export class ComponentPath
    implements Equitable {

    static DIVIDER: string = '/';

    private readonly parentPath?: ComponentPath;

    private readonly path: string | number;

    constructor(path: string | number, parentPath?: ComponentPath) {
        this.path = path;
        this.parentPath = parentPath;
    }

    getPath(): string | number {
        return this.path;
    }

    getParentPath(): ComponentPath | undefined {
        return this.parentPath;
    }

    toString(): string {
        if (this.isRoot()) {
            return this.path.toString();
        }

        if (this.parentPath?.isRoot()) {
            return `${this.parentPath.toString()}${this.path}`;
        }

        return `${this.parentPath.toString()}${ComponentPath.DIVIDER}${this.path}`;
    }

    equals(o: Equitable): boolean {
        if (!(o instanceof ComponentPath)) {
            return false;
        }

        return ObjectHelper.stringEquals(this.toString(), o.toString());
    }

    isRoot(): boolean {
        return !this.parentPath && this.path === ComponentPath.DIVIDER;
    }

    static root(): ComponentPath {
        return new ComponentPath(ComponentPath.DIVIDER);
    }

    static fromString(path: string): ComponentPath {
        if (StringHelper.isBlank(path) || path === ComponentPath.DIVIDER) {
            return ComponentPath.root();
        }

        const pathParts = path.split(ComponentPath.DIVIDER);

        let parentPath: ComponentPath | undefined = undefined;
        let pathPart: string | number = pathParts[0] || ComponentPath.DIVIDER;

        for (let i = 1; i < pathParts.length; i++) {
            parentPath = new ComponentPath(pathPart, parentPath);
            pathPart = pathParts[i];
        }

        return new ComponentPath(pathPart, parentPath);
    }
}
