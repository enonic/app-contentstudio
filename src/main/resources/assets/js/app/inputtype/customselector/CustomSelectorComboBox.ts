import {RichComboBox, RichComboBoxBuilder} from 'lib-admin-ui/ui/selector/combobox/RichComboBox';
import {BaseSelectedOptionsView} from 'lib-admin-ui/ui/selector/combobox/BaseSelectedOptionsView';
import {Option} from 'lib-admin-ui/ui/selector/Option';
import {SelectedOption} from 'lib-admin-ui/ui/selector/combobox/SelectedOption';
import {CustomSelectorLoader} from './CustomSelectorLoader';
import {CustomSelectorItem} from './CustomSelectorItem';
import {CustomSelectorItemViewer} from './CustomSelectorItemViewer';
import {RichSelectedOptionView, RichSelectedOptionViewBuilder} from 'lib-admin-ui/ui/selector/combobox/RichSelectedOptionView';
import {Input} from 'lib-admin-ui/form/Input';

export class CustomSelectorComboBox
    extends RichComboBox<CustomSelectorItem> {

    constructor(input: Input, requestPath: string, value: string) {
        let loader = new CustomSelectorLoader(requestPath);

        let builder = new RichComboBoxBuilder<CustomSelectorItem>()
            .setComboBoxName(input.getName())
            .setMaximumOccurrences(input.getOccurrences().getMaximum())
            .setOptionDisplayValueViewer(new CustomSelectorItemViewer())
            .setSelectedOptionsView(new CustomSelectorSelectedOptionsView())
            .setDelayedInputValueChangedHandling(300)
            .setLoader(loader)
            .setValue(value);

        super(builder);
    }
}

export class CustomSelectorSelectedOptionsView
    extends BaseSelectedOptionsView<CustomSelectorItem> {
    createSelectedOption(option: Option<CustomSelectorItem>): SelectedOption<CustomSelectorItem> {
        return new SelectedOption<CustomSelectorItem>(new CustomSelectorSelectedOptionView(option), this.count());
    }

}

export class CustomSelectorSelectedOptionView
    extends RichSelectedOptionView<CustomSelectorItem> {

    constructor(option: Option<CustomSelectorItem>) {
        super(
            new RichSelectedOptionViewBuilder<CustomSelectorItem>(option)
                .setDraggable(true)
        );
    }

    protected createView(_content: CustomSelectorItem): CustomSelectorItemViewer {
        let viewer = new CustomSelectorItemViewer();
        viewer.setObject(this.getOption().displayValue);

        return viewer;
    }

}
