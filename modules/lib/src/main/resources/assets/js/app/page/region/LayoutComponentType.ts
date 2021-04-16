import {ComponentType} from './ComponentType';

export class LayoutComponentType
    extends ComponentType {

    private static INSTANCE: LayoutComponentType = new LayoutComponentType();

    static NAME: string = 'layout';

    constructor() {
        super(LayoutComponentType.NAME);
    }

    public static get(): LayoutComponentType {
        return LayoutComponentType.INSTANCE;
    }
}
