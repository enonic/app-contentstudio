import {ComponentType} from './ComponentType';

export class LayoutComponentType
    extends ComponentType {

    private static INSTANCE: LayoutComponentType = new LayoutComponentType();

    constructor() {
        super('layout');
    }

    public static get(): LayoutComponentType {
        return LayoutComponentType.INSTANCE;
    }
}
