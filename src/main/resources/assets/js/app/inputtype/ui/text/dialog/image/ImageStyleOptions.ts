import Option = api.ui.selector.Option;
import {Styles} from '../../styles/Styles';
import {Style, StyleType} from '../../styles/Style';

export class ImageStyleOption {

    private style: Style;

    constructor(style: Style) {
        this.style = style;
    }

    getName(): string {
        return this.style.getName();
    }

    getDisplayName(): string {
        return this.style.getDisplayName();
    }

    getStyle(): Style {
        return this.style;
    }

    isEmpty(): boolean {
        return this.style.isEmpty();
    }
}

export class ImageStyleOptions {

    private static getEmptyOption(): Option<ImageStyleOption> {
        return ImageStyleOptions.getOption(Style.getEmpty(StyleType.IMAGE));
    }

    private static getOption(imageStyle: Style): Option<ImageStyleOption> {

        const imageStyleOption = new ImageStyleOption(imageStyle);

        return {
            value: imageStyleOption.getName(),
            displayValue: imageStyleOption
        }
    }

    static getOptions(): Option<ImageStyleOption>[] {

        const options: Option<ImageStyleOption>[] = [ImageStyleOptions.getEmptyOption()];

        Styles.getForImage().forEach((imageStyle: Style) => {
            options.push(ImageStyleOptions.getOption(imageStyle));
        });

        return options;
    }

}
