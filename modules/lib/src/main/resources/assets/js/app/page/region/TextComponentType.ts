import {ComponentType} from './ComponentType';

export class TextComponentType
    extends ComponentType {

    private static INSTANCE: TextComponentType = new TextComponentType();

    static NAME: string = 'text';

    constructor() {
        super(TextComponentType.NAME);
    }

    public static get(): TextComponentType {
        return TextComponentType.INSTANCE;
    }
}
