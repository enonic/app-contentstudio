import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';
import {type Cloneable} from '@enonic/lib-admin-ui/Cloneable';
import {type Equitable} from '@enonic/lib-admin-ui/Equitable';
import {PropertyTree} from '@enonic/lib-admin-ui/data/PropertyTree';
import {XDataName} from './XDataName';
import {type ExtraDataJson} from '../resource/json/ExtraDataJson';

export class ExtraData
    implements Cloneable, Equitable {

    private name: XDataName;

    private data: PropertyTree;

    constructor(name: XDataName, data: PropertyTree) {
        this.name = name;
        this.data = data;
    }

    static fromJson(metadataJson: ExtraDataJson): ExtraData {
        return new ExtraData(new XDataName(metadataJson.name), PropertyTree.fromJson(metadataJson.data));
    }

    getData(): PropertyTree {
        return this.data;
    }

    clone(): ExtraData {
        return new ExtraData(this.name, this.data.copy());
    }

    equals(o: Equitable): boolean {
        if (!ObjectHelper.iFrameSafeInstanceOf(o, ExtraData)) {
            return false;
        }

        const other = o as ExtraData;

        if (!ObjectHelper.equals(this.name, other.name)) {
            return false;
        }

        if (!ObjectHelper.equals(this.data, other.data)) {
            return false;
        }

        return true;
    }

    toJson(): ExtraDataJson {
        return {
            name: this.name.toString(),
            data: this.data.toJson()
        };
    }

    getName(): XDataName {
        return this.name;
    }

}
