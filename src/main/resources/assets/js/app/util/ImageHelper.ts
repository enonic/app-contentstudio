import {Content} from '../content/Content';
import {XDataName} from '../content/XDataName';

export class ImageHelper {

    static fetchImageCaption(imageContent: Content): string {
        return imageContent.getProperty('caption').getString() || ImageHelper.getDescriptionFromImageContent(imageContent);
    }

    static getDescriptionFromImageContent(imageContent: Content): string {
        const imageInfoMixin = new XDataName('media:imageInfo');
        const imageInfoData = imageContent.getExtraData(imageInfoMixin);

        if (!imageInfoData || !imageInfoData.getData()) {
            return null;
        }

        const descriptionProperty = imageInfoData.getData().getProperty('description');

        if (descriptionProperty) {
            const description = descriptionProperty.getString();
            if (description) {
                return description;
            }
        }

        return null;
    }

}
