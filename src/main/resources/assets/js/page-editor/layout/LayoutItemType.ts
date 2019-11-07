import {ComponentItemType} from '../ComponentItemType';

export class LayoutItemType
    extends ComponentItemType {

    private static INSTANCE: LayoutItemType = new LayoutItemType();

    static get(): LayoutItemType {
        return LayoutItemType.INSTANCE;
    }

    constructor() {
        super('layout');
    }

    isComponentType(): boolean {
        return true;
    }
}

LayoutItemType.get();
