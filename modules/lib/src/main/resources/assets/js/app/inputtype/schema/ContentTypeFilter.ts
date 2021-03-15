import * as Q from 'q';
import {Input} from 'lib-admin-ui/form/Input';
import {PropertyArray} from 'lib-admin-ui/data/PropertyArray';
import {Value} from 'lib-admin-ui/data/Value';
import {ValueType} from 'lib-admin-ui/data/ValueType';
import {ValueTypes} from 'lib-admin-ui/data/ValueTypes';
import {ContentTypeSummary} from 'lib-admin-ui/schema/content/ContentTypeSummary';
import {SelectedOption} from 'lib-admin-ui/ui/selector/combobox/SelectedOption';
import {SelectedOptionEvent} from 'lib-admin-ui/ui/selector/combobox/SelectedOptionEvent';
import {BaseLoader} from 'lib-admin-ui/util/loader/BaseLoader';
import {BaseInputTypeManagingAdd} from 'lib-admin-ui/form/inputtype/support/BaseInputTypeManagingAdd';
import {ContentInputTypeViewContext} from '../ContentInputTypeViewContext';
import {PageTemplateContentTypeLoader} from './PageTemplateContentTypeLoader';
import {ContentTypeComboBox} from './ContentTypeComboBox';
import {ContentTypeSummaryLoader} from './ContentTypeSummaryLoader';
import {ContentTypeSummaryByDisplayNameComparator} from './ContentTypeSummaryByDisplayNameComparator';
import {ValueTypeConverter} from 'lib-admin-ui/data/ValueTypeConverter';
import {InputTypeManager} from 'lib-admin-ui/form/inputtype/InputTypeManager';
import {Class} from 'lib-admin-ui/Class';

export class ContentTypeFilter
    extends BaseInputTypeManagingAdd {

    private combobox: ContentTypeComboBox;

    private context: ContentInputTypeViewContext;

    private onContentTypesLoadedHandler: (contentTypeArray: ContentTypeSummary[]) => void;

    private isContextDependent: boolean;

    constructor(context: ContentInputTypeViewContext) {
        super('content-type-filter');
        this.context = context;
        this.onContentTypesLoadedHandler = this.onContentTypesLoaded.bind(this);
        this.readConfig(context.inputConfig);
    }

    protected readConfig(inputConfig: { [element: string]: { [name: string]: string }[]; }): void {
        const isContextDependentConfig = inputConfig['context'] ? inputConfig['context'][0] : {};
        const value = isContextDependentConfig['value'] || '';
        this.isContextDependent = value.toLowerCase() === 'true';
    }

    getValueType(): ValueType {
        return ValueTypes.STRING;
    }

    newInitialValue(): Value {
        return null;
    }

    private createLoader(): BaseLoader<ContentTypeSummary> {
        let loader: BaseLoader<ContentTypeSummary>;
        if (this.context.formContext.getContentTypeName().isPageTemplate()) {
            let contentId = this.context.site.getContentId();
            loader = new PageTemplateContentTypeLoader(contentId);
        } else {
            let contentId = this.isContextDependent && (this.context.content ? this.context.content.getContentId() : null);
            loader = new ContentTypeSummaryLoader(contentId);
        }

        loader.setComparator(new ContentTypeSummaryByDisplayNameComparator());

        return loader;
    }

    private createComboBox(): ContentTypeComboBox {
        const loader = this.createLoader();
        const comboBox: ContentTypeComboBox = <ContentTypeComboBox>ContentTypeComboBox.create()
            .setLoader(loader)
            .setMaximumOccurrences(this.getInput().getOccurrences().getMaximum())
            .build();

        comboBox.onLoaded(this.onContentTypesLoadedHandler);

        comboBox.onOptionSelected((event: SelectedOptionEvent<ContentTypeSummary>) => {
            this.fireFocusSwitchEvent(event);
            this.onContentTypeSelected(event.getSelectedOption());
        });

        comboBox.onOptionDeselected((event: SelectedOptionEvent<ContentTypeSummary>) =>
            this.onContentTypeDeselected(event.getSelectedOption()));

        return comboBox;
    }

    private onContentTypesLoaded(): void {

        this.combobox.getComboBox().setValue(this.getValueFromPropertyArray(this.getPropertyArray()));

        this.setLayoutInProgress(false);
        this.combobox.unLoaded(this.onContentTypesLoadedHandler);
    }

    private onContentTypeSelected(selectedOption: SelectedOption<ContentTypeSummary>): void {
        if (this.isLayoutInProgress()) {
            return;
        }
        this.ignorePropertyChange(true);
        let value = new Value(selectedOption.getOption().getDisplayValue().getContentTypeName().toString(), ValueTypes.STRING);
        if (this.combobox.countSelected() === 1) { // overwrite initial value
            this.getPropertyArray().set(0, value);
        } else {
            this.getPropertyArray().add(value);
        }

        this.validate(false);
        this.ignorePropertyChange(false);
    }

    private onContentTypeDeselected(option: SelectedOption<ContentTypeSummary>): void {
        this.ignorePropertyChange(true);
        this.getPropertyArray().remove(option.getIndex());
        this.validate(false);
        this.ignorePropertyChange(false);
    }

    layout(input: Input, propertyArray: PropertyArray): Q.Promise<void> {
        if (!ValueTypes.STRING.equals(propertyArray.getType())) {
            propertyArray.convertValues(ValueTypes.STRING, ValueTypeConverter.convertTo);
        }
        super.layout(input, propertyArray);

        this.appendChild(this.combobox = this.createComboBox());

        return this.combobox.getLoader().load().then(() => {
            this.validate(false);
            return Q<void>(null);
        });
    }

    update(propertyArray: PropertyArray, unchangedOnly: boolean): Q.Promise<void> {
        let superPromise = super.update(propertyArray, unchangedOnly);

        if (!unchangedOnly || !this.combobox.isDirty()) {
            return superPromise.then(() => {

                return this.combobox.getLoader().load().then(this.onContentTypesLoadedHandler);
            });
        } else if (this.combobox.isDirty()) {
            this.combobox.forceChangedEvent();
        }
        return superPromise;
    }

    reset() {
        this.combobox.resetBaseValues();
    }

    setEnabled(enable: boolean): void {
        super.setEnabled(enable);
        this.combobox.setEnabled(enable);
    }

    protected getNumberOfValids(): number {
        return this.getPropertyArray().getSize();
    }

    giveFocus(): boolean {
        return this.combobox.maximumOccurrencesReached() ? false : this.combobox.giveFocus();
    }

    onFocus(listener: (event: FocusEvent) => void) {
        this.combobox.onFocus(listener);
    }

    unFocus(listener: (event: FocusEvent) => void) {
        this.combobox.unFocus(listener);
    }

    onBlur(listener: (event: FocusEvent) => void) {
        this.combobox.onBlur(listener);
    }

    unBlur(listener: (event: FocusEvent) => void) {
        this.combobox.unBlur(listener);
    }
}

InputTypeManager.register(new Class('ContentTypeFilter', ContentTypeFilter));
