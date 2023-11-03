import * as Q from 'q';
import {Input} from '@enonic/lib-admin-ui/form/Input';
import {PropertyArray} from '@enonic/lib-admin-ui/data/PropertyArray';
import {Value} from '@enonic/lib-admin-ui/data/Value';
import {ValueType} from '@enonic/lib-admin-ui/data/ValueType';
import {ValueTypes} from '@enonic/lib-admin-ui/data/ValueTypes';
import {ContentTypeSummary} from '@enonic/lib-admin-ui/schema/content/ContentTypeSummary';
import {BaseLoader} from '@enonic/lib-admin-ui/util/loader/BaseLoader';
import {BaseInputTypeManagingAdd} from '@enonic/lib-admin-ui/form/inputtype/support/BaseInputTypeManagingAdd';
import {ContentInputTypeViewContext} from '../ContentInputTypeViewContext';
import {PageTemplateContentTypeLoader} from './PageTemplateContentTypeLoader';
import {ContentTypeSummaryLoader} from './ContentTypeSummaryLoader';
import {ContentTypeComparator} from './ContentTypeComparator';
import {ValueTypeConverter} from '@enonic/lib-admin-ui/data/ValueTypeConverter';
import {InputTypeManager} from '@enonic/lib-admin-ui/form/inputtype/InputTypeManager';
import {Class} from '@enonic/lib-admin-ui/Class';
import {ContentId} from '../../content/ContentId';
import {ContentTypeFilterDropdown} from './ContentTypeFilterDropdown';
import {SelectionChange} from '@enonic/lib-admin-ui/util/SelectionChange';
import {ValueChangedEvent} from '@enonic/lib-admin-ui/form/inputtype/ValueChangedEvent';

export class ContentTypeFilter
    extends BaseInputTypeManagingAdd {

    protected context: ContentInputTypeViewContext;

    private typesListDropdown: ContentTypeFilterDropdown;

    private isContextDependent: boolean;

    constructor(context: ContentInputTypeViewContext) {
        super(context, 'content-type-filter');
    }

    protected readInputConfig(): void {
        const contextDependentProp: Record<string, string> =
            this.context.inputConfig['context'] ? this.context.inputConfig['context'][0] : {};
        const value: string = contextDependentProp['value'] || '';
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

        if (this.context.formContext.getContentTypeName()?.isPageTemplate()) {
            const contentId: ContentId = this.context.site?.getContentId();
            loader = new PageTemplateContentTypeLoader(contentId, this.context.project);
        } else {
            const contentId: ContentId = this.isContextDependent ? this.context.content?.getContentId() : null;
            loader = new ContentTypeSummaryLoader(contentId, this.context.project);
        }

        loader.setComparator(new ContentTypeComparator());

        return loader;
    }

    private onContentTypeSelected(contentType: ContentTypeSummary): void {
        this.ignorePropertyChange(true);
        let value = new Value(contentType.getContentTypeName().toString(), ValueTypes.STRING);
        if (this.typesListDropdown.countSelected() === 1) { // overwrite initial value
            this.getPropertyArray().set(0, value);
        } else {
            this.getPropertyArray().add(value);
        }

        this.handleValueChanged(false);
        this.ignorePropertyChange(false);
    }

    private onContentTypeDeselected(item: ContentTypeSummary): void {
        const property = this.getPropertyArray().getProperties().find((property) => {
            const propertyValue = property.hasNonNullValue() ? property.getString() : '';
            return propertyValue === item.getId();
        });

        if (property) {
            this.ignorePropertyChange(true);
            this.getPropertyArray().remove(property.getIndex());
            this.handleValueChanged(false);
            this.ignorePropertyChange(false);
        }
    }

    layout(input: Input, propertyArray: PropertyArray): Q.Promise<void> {
        if (!ValueTypes.STRING.equals(propertyArray.getType())) {
            propertyArray.convertValues(ValueTypes.STRING, ValueTypeConverter.convertTo);
        }

        return super.layout(input, propertyArray).then(() => {
            this.typesListDropdown = this.createListDropdown();
            this.appendChild(this.typesListDropdown);
        }).finally(() => {
            this.setLayoutInProgress(false);
        });
    }

    private createListDropdown(): ContentTypeFilterDropdown {
        const typesListDropdown = new ContentTypeFilterDropdown({
            maxSelected: this.getInput().getOccurrences().getMaximum(),
            loader: this.createLoader(),
            getSelectedItems: () => this.getSelectedItemsIds(),
        });

        typesListDropdown.onSelectionChanged((selectionChange: SelectionChange<ContentTypeSummary>) => {
            selectionChange.selected?.forEach((item: ContentTypeSummary) => {
                this.onContentTypeSelected(item);
            });

            selectionChange.deselected?.forEach((item: ContentTypeSummary) => {
                this.onContentTypeDeselected(item);
            });
        });

        return typesListDropdown;
    }

    private getSelectedItemsIds(): string[] {
        return this.getValueFromPropertyArray(this.getPropertyArray()).split(';');
    }

    update(propertyArray: PropertyArray, unchangedOnly: boolean): Q.Promise<void> {
        let superPromise = super.update(propertyArray, unchangedOnly);

        if (!unchangedOnly || this.getPropertyArray().equals(propertyArray)) {
            return superPromise.then(() => {
                return this.typesListDropdown.updateSelectedItems();
            });
        } else if (!this.getPropertyArray().equals(propertyArray)) {
            this.notifyValueChanged(new ValueChangedEvent(null, -1)); // triggering Save button
        }

        return superPromise;
    }

    reset() {
        //
    }

    setEnabled(enable: boolean): void {
        super.setEnabled(enable);
        this.typesListDropdown.setEnabled(enable);
    }

    protected getNumberOfValids(): number {
        return this.getPropertyArray().getSize();
    }

    giveFocus(): boolean {
        return this.typesListDropdown.maximumOccurrencesReached() ? false : this.typesListDropdown.giveFocus();
    }

    onFocus(listener: (event: FocusEvent) => void) {
        this.typesListDropdown.onFocus(listener);
    }

    unFocus(listener: (event: FocusEvent) => void) {
        this.typesListDropdown.unFocus(listener);
    }

    onBlur(listener: (event: FocusEvent) => void) {
        this.typesListDropdown.onBlur(listener);
    }

    unBlur(listener: (event: FocusEvent) => void) {
        this.typesListDropdown.unBlur(listener);
    }
}

InputTypeManager.register(new Class('ContentTypeFilter', ContentTypeFilter));
