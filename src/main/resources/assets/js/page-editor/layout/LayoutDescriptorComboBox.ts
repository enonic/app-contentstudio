import RichComboBox = api.ui.selector.combobox.RichComboBox;
import RichComboBoxBuilder = api.ui.selector.combobox.RichComboBoxBuilder;
import Option = api.ui.selector.Option;
import SelectedOption = api.ui.selector.combobox.SelectedOption;
import BaseSelectedOptionView = api.ui.selector.combobox.BaseSelectedOptionView;
import BaseSelectedOptionsView = api.ui.selector.combobox.BaseSelectedOptionsView;
import DescriptorKey = api.content.page.DescriptorKey;
import LayoutDescriptor = api.content.page.region.LayoutDescriptor;
import ApplicationKey = api.application.ApplicationKey;
import {LayoutDescriptorLoader} from '../../app/wizard/page/contextwindow/inspect/region/LayoutDescriptorLoader';
import {DescriptorViewer} from '../../app/wizard/page/contextwindow/inspect/DescriptorViewer';

export class LayoutDescriptorComboBox
    extends RichComboBox<LayoutDescriptor> {

    constructor() {
        super(new RichComboBoxBuilder<LayoutDescriptor>()
            .setIdentifierMethod('getKey')
            .setOptionDisplayValueViewer(new DescriptorViewer<LayoutDescriptor>())
            .setSelectedOptionsView(new LayoutDescriptorSelectedOptionsView())
            .setLoader(new LayoutDescriptorLoader())
            .setMaximumOccurrences(1)
            .setNextInputFocusWhenMaxReached(false)
            .setNoOptionsText('No layouts available'));
    }

    loadDescriptors(applicationKeys: ApplicationKey[]) {
        (<LayoutDescriptorLoader>this.getLoader()).setApplicationKeys(applicationKeys);
        this.getLoader().load();
    }

    getDescriptor(descriptorKey: DescriptorKey): LayoutDescriptor {
        let option = this.getOptionByValue(descriptorKey.toString());
        if (option) {
            return option.displayValue;
        }
        return null;
    }

    setDescriptor(descriptor: LayoutDescriptor) {

        this.clearSelection();
        if (descriptor) {
            let optionToSelect: Option<LayoutDescriptor> = this.getOptionByValue(descriptor.getKey().toString());
            if (!optionToSelect) {
                optionToSelect = {
                    value: descriptor.getKey().toString(),
                    displayValue: descriptor
                };
                this.addOption(optionToSelect);
            }
            this.selectOption(optionToSelect);
        }
    }
}

export class LayoutDescriptorSelectedOptionsView
    extends BaseSelectedOptionsView<LayoutDescriptor> {

    createSelectedOption(option: Option<LayoutDescriptor>): SelectedOption<LayoutDescriptor> {
        return new SelectedOption<LayoutDescriptor>(new LayoutDescriptorSelectedOptionView(option), this.count());
    }
}

export class LayoutDescriptorSelectedOptionView
    extends BaseSelectedOptionView<LayoutDescriptor> {

    private descriptor: LayoutDescriptor;

    constructor(option: Option<LayoutDescriptor>) {
        super(option);

        this.descriptor = option.displayValue;
        this.addClass('layout-descriptor-selected-option-view');
    }

    doRender(): wemQ.Promise<boolean> {

        let namesAndIconView = new api.app.NamesAndIconViewBuilder().setSize(api.app.NamesAndIconViewSize.small).build();
        namesAndIconView.setIconClass('icon-earth icon-medium')
            .setMainName(this.descriptor.getDisplayName())
            .setSubName(this.descriptor.getKey().toString());

        let removeButtonEl = new api.dom.AEl('remove');
        removeButtonEl.onClicked((event: MouseEvent) => {
            this.notifyRemoveClicked();

            event.stopPropagation();
            event.preventDefault();
            return false;
        });

        this.appendChildren<api.dom.Element>(removeButtonEl, namesAndIconView);

        return wemQ(true);
    }

}
