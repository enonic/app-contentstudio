import {ComponentItemType} from '../ComponentItemType';

export class FragmentItemType
    extends ComponentItemType {

    private static INSTANCE: FragmentItemType = new FragmentItemType();

    static get(): FragmentItemType {
        return FragmentItemType.INSTANCE;
    }

    constructor() {
        super('fragment');
    }

    isComponentType(): boolean {
        return true;
    }
}

FragmentItemType.get();
