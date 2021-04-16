import {DescriptorJson} from './DescriptorJson';
import {Equitable} from 'lib-admin-ui/Equitable';
import {ObjectHelper} from 'lib-admin-ui/ObjectHelper';
import {Descriptor, DescriptorBuilder} from './Descriptor';

export class PageDescriptor
    extends Descriptor {

    static fromJson(json: DescriptorJson): Descriptor {
        return PageDescriptor.create(DescriptorBuilder.fromJson(json));
    }

    private static create(builder: DescriptorBuilder): PageDescriptor {
        return new PageDescriptor(builder);
    }

    getIconCls(): string {
        return 'file';
    }

    clone(): PageDescriptor {
        return new PageDescriptor(new DescriptorBuilder(this));
    }

    equals(o: Equitable): boolean {
        if (!ObjectHelper.iFrameSafeInstanceOf(o, PageDescriptor)) {
            return false;
        }

        return super.equals(o);
    }
}
