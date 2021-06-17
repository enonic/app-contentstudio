import {Equitable} from 'lib-admin-ui/Equitable';
import {ObjectHelper} from 'lib-admin-ui/ObjectHelper';
import {RegionsDescriptorJson} from './RegionsDescriptorJson';

export class RegionDescriptor
    implements Equitable {

    private name: string;

    constructor(builder: RegionDescriptorBuilder) {
        this.name = builder.name;
    }

    public static create(): RegionDescriptorBuilder {
        return new RegionDescriptorBuilder();
    }

    public static fromJson(json: RegionsDescriptorJson): RegionDescriptor {
        return RegionDescriptor.create().setName(json.name).build();
    }

    getName(): string {
        return this.name;
    }

    equals(o: Equitable): boolean {
        if (!ObjectHelper.iFrameSafeInstanceOf(o, RegionDescriptor)) {
            return false;
        }

        let other = <RegionDescriptor>o;

        return this.name === other.getName();
    }

}

export class RegionDescriptorBuilder {

    name: string;

    public setName(value: string): RegionDescriptorBuilder {
        this.name = value;
        return this;
    }

    public build(): RegionDescriptor {
        return new RegionDescriptor(this);
    }
}
