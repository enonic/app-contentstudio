import Dropdown = api.ui.selector.dropdown.Dropdown;
import Option = api.ui.selector.Option;
import DropdownConfig = api.ui.selector.dropdown.DropdownConfig;
import OptionSelectedEvent = api.ui.selector.OptionSelectedEvent;
import i18n = api.util.i18n;
import {ImageStyleOption, ImageStyleOptions} from './ImageStyleOptions';
import {ImageStyleOptionViewer} from './ImageStyleOptionViewer';

export class ImageStyleSelector
    extends Dropdown<ImageStyleOption> {

    private contentId: string;

    constructor(contentId: string) {
        super('imageSelector', <DropdownConfig<ImageStyleOption>>{
            optionDisplayValueViewer: new ImageStyleOptionViewer(),
            inputPlaceholderText: i18n('dialog.image.style.apply')
        });

        this.contentId = contentId;

        this.addClass('image-style-selector');

        this.initDropdown();
    }

    private initDropdown() {
        this.addOptions();

        this.onOptionSelected((event: OptionSelectedEvent<ImageStyleOption>) => {
            if ((<ImageStyleOption>event.getOption().displayValue).isEmpty()) {
                this.reset();
            }
        });
    }

    private addOptions() {
        ImageStyleOptions.getOptions(this.contentId).forEach((option: Option<ImageStyleOption>) => {
            this.addOption(option);
        });
    }

}
