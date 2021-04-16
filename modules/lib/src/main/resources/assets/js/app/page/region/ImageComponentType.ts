import {ComponentType} from './ComponentType';

export class ImageComponentType
    extends ComponentType {

    private static INSTANCE: ImageComponentType = new ImageComponentType();

    static NAME: string = 'image';

    constructor() {
        super(ImageComponentType.NAME);
    }

    public static get(): ImageComponentType {
        return ImageComponentType.INSTANCE;
    }
}
