import {ImageStyle} from './ImageStyle';
import {ImageStyleJson, ImageStylesJson} from './ImageStylesDescriptor';

export class ImageStyles {

    private css: string;
    private styles: ImageStyle[] = [];

    constructor(json: ImageStylesJson) {
        this.css = json.css;
        if (json.styles) {
            json.styles.forEach((imageStyleJson: ImageStyleJson) => {
                this.styles.push(new ImageStyle(imageStyleJson));
            });
        }
    }

    getCssFileName(): string {
        return this.css;
    }

    getAlignmentStyles(): ImageStyle[] {
        return this.styles.filter((style: ImageStyle) => style.isAlignmentType());
    }

    getWidthStyles(): ImageStyle[] {
        return this.styles.filter((style: ImageStyle) => style.isWidthType());
    }

    getStyles(): ImageStyle[] {
        return this.styles.filter((style: ImageStyle) => style.isStyleType());
    }
}
