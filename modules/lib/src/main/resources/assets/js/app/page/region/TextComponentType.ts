import {ComponentType} from './ComponentType';

export class TextComponentType
    extends ComponentType {

    private static INSTANCE: TextComponentType = new TextComponentType();

    constructor() {
        super('text');
    }

    public static get(): TextComponentType {
        return TextComponentType.INSTANCE;
    }
}
