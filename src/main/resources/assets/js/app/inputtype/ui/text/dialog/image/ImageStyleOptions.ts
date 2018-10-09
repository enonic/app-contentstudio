import i18n = api.util.i18n;
import Option = api.ui.selector.Option;
import {ImageStyle} from './ImageStyle';
import {ImageStyles} from './ImageStyles';
import {ImageCroppingOption} from './ImageCroppingOption';

export class ImageStyleOption {

    private name: string;

    private displayName: string;

    constructor(imageStyle: ImageStyle) {
        this.name = imageStyle.getName();
        this.displayName = imageStyle.getDisplayName();
    }

    getName(): string {
        return this.name;
    }

    getDisplayName(): string {
        return this.displayName;
    }

}

export class ImageStyleOptions {

    static getEmptyOption(): Option<ImageStyleOption> {
        const imageStyle = new ImageStyle({
            name: 'none',
            displayName: i18n('dialog.image.cropping.none')
        });

        const imageStyleOption = new ImageStyleOption(imageStyle);

        return {
            value: imageStyleOption.getName(),
            displayValue: imageStyleOption
        }
    }

    static getOptions(): Option<ImageStyleOption>[] {

        const options: Option<ImageStyleOption>[] = [ImageStyleOptions.getEmptyOption()];

        ImageStyles.get().getStyles().forEach((imageStyle: ImageStyle) => {
            const imageStyleOption = new ImageStyleOption(imageStyle);
            const option = {
                value: imageStyleOption.getName(),
                displayValue: imageStyleOption
            };

            options.push(option);
        });

        return options;
    }

}
