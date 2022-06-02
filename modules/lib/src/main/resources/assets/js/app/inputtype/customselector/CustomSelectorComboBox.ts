/*global Q*/
import {RichComboBox, RichComboBoxBuilder} from '@enonic/lib-admin-ui/ui/selector/combobox/RichComboBox';
import {BaseSelectedOptionsView} from '@enonic/lib-admin-ui/ui/selector/combobox/BaseSelectedOptionsView';
import {Option} from '@enonic/lib-admin-ui/ui/selector/Option';
import {SelectedOption} from '@enonic/lib-admin-ui/ui/selector/combobox/SelectedOption';
import {CustomSelectorItem} from './CustomSelectorItem';
import {CustomSelectorItemViewer} from './CustomSelectorItemViewer';
import {RichSelectedOptionView, RichSelectedOptionViewBuilder} from '@enonic/lib-admin-ui/ui/selector/combobox/RichSelectedOptionView';
import {Viewer} from '@enonic/lib-admin-ui/ui/Viewer';
import {SelectedOptionsView} from '@enonic/lib-admin-ui/ui/selector/combobox/SelectedOptionsView';
import {BaseLoader} from '@enonic/lib-admin-ui/util/loader/BaseLoader';

export class CustomSelectorComboBox
    extends RichComboBox<CustomSelectorItem> {

    constructor(builder: CustomSelectorComboBoxBuilder) {
        super(builder);
    }

    protected reload(inputValue: string): Q.Promise<any> {
        const loader: BaseLoader<CustomSelectorItem> = this.getLoader();

        if (loader.isLoaded() && loader.getSearchString() === inputValue) {
            return loader.search(inputValue);
        }

        return super.reload(inputValue, true);
    }

    static create(): CustomSelectorComboBoxBuilder {
        return new CustomSelectorComboBoxBuilder();
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
        super(<RichSelectedOptionViewBuilder<CustomSelectorItem>>new RichSelectedOptionViewBuilder<CustomSelectorItem>()
            .setDraggable(true)
            .setOption(option)
        );
    }

    protected createView(_content: CustomSelectorItem): CustomSelectorItemViewer {
        let viewer = new CustomSelectorItemViewer();
        viewer.setObject(this.getOption().getDisplayValue());

        return viewer;
    }

}

export class CustomSelectorComboBoxBuilder
    extends RichComboBoxBuilder<CustomSelectorItem> {

    optionDisplayValueViewer: Viewer<CustomSelectorItem> = new CustomSelectorItemViewer();

    delayedInputValueChangedHandling: number = 300;

    selectedOptionsView: SelectedOptionsView<CustomSelectorItem> = new CustomSelectorSelectedOptionsView();

    build(): CustomSelectorComboBox {
        return new CustomSelectorComboBox(this);
    }
}
