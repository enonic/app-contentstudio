import {ComponentType} from './ComponentType';

export class FragmentComponentType
    extends ComponentType {

    private static INSTANCE: FragmentComponentType = new FragmentComponentType();

    constructor() {
        super('fragment');
    }

    public static get(): FragmentComponentType {
        return FragmentComponentType.INSTANCE;
    }
}
