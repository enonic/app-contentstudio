import * as Q from 'q';
import {StringHelper} from 'lib-admin-ui/util/StringHelper';
import {PropertyArray} from 'lib-admin-ui/data/PropertyArray';
import {Value} from 'lib-admin-ui/data/Value';
import {ValueType} from 'lib-admin-ui/data/ValueType';
import {ValueTypes} from 'lib-admin-ui/data/ValueTypes';
import {SelectedOptionEvent} from 'lib-admin-ui/ui/selector/combobox/SelectedOptionEvent';
import {UriHelper} from 'lib-admin-ui/util/UriHelper';
import {RichComboBox} from 'lib-admin-ui/ui/selector/combobox/RichComboBox';
import {SelectedOption} from 'lib-admin-ui/ui/selector/combobox/SelectedOption';
import {CustomSelectorItem} from './CustomSelectorItem';
import {CustomSelectorComboBox, CustomSelectorSelectedOptionsView} from './CustomSelectorComboBox';
import {ContentInputTypeViewContext} from '../ContentInputTypeViewContext';
import {BaseInputTypeManagingAdd} from 'lib-admin-ui/form/inputtype/support/BaseInputTypeManagingAdd';
import {Input} from 'lib-admin-ui/form/Input';
import {ValueTypeConverter} from 'lib-admin-ui/data/ValueTypeConverter';
import {InputTypeManager} from 'lib-admin-ui/form/inputtype/InputTypeManager';
import {Class} from 'lib-admin-ui/Class';

export class CustomSelector
    extends BaseInputTypeManagingAdd {

    public static debug: boolean = false;

    private static portalUrl: string = UriHelper.addSitePrefix('/edit/default/draft{0}/_/service/{1}');

    private requestPath: string;

    private comboBox: RichComboBox<CustomSelectorItem>;

    constructor(context: ContentInputTypeViewContext) {
        super('custom-selector');

        if (CustomSelector.debug) {
            console.debug('CustomSelector: config', context.inputConfig);
        }

        this.readConfig(context);
    }

    private readConfig(context: ContentInputTypeViewContext): void {
        const cfg = context.inputConfig;
        const serviceCfg = cfg['service'];
        let serviceUrl;
        if (serviceCfg) {
            serviceUrl = serviceCfg[0] ? serviceCfg[0]['value'] : undefined;
        }
        const serviceParams = cfg['param'] || [];
        const contentPath = context.contentPath.toString();

        const params = serviceParams.reduce((prev, curr) => {
            prev[curr['@value']] = curr['value'];
            return prev;
        }, {});

        if (serviceUrl) {
            this.requestPath =
                StringHelper.format(CustomSelector.portalUrl, contentPath, UriHelper.appendUrlParams(serviceUrl, params));
        }
    }

    getValueType(): ValueType {
        return ValueTypes.STRING;
    }

    newInitialValue(): Value {
        return null;
    }

    layout(input: Input, propertyArray: PropertyArray): Q.Promise<void> {
        if (!ValueTypes.STRING.equals(propertyArray.getType())) {
            propertyArray.convertValues(ValueTypes.STRING, ValueTypeConverter.convertTo);
        }
        super.layout(input, propertyArray);

        this.comboBox = this.createComboBox(input, propertyArray);

        this.appendChild(this.comboBox);

        this.setupSortable();
        this.setLayoutInProgress(false);

        return Q<void>(null);
    }

    update(propertyArray: PropertyArray, unchangedOnly?: boolean): Q.Promise<void> {
        const superPromise = super.update(propertyArray, unchangedOnly);

        if (!unchangedOnly || !this.comboBox.isDirty()) {
            return superPromise.then(() => {
                this.comboBox.setValue(this.getValueFromPropertyArray(propertyArray));
            });
        } else if (this.comboBox.isDirty()) {
            this.comboBox.forceChangedEvent();
        }
        return superPromise;
    }

    reset() {
        this.comboBox.resetBaseValues();
    }

    createComboBox(input: Input, propertyArray: PropertyArray): RichComboBox<CustomSelectorItem> {

        let comboBox = new CustomSelectorComboBox(input, this.requestPath, this.getValueFromPropertyArray(propertyArray));
        /*
         comboBox.onOptionFilterInputValueChanged((event: OptionFilterInputValueChangedEvent<string>) => {
         comboBox.setFilterArgs({searchString: event.getNewValue()});
         });
         */
        comboBox.onOptionSelected((event: SelectedOptionEvent<CustomSelectorItem>) => {
            this.ignorePropertyChange = true;

            const option = event.getSelectedOption();
            let value = new Value(String(option.getOption().value), ValueTypes.STRING);
            if (option.getIndex() >= 0) {
                this.getPropertyArray().set(option.getIndex(), value);
            } else {
                this.getPropertyArray().add(value);
            }
            this.refreshSortable();

            this.ignorePropertyChange = false;
            this.validate(false);

            this.fireFocusSwitchEvent(event);
        });

        comboBox.onOptionDeselected((event: SelectedOptionEvent<CustomSelectorItem>) => {
            this.ignorePropertyChange = true;

            this.getPropertyArray().remove(event.getSelectedOption().getIndex());

            this.refreshSortable();
            this.ignorePropertyChange = false;
            this.validate(false);
        });

        comboBox.onOptionMoved((moved: SelectedOption<any>, fromIndex: number) => this.handleMove(moved, fromIndex));

        comboBox.onValueLoaded(() => this.validate(false));

        return comboBox;
    }

    protected getNumberOfValids(): number {
        return this.getPropertyArray().getSize();
    }

    giveFocus(): boolean {
        if (this.comboBox.maximumOccurrencesReached()) {
            return false;
        }
        return this.comboBox.giveFocus();
    }

    onFocus(listener: (event: FocusEvent) => void) {
        this.comboBox.onFocus(listener);
    }

    unFocus(listener: (event: FocusEvent) => void) {
        this.comboBox.unFocus(listener);
    }

    onBlur(listener: (event: FocusEvent) => void) {
        this.comboBox.onBlur(listener);
    }

    unBlur(listener: (event: FocusEvent) => void) {
        this.comboBox.unBlur(listener);
    }

    private setupSortable() {
        this.getSelectedOptionsView().setOccurrencesSortable(true);
        this.updateSelectedOptionStyle();
    }

    private handleMove(moved: SelectedOption<any>, fromIndex: number) {
        this.getPropertyArray().move(fromIndex, moved.getIndex());
    }

    private refreshSortable() {
        this.updateSelectedOptionStyle();
        this.getSelectedOptionsView().refreshSortable();
    }

    private getSelectedOptionsView(): CustomSelectorSelectedOptionsView {
        this.updateSelectedOptionStyle();
        return <CustomSelectorSelectedOptionsView> this.comboBox.getSelectedOptionView();
    }

    private updateSelectedOptionStyle() {
        if (this.getPropertyArray().getSize() > 1) {
            this.addClass('multiple-occurrence').removeClass('single-occurrence');
        } else {
            this.addClass('single-occurrence').removeClass('multiple-occurrence');
        }
    }
}

InputTypeManager.register(new Class('CustomSelector', CustomSelector));
