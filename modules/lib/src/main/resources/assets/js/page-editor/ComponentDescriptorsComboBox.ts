import * as Q from 'q';
import {Element} from '@enonic/lib-admin-ui/dom/Element';
import {StyleHelper} from '@enonic/lib-admin-ui/StyleHelper';
import {NamesAndIconViewBuilder} from '@enonic/lib-admin-ui/app/NamesAndIconView';
import {RichComboBox, RichComboBoxBuilder} from '@enonic/lib-admin-ui/ui/selector/combobox/RichComboBox';
import {Option} from '@enonic/lib-admin-ui/ui/selector/Option';
import {SelectedOption} from '@enonic/lib-admin-ui/ui/selector/combobox/SelectedOption';
import {BaseSelectedOptionView, BaseSelectedOptionViewBuilder} from '@enonic/lib-admin-ui/ui/selector/combobox/BaseSelectedOptionView';
import {BaseSelectedOptionsView} from '@enonic/lib-admin-ui/ui/selector/combobox/BaseSelectedOptionsView';
import {DescriptorKey} from '../app/page/DescriptorKey';
import {NamesAndIconViewSize} from '@enonic/lib-admin-ui/app/NamesAndIconViewSize';
import {AEl} from '@enonic/lib-admin-ui/dom/AEl';
import {Viewer} from '@enonic/lib-admin-ui/ui/Viewer';
import {SelectedOptionsView} from '@enonic/lib-admin-ui/ui/selector/combobox/SelectedOptionsView';
import {ComponentDescriptorsLoader} from '../app/wizard/page/contextwindow/inspect/region/ComponentDescriptorsLoader';
import {Descriptor} from '../app/page/Descriptor';
import {DescriptorViewer} from '../app/wizard/page/contextwindow/inspect/DescriptorViewer';
import {ComponentType} from '../app/page/region/ComponentType';
import {ContentId} from '../app/content/ContentId';

export class ComponentDescriptorsComboBox
    extends RichComboBox<Descriptor> {

    constructor(componentType: ComponentType) {
        super(
            new ComponentDescriptorsComboBoxBuilder()
            .setLoader(new ComponentDescriptorsLoader().setComponentType(componentType)) as RichComboBoxBuilder<Descriptor>
        );
    }

    setContentId(contentId: ContentId) {
        (this.getLoader() as ComponentDescriptorsLoader).setContentId(contentId);
    }

    getDescriptor(descriptorKey: DescriptorKey): Descriptor {
        let option = this.getOptionByValue(descriptorKey.toString());
        if (option) {
            return option.getDisplayValue();
        }
        return null;
    }

    setDescriptor(descriptor: Descriptor) {

        this.clearSelection();
        if (descriptor) {
            let optionToSelect: Option<Descriptor> = this.getOptionByValue(descriptor.getKey().toString());
            if (!optionToSelect) {
                optionToSelect = Option.create<Descriptor>()
                    .setValue(descriptor.getKey().toString())
                    .setDisplayValue(descriptor)
                    .build();
                this.addOption(optionToSelect);
            }
            this.selectOption(optionToSelect);
        }
    }

}

export class DescriptorSelectedOptionsView
    extends BaseSelectedOptionsView<Descriptor> {

    createSelectedOption(option: Option<Descriptor>): SelectedOption<Descriptor> {
        return new SelectedOption<Descriptor>(new DescriptorSelectedOptionView(option), this.count());
    }
}

export class DescriptorSelectedOptionView
    extends BaseSelectedOptionView<Descriptor> {

    private descriptor: Descriptor;

    constructor(option: Option<Descriptor>) {
        super(new BaseSelectedOptionViewBuilder<Descriptor>().setOption(option));

        this.descriptor = option.getDisplayValue();
        this.addClass('part-descriptor-selected-option-view');
    }

    doRender(): Q.Promise<boolean> {

        let namesAndIconView = new NamesAndIconViewBuilder().setSize(NamesAndIconViewSize.small).build();
        namesAndIconView.setIconClass(StyleHelper.getCommonIconCls('part') + ' icon-medium')
            .setMainName(this.descriptor.getDisplayName())
            .setSubName(this.descriptor.getKey().toString());

        if (this.descriptor.getIcon()) {
            namesAndIconView.setIconUrl(this.descriptor.getIcon());
        }

        const removeButtonEl: AEl = new AEl('remove');
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

export class ComponentDescriptorsComboBoxBuilder
    extends RichComboBoxBuilder<Descriptor> {

    maximumOccurrences: number = 1;

    identifierMethod: string = 'getKey';

    optionDisplayValueViewer: Viewer<Descriptor> = new DescriptorViewer();

    selectedOptionsView: SelectedOptionsView<Descriptor> = new DescriptorSelectedOptionsView();

    noOptionsText: string = 'No components available';

    nextInputFocusWhenMaxReached: boolean = true;
}
