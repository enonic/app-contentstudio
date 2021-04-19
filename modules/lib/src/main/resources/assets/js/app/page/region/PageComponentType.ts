import {ComponentType} from './ComponentType';

export class PageComponentType
    extends ComponentType {

    private static INSTANCE: PageComponentType = new PageComponentType();

    constructor() {
        super('page');
    }

    public static get(): PageComponentType {
        return PageComponentType.INSTANCE;
    }

    getIconCls(): string {
        return 'file';
    }
}
