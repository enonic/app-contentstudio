import {ComponentType} from './ComponentType';

export class ImageComponentType
    extends ComponentType {

    private static INSTANCE: ImageComponentType = new ImageComponentType();

    constructor() {
        super('image');
    }

    public static get(): ImageComponentType {
        return ImageComponentType.INSTANCE;
    }
}
