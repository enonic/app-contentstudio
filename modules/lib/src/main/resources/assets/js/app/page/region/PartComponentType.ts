import {ComponentType} from './ComponentType';

export class PartComponentType
    extends ComponentType {

    private static INSTANCE: PartComponentType = new PartComponentType();

    static NAME: string = 'layout';

    constructor() {
        super(PartComponentType.NAME);
    }

    public static get(): PartComponentType {
        return PartComponentType.INSTANCE;
    }
}
