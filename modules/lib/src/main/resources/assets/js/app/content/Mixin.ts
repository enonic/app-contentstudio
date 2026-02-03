import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';
import {Cloneable} from '@enonic/lib-admin-ui/Cloneable';
import {Equitable} from '@enonic/lib-admin-ui/Equitable';
import {PropertyTree} from '@enonic/lib-admin-ui/data/PropertyTree';
import {MixinName} from './MixinName';
import {MixinJson} from '../resource/json/MixinJson';

export class Mixin
    implements Cloneable, Equitable {

    private name: MixinName;

    private data: PropertyTree;

    constructor(name: MixinName, data: PropertyTree) {
        this.name = name;
        this.data = data;
    }

    static fromJson(metadataJson: MixinJson): Mixin {
        return new Mixin(new MixinName(metadataJson.name), PropertyTree.fromJson(metadataJson.data));
    }

    getData(): PropertyTree {
        return this.data;
    }

    clone(): Mixin {
        return new Mixin(this.name, this.data.copy());
    }

    equals(o: Equitable): boolean {
        if (!ObjectHelper.iFrameSafeInstanceOf(o, Mixin)) {
            return false;
        }

        let other = o as Mixin;

        if (!ObjectHelper.equals(this.name, other.name)) {
            return false;
        }

        if (!ObjectHelper.equals(this.data, other.data)) {
            return false;
        }

        return true;
    }

    toJson(): MixinJson {
        return {
            name: this.name.toString(),
            data: this.data.toJson()
        };
    }

    getName(): MixinName {
        return this.name;
    }

}
