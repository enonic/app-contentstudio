import {Option} from '@enonic/lib-admin-ui/ui/selector/Option';
import {SelectedOption} from '@enonic/lib-admin-ui/ui/selector/combobox/SelectedOption';
import {CustomSelectorItem} from './CustomSelectorItem';
import {CustomSelectorGallerySelectedOptionView} from './CustomSelectorGallerySelectedOptionView';
import {BaseGallerySelectedOptionsView} from '../ui/selector/BaseGallerySelectedOptionsView';

export class CustomSelectorGallerySelectedOptionsView extends BaseGallerySelectedOptionsView<CustomSelectorItem> {
    constructor() {
        super(false);
    }

    protected getNumberOfEditableOptions(): number {
        return 0; // CustomSelectorGallery does not have editable options
    }

    createSelectedOption(option: Option<CustomSelectorItem>): SelectedOption<CustomSelectorItem> {
        return new SelectedOption<CustomSelectorItem>(new CustomSelectorGallerySelectedOptionView(option), this.count());
    }
}
