import {ComponentItemType} from '../ComponentItemType';

export class ImageItemType
    extends ComponentItemType {

    private static INSTANCE: ImageItemType = new ImageItemType();

    static get(): ImageItemType {
        return ImageItemType.INSTANCE;
    }

    constructor() {
        super('image');
    }

    isComponentType(): boolean {
        return true;
    }
}

ImageItemType.get();
