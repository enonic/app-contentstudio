import * as Q from 'q';
import {Element} from 'lib-admin-ui/dom/Element';
import {NamesAndIconViewBuilder} from 'lib-admin-ui/app/NamesAndIconView';
import {RichComboBox, RichComboBoxBuilder} from 'lib-admin-ui/ui/selector/combobox/RichComboBox';
import {Option} from 'lib-admin-ui/ui/selector/Option';
import {SelectedOption} from 'lib-admin-ui/ui/selector/combobox/SelectedOption';
import {BaseSelectedOptionView} from 'lib-admin-ui/ui/selector/combobox/BaseSelectedOptionView';
import {BaseSelectedOptionsView} from 'lib-admin-ui/ui/selector/combobox/BaseSelectedOptionsView';
import {DescriptorKey} from 'lib-admin-ui/content/page/DescriptorKey';
import {LayoutDescriptor} from 'lib-admin-ui/content/page/region/LayoutDescriptor';
import {ApplicationKey} from 'lib-admin-ui/application/ApplicationKey';
import {LayoutDescriptorLoader} from '../../app/wizard/page/contextwindow/inspect/region/LayoutDescriptorLoader';
import {DescriptorViewer} from '../../app/wizard/page/contextwindow/inspect/DescriptorViewer';
import {NamesAndIconViewSize} from 'lib-admin-ui/app/NamesAndIconViewSize';
import {AEl} from 'lib-admin-ui/dom/AEl';
import {Viewer} from 'lib-admin-ui/ui/Viewer';
import {SelectedOptionsView} from 'lib-admin-ui/ui/selector/combobox/SelectedOptionsView';

export class LayoutDescriptorComboBox
    extends RichComboBox<LayoutDescriptor> {

    constructor() {
        super(new LayoutDescriptorComboBoxBuilder());
    }

    setApplicationKeys(applicationKeys: ApplicationKey[]) {
        (<LayoutDescriptorLoader>this.getLoader()).setApplicationKeys(applicationKeys);
    }

    getDescriptor(descriptorKey: DescriptorKey): LayoutDescriptor {
        let option = this.getOptionByValue(descriptorKey.toString());
        if (option) {
            return option.getDisplayValue();
        }
        return null;
    }

    setDescriptor(descriptor: LayoutDescriptor) {

        this.clearSelection();
        if (descriptor) {
            let optionToSelect: Option<LayoutDescriptor> = this.getOptionByValue(descriptor.getKey().toString());
            if (!optionToSelect) {
                optionToSelect = Option.create<LayoutDescriptor>()
                    .setValue(descriptor.getKey().toString())
                    .setDisplayValue(descriptor)
                    .build();
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

        this.descriptor = option.getDisplayValue();
        this.addClass('layout-descriptor-selected-option-view');
    }

    doRender(): Q.Promise<boolean> {

        let namesAndIconView = new NamesAndIconViewBuilder().setSize(NamesAndIconViewSize.small).build();
        namesAndIconView.setIconClass('icon-earth icon-medium')
            .setMainName(this.descriptor.getDisplayName())
            .setSubName(this.descriptor.getKey().toString());

        let removeButtonEl = new AEl('remove');
        removeButtonEl.onClicked((event: MouseEvent) => {
            this.notifyRemoveClicked();

            event.stopPropagation();
            event.preventDefault();
            return false;
        });

        this.appendChildren<Element>(removeButtonEl, namesAndIconView);

        return Q(true);
    }

}

export class LayoutDescriptorComboBoxBuilder
    extends RichComboBoxBuilder<LayoutDescriptor> {

    loader: LayoutDescriptorLoader = new LayoutDescriptorLoader();

    maximumOccurrences: number = 1;

    identifierMethod: string = 'getKey';

    optionDisplayValueViewer: Viewer<LayoutDescriptor> = new DescriptorViewer<LayoutDescriptor>();

    selectedOptionsView: SelectedOptionsView<LayoutDescriptor> = new LayoutDescriptorSelectedOptionsView();

    noOptionsText: string = 'No layouts available';

    nextInputFocusWhenMaxReached: boolean = true;
}
