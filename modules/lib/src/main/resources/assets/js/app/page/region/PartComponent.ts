import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';
import {Equitable} from '@enonic/lib-admin-ui/Equitable';
import {DescriptorBasedComponent, DescriptorBasedComponentBuilder} from './DescriptorBasedComponent';
import {ComponentTypeWrapperJson} from './ComponentTypeWrapperJson';
import {PartComponentJson} from './PartComponentJson';
import {PartComponentType} from './PartComponentType';

export class PartComponent
    extends DescriptorBasedComponent {

    constructor(builder: PartComponentBuilder) {
        super(builder);
    }

    toJson(): ComponentTypeWrapperJson {
        let json: PartComponentJson = super.toComponentJson() as PartComponentJson;

        return {
            PartComponent: json
        } as ComponentTypeWrapperJson;
    }

    isEmpty(): boolean {
        return !this.hasDescriptor();
    }

    equals(o: Equitable): boolean {

        if (!ObjectHelper.iFrameSafeInstanceOf(o, PartComponent)) {
            return false;
        }

        return super.equals(o);
    }

    clone(): PartComponent {
        return new PartComponentBuilder(this).build();
    }
}

export class PartComponentBuilder
    extends DescriptorBasedComponentBuilder<PartComponent> {

    constructor(source?: PartComponent) {
        super(source);

        this.setType(PartComponentType.get());
    }

    public build(): PartComponent {
        return new PartComponent(this);
    }
}
