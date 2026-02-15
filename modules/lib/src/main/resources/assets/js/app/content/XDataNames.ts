import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';
import {type Equitable} from '@enonic/lib-admin-ui/Equitable';
import {type XData} from './XData';
import {XDataName} from './XDataName';

export class XDataNames
    implements Equitable {

    private array: XDataName[];

    constructor(array: XDataName[]) {
        this.array = [];
        array.forEach((xDataName: XDataName) => {

            const duplicate = this.array.some((possibleDuplicate: XDataName) => {
                return xDataName.equals(possibleDuplicate);
            });

            if (!duplicate) {
                this.array.push(xDataName);
            } else {
                throw Error(`XDataNames do not allow duplicates, found: '${xDataName.toString()}'`);
            }
        });
    }

    static create(): XDataNamesBuilder {
        return new XDataNamesBuilder();
    }

    forEach(callback: (xDataName: XDataName, index?: number) => void) {
        this.array.forEach((xDataName: XDataName, index: number) => {
            callback(xDataName, index);
        });
    }

    contains(xDataName: XDataName): boolean {
        const containName = this.array.some((curXData: XDataName) => {
            return curXData.equals(xDataName);
        });
        return !!containName;
    }

    filter(callbackfn: (value: XDataName, index?: number) => boolean): XDataNames {
        return new XDataNames(this.array.filter((value: XDataName, index: number) => {
            return callbackfn(value, index);
        }));
    }

    map<U>(callbackfn: (value: XDataName, index?: number) => U): U[] {
        return this.array.map((value: XDataName, index: number) => {
            return callbackfn(value, index);
        });
    }

    equals(o: Equitable): boolean {
        if (!ObjectHelper.iFrameSafeInstanceOf(o, XDataNames)) {
            return false;
        }

        const other = o as XDataNames;
        return ObjectHelper.arrayEquals(this.array, other.array);
    }
}

export class XDataNamesBuilder {

    array: XDataName[] = [];

    fromStrings(values: string[]): XDataNamesBuilder {
        if (values) {
            values.forEach((value: string) => {
                this.addXDataName(new XDataName(value));
            });
        }
        return this;
    }

    fromXDatas(xDatas: XData[]): XDataNamesBuilder {
        if (xDatas) {
            xDatas.forEach((xData: XData) => {
                this.addXDataName(xData.getXDataName());
            });
        }
        return this;
    }

    addXDataName(value: XDataName): XDataNamesBuilder {
        this.array.push(value);
        return this;
    }

    build(): XDataNames {
        return new XDataNames(this.array);
    }
}
