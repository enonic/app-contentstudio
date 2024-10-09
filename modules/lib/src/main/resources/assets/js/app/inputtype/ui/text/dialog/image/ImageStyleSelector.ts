import {Option} from '@enonic/lib-admin-ui/ui/selector/Option';
import {ImageStyleOption, ImageStyleOptions} from './ImageStyleOptions';
import {Dropdown} from '@enonic/lib-admin-ui/ui/Dropdown';
import {Style} from '../../styles/Style';

export class ImageStyleSelector
    extends Dropdown {

    private contentId: string;

    private styles: Map<string, Style> = new Map<string, Style>();

    constructor(contentId: string) {
        super('imageSelector');

        this.contentId = contentId;

        this.addClass('image-style-selector');

        this.initDropdown();
    }

    private initDropdown() {
        this.addOptions();
    }

    private addOptions() {
        ImageStyleOptions.getOptions(this.contentId).forEach((option: Option<ImageStyleOption>) => {
            this.styles.set(option.getValue(), option.getDisplayValue().getStyle());
            this.addOption(option.getValue(), option.getDisplayValue().getDisplayName());
        });
    }

    getSelectedStyle(): Style {
        return this.styles.get(this.getValue());
    }
}
