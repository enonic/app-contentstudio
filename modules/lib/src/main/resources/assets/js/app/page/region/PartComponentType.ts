import {ComponentType} from './ComponentType';

export class PartComponentType
    extends ComponentType {

    private static INSTANCE: PartComponentType = new PartComponentType();

    constructor() {
        super('part');
    }

    public static get(): PartComponentType {
        return PartComponentType.INSTANCE;
    }

    getIconCls(): string {
        return 'part';
    }
}
