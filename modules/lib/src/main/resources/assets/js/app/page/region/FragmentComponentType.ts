import {ComponentType} from './ComponentType';

export class FragmentComponentType
    extends ComponentType {

    private static INSTANCE: FragmentComponentType = new FragmentComponentType();

    static NAME: string = 'fragment';

    constructor() {
        super(FragmentComponentType.NAME);
    }

    public static get(): FragmentComponentType {
        return FragmentComponentType.INSTANCE;
    }
}
