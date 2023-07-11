import {StringHelper} from '@enonic/lib-admin-ui/util/StringHelper';
import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';
import {Equitable} from '@enonic/lib-admin-ui/Equitable';

export class ComponentPath
    implements Equitable {

    private static DIVIDER: string = '/';

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

    public toString(): string {
        if (this.isRoot()) {
            return this.path.toString();
        }

        if (this.parentPath?.isRoot()) {
            return `${this.parentPath.toString()}${this.path}`;
        }

        return `${this.parentPath.toString()}${ComponentPath.DIVIDER}${this.path}`;
    }

    equals(o: Equitable): boolean {
        if (!ObjectHelper.iFrameSafeInstanceOf(o, ComponentPath)) {
            return false;
        }

        const other = <ComponentPath>o;

        return ObjectHelper.stringEquals(this.toString(), other.toString());
    }

    isRoot(): boolean {
        return !this.parentPath && this.path === ComponentPath.DIVIDER;
    }

    public static root(): ComponentPath {
        return new ComponentPath(ComponentPath.DIVIDER);
    }
}

export class ComponentPathRegionAndComponent {

    private static DIVIDER: string = '/';

    private regionName: string;

    private componentIndex: number;

    private refString: string;

    constructor(regionName: string, componentIndex: number) {
        this.regionName = regionName;
        this.componentIndex = componentIndex;
        this.refString = regionName + ComponentPathRegionAndComponent.DIVIDER + this.componentIndex;
    }

    getRegionName(): string {
        return this.regionName;
    }

    getComponentIndex(): number {
        return this.componentIndex;
    }

    toString(): string {
        return this.refString;
    }
}
