import {type Content} from '../content/Content';
import {XDataName} from '../content/XDataName';
import {type Property} from '@enonic/lib-admin-ui/data/Property';

export class ImageHelper {

    static getImageCaption(imageContent: Content): string {
        const captionProperty: Property = imageContent.getProperty('caption');

        if (captionProperty) {
            const caption: string = captionProperty.getString();

            if (caption) {
                return caption;
            }
        }

        return ImageHelper.getImageDescription(imageContent);
    }

    static getImageDescription(imageContent: Content): string {
        const imageInfoMixin = new XDataName('media:imageInfo');
        const imageInfoData = imageContent.getExtraDataByName(imageInfoMixin);

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

    static getImageAltText(imageContent: Content): string {
        const altTextProperty: Property = imageContent.getProperty('altText');

        if (altTextProperty) {
            const altText: string = altTextProperty.getString();

            if (altText) {
                return altText;
            }
        }

        return '';
    }
}
