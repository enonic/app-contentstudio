import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';
import {type Equitable} from '@enonic/lib-admin-ui/Equitable';
import {type ComponentPath} from './ComponentPath';

export class RegionPath
    implements Equitable {

    private static DIVIDER: string = '/';

    private parentComponentPath: ComponentPath;

    private regionName: string;

    private refString: string;

    constructor(parentComponentPath: ComponentPath, regionName: string) {

        this.parentComponentPath = parentComponentPath;
        this.regionName = regionName;
        if (parentComponentPath != null) {
            this.refString = parentComponentPath + '/' + regionName;
        } else {
            this.refString = regionName;
        }
    }

    public hasParentComponentPath(): boolean {

        return this.parentComponentPath != null;
    }

    public getParentComponentPath(): ComponentPath {
        return this.parentComponentPath;
    }

    public getRegionName(): string {
        return this.regionName;
    }

    public toString(): string {
        return this.refString;
    }

    equals(o: Equitable): boolean {

        if (!ObjectHelper.iFrameSafeInstanceOf(o, RegionPath)) {
            return false;
        }

        const other = o as RegionPath;

        if (!ObjectHelper.stringEquals(this.refString, other.refString)) {
            return false;
        }

        return true;
    }
}
