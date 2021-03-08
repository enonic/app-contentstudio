import {StringHelper} from 'lib-admin-ui/util/StringHelper';
import {ObjectHelper} from 'lib-admin-ui/ObjectHelper';
import {Equitable} from 'lib-admin-ui/Equitable';

export class ComponentPath
    implements Equitable {

    private static DIVIDER: string = '/';

    private regionAndComponentList: ComponentPathRegionAndComponent[];

    private refString: string;

    constructor(regionAndComponentList: ComponentPathRegionAndComponent[]) {

        this.regionAndComponentList = regionAndComponentList;

        this.refString = '';
        this.regionAndComponentList.forEach((regionAndComponent: ComponentPathRegionAndComponent, index: number) => {
            this.refString += regionAndComponent.toString();
            if (index < this.regionAndComponentList.length - 1) {
                this.refString += ComponentPath.DIVIDER;
            }
        });
    }

    numberOfLevels(): number {
        return this.regionAndComponentList.length;
    }

    getFirstLevel(): ComponentPathRegionAndComponent {
        return this.regionAndComponentList[0];
    }

    getLastLevel(): ComponentPathRegionAndComponent {
        return this.regionAndComponentList[this.regionAndComponentList.length - 1];
    }

    getLevels(): ComponentPathRegionAndComponent [] {
        return this.regionAndComponentList;
    }

    getComponentIndex(): number {
        return this.getLastLevel().getComponentIndex();
    }

    public removeFirstLevel(): ComponentPath {
        if (this.numberOfLevels() <= 1) {
            return null;
        }

        let newRegionAndComponentList: ComponentPathRegionAndComponent[] = [];
        for (let i = 1; i < this.regionAndComponentList.length; i++) {
            newRegionAndComponentList.push(this.regionAndComponentList[i]);
        }
        return new ComponentPath(newRegionAndComponentList);
    }

    public toString(): string {
        return this.refString;
    }

    equals(o: Equitable): boolean {

        if (!ObjectHelper.iFrameSafeInstanceOf(o, ComponentPath)) {
            return false;
        }

        let other = <ComponentPath>o;

        if (!ObjectHelper.stringEquals(this.refString, other.refString)) {
            return false;
        }

        return true;
    }

    public static fromString(str: string): ComponentPath {

        if (!str) {
            return null;
        }

        let elements: string[] = StringHelper.removeEmptyStrings(str.split(ComponentPath.DIVIDER));

        let regionAndComponentList: ComponentPathRegionAndComponent[] = [];
        for (let i = 0; i < elements.length - 1; i += 2) {
            let regionName = elements[i];
            let componentIndexAsString = elements[i + 1];
            let regionAndComponent = new ComponentPathRegionAndComponent(regionName, parseInt(componentIndexAsString, 10));
            regionAndComponentList.push(regionAndComponent);
        }

        return new ComponentPath(regionAndComponentList);
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
