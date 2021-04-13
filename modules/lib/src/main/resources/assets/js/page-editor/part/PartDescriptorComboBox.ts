import * as Q from 'q';
import {Element} from 'lib-admin-ui/dom/Element';
import {StyleHelper} from 'lib-admin-ui/StyleHelper';
import {NamesAndIconViewBuilder} from 'lib-admin-ui/app/NamesAndIconView';
import {RichComboBox, RichComboBoxBuilder} from 'lib-admin-ui/ui/selector/combobox/RichComboBox';
import {Option} from 'lib-admin-ui/ui/selector/Option';
import {SelectedOption} from 'lib-admin-ui/ui/selector/combobox/SelectedOption';
import {BaseSelectedOptionView} from 'lib-admin-ui/ui/selector/combobox/BaseSelectedOptionView';
import {BaseSelectedOptionsView} from 'lib-admin-ui/ui/selector/combobox/BaseSelectedOptionsView';
import {DescriptorKey} from 'lib-admin-ui/content/page/DescriptorKey';
import {ApplicationKey} from 'lib-admin-ui/application/ApplicationKey';
import {PartDescriptor} from 'lib-admin-ui/content/page/region/PartDescriptor';
import {PartDescriptorLoader} from '../../app/wizard/page/contextwindow/inspect/region/PartDescriptorLoader';
import {DescriptorViewer} from '../../app/wizard/page/contextwindow/inspect/DescriptorViewer';
import {NamesAndIconViewSize} from 'lib-admin-ui/app/NamesAndIconViewSize';
import {AEl} from 'lib-admin-ui/dom/AEl';
import {Viewer} from 'lib-admin-ui/ui/Viewer';
import {SelectedOptionsView} from 'lib-admin-ui/ui/selector/combobox/SelectedOptionsView';
import {ContentId} from 'lib-admin-ui/content/ContentId';
import {LayoutDescriptorLoader} from '../../app/wizard/page/contextwindow/inspect/region/LayoutDescriptorLoader';

export class PartDescriptorComboBox
    extends RichComboBox<PartDescriptor> {

    constructor() {
        super(new PartDescriptorComboBoxBuilder());
    }

    setContentId(contentId: ContentId) {
        (<LayoutDescriptorLoader>this.getLoader()).setContentId(contentId);
    }

    getDescriptor(descriptorKey: DescriptorKey): PartDescriptor {
        let option = this.getOptionByValue(descriptorKey.toString());
        if (option) {
            return option.getDisplayValue();
        }
        return null;
    }

    setDescriptor(descriptor: PartDescriptor) {

        this.clearSelection();
        if (descriptor) {
            let optionToSelect: Option<PartDescriptor> = this.getOptionByValue(descriptor.getKey().toString());
            if (!optionToSelect) {
                optionToSelect = Option.create<PartDescriptor>()
                    .setValue(descriptor.getKey().toString())
                    .setDisplayValue(descriptor)
                    .build();
                this.addOption(optionToSelect);
            }
            this.selectOption(optionToSelect);
        }
    }

}

export class PartDescriptorSelectedOptionsView
    extends BaseSelectedOptionsView<PartDescriptor> {

    createSelectedOption(option: Option<PartDescriptor>): SelectedOption<PartDescriptor> {
        return new SelectedOption<PartDescriptor>(new PartDescriptorSelectedOptionView(option), this.count());
    }
}

export class PartDescriptorSelectedOptionView
    extends BaseSelectedOptionView<PartDescriptor> {

    private descriptor: PartDescriptor;

    constructor(option: Option<PartDescriptor>) {
        super(option);

        this.descriptor = option.getDisplayValue();
        this.addClass('part-descriptor-selected-option-view');
    }

    doRender(): Q.Promise<boolean> {

        let namesAndIconView = new NamesAndIconViewBuilder().setSize(NamesAndIconViewSize.small).build();
        namesAndIconView.setIconClass(StyleHelper.getCommonIconCls('part') + ' icon-medium')
            .setIconUrl(this.descriptor.getIcon())
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

export class PartDescriptorComboBoxBuilder
    extends RichComboBoxBuilder<PartDescriptor> {

    loader: PartDescriptorLoader = new PartDescriptorLoader();

    maximumOccurrences: number = 1;

    identifierMethod: string = 'getKey';

    optionDisplayValueViewer: Viewer<PartDescriptor> = new DescriptorViewer<PartDescriptor>();

    selectedOptionsView: SelectedOptionsView<PartDescriptor> = new PartDescriptorSelectedOptionsView();

    noOptionsText: string = 'No parts available';

    nextInputFocusWhenMaxReached: boolean = true;
}
