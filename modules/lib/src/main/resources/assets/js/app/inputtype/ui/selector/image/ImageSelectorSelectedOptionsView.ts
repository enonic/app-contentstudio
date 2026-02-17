import {type Option} from '@enonic/lib-admin-ui/ui/selector/Option';
import {SelectedOption} from '@enonic/lib-admin-ui/ui/selector/combobox/SelectedOption';
import {ImageSelectorSelectedOptionView} from './ImageSelectorSelectedOptionView';
import {type MediaTreeSelectorItem} from '../media/MediaTreeSelectorItem';
import {BaseGallerySelectedOptionsView} from '../BaseGallerySelectedOptionsView';

export class ImageSelectorSelectedOptionsView
    extends BaseGallerySelectedOptionsView<MediaTreeSelectorItem> {

    private editSelectedOptionsListeners: ((option: SelectedOption<MediaTreeSelectorItem>[]) => void)[] = [];

    constructor(readonly: boolean = false) {
        super({editable: !readonly, readonly});

        this.toolbar?.onEditClicked(() => {
            this.notifyEditSelectedOptions(this.selection);
        });
    }

    protected getNumberOfEditableOptions(): number {
        return this.selection.filter(option => option.getOption().getDisplayValue().isAvailable()).length;
    }

    createSelectedOption(option: Option<MediaTreeSelectorItem>): SelectedOption<MediaTreeSelectorItem> {
        return new SelectedOption<MediaTreeSelectorItem>(new ImageSelectorSelectedOptionView(option, this.readonly), this.count());
    }

    private notifyEditSelectedOptions(option: SelectedOption<MediaTreeSelectorItem>[]) {
        this.editSelectedOptionsListeners.forEach((listener) => {
            listener(option);
        });
    }

    onEditSelectedOptions(listener: (option: SelectedOption<MediaTreeSelectorItem>[]) => void) {
        this.editSelectedOptionsListeners.push(listener);
    }

    unEditSelectedOptions(listener: (option: SelectedOption<MediaTreeSelectorItem>[]) => void) {
        this.editSelectedOptionsListeners = this.editSelectedOptionsListeners
            .filter(function (curr: (option: SelectedOption<MediaTreeSelectorItem>[]) => void) {
                return curr !== listener;
            });
    }
}
