import {SelectedOption} from '@enonic/lib-admin-ui/ui/selector/combobox/SelectedOption';
import {Option} from '@enonic/lib-admin-ui/ui/selector/Option';
import {RichComboBox, RichComboBoxBuilder} from '@enonic/lib-admin-ui/ui/selector/combobox/RichComboBox';
import {MacrosLoader} from './resource/MacrosLoader';
import {BaseSelectedOptionsView} from '@enonic/lib-admin-ui/ui/selector/combobox/BaseSelectedOptionsView';
import {RichSelectedOptionView, RichSelectedOptionViewBuilder} from '@enonic/lib-admin-ui/ui/selector/combobox/RichSelectedOptionView';
import {MacroDescriptor} from '@enonic/lib-admin-ui/macro/MacroDescriptor';
import {MacroViewer} from './MacroViewer';
import {Viewer} from '@enonic/lib-admin-ui/ui/Viewer';
import {SelectedOptionsView} from '@enonic/lib-admin-ui/ui/selector/combobox/SelectedOptionsView';

export class MacroComboBox
    extends RichComboBox<MacroDescriptor> {

    constructor(builder: MacroComboBoxBuilder = new MacroComboBoxBuilder()) {
        super(builder);

        this.addClass('content-combo-box');
    }

    public static create(): MacroComboBoxBuilder {
        return new MacroComboBoxBuilder();
    }

    getLoader(): MacrosLoader {
        return super.getLoader() as MacrosLoader;
    }

    createOption(val: MacroDescriptor): Option<MacroDescriptor> {
        return Option.create<MacroDescriptor>()
            .setValue(val.getKey().getRefString())
            .setDisplayValue(val)
            .build();
    }
}

export class MacroSelectedOptionsView
    extends BaseSelectedOptionsView<MacroDescriptor> {

    createSelectedOption(option: Option<MacroDescriptor>): SelectedOption<MacroDescriptor> {
        let optionView = new MacroSelectedOptionView(option);
        return new SelectedOption<MacroDescriptor>(optionView, this.count());
    }
}

export class MacroSelectedOptionView
    extends RichSelectedOptionView<MacroDescriptor> {

    constructor(option: Option<MacroDescriptor>) {
        super(new RichSelectedOptionViewBuilder<MacroDescriptor>().setOption(option) as RichSelectedOptionViewBuilder<MacroDescriptor>);
    }

    resolveIconUrl(macroDescriptor: MacroDescriptor): string {
        return macroDescriptor.getIconUrl();
    }

    resolveTitle(macroDescriptor: MacroDescriptor): string {
        return macroDescriptor.getDisplayName();
    }

    resolveSubTitle(macroDescriptor: MacroDescriptor): string {
        return macroDescriptor.getDescription();
    }
}

export class MacroComboBoxBuilder
    extends RichComboBoxBuilder<MacroDescriptor> {

    comboBoxName: string = 'macroSelector';

    loader: MacrosLoader;

    value: string;

    maxHeight: number = 250;

    optionDisplayValueViewer: Viewer<MacroDescriptor> = new MacroViewer();

    delayedInputValueChangedHandling: number = 750;

    selectedOptionsView: SelectedOptionsView<MacroDescriptor> = new MacroSelectedOptionsView();

    build(): MacroComboBox {
        return new MacroComboBox(this);
    }

}
