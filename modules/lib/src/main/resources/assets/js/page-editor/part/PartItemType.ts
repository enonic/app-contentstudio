import {ComponentItemType} from '../ComponentItemType';

export class PartItemType
    extends ComponentItemType {

    private static INSTANCE: PartItemType = new PartItemType();

    static get(): PartItemType {
        return PartItemType.INSTANCE;
    }

    constructor() {
        super('part');
    }

    isComponentType(): boolean {
        return true;
    }
}

PartItemType.get();
