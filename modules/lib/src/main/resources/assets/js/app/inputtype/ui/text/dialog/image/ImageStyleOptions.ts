import {Option} from '@enonic/lib-admin-ui/ui/selector/Option';
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

        return Option.create<ImageStyleOption>()
            .setValue(imageStyleOption.getName())
            .setDisplayValue(imageStyleOption)
            .build();
    }

    static getOptions(contentId: string): Option<ImageStyleOption>[] {

        const options: Option<ImageStyleOption>[] = [ImageStyleOptions.getEmptyOption()];

        Styles.getForImage(contentId).forEach((imageStyle: Style) => {
            options.push(ImageStyleOptions.getOption(imageStyle));
        });

        return options;
    }

}
