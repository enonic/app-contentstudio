import {i18n} from 'lib-admin-ui/util/Messages';
import {Option} from 'lib-admin-ui/ui/selector/Option';
import {Dropdown, DropdownConfig} from 'lib-admin-ui/ui/selector/dropdown/Dropdown';
import {OptionSelectedEvent} from 'lib-admin-ui/ui/selector/OptionSelectedEvent';
import {ImageStyleOption, ImageStyleOptions} from './ImageStyleOptions';
import {ImageStyleOptionViewer} from './ImageStyleOptionViewer';

export class ImageStyleSelector
    extends Dropdown<ImageStyleOption> {

    private contentId: string;

    constructor(contentId: string) {
        super('imageSelector', <DropdownConfig<ImageStyleOption>>{
            optionDisplayValueViewer: new ImageStyleOptionViewer(),
            inputPlaceholderText: i18n('dialog.image.style.apply'),
            rowHeight: 26
        });

        this.contentId = contentId;

        this.addClass('image-style-selector');

        this.initDropdown();
    }

    private initDropdown() {
        this.addOptions();

        this.onOptionSelected((event: OptionSelectedEvent<ImageStyleOption>) => {
            if ((<ImageStyleOption>event.getOption().getDisplayValue()).isEmpty()) {
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
