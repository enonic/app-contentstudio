import * as Q from 'q';
import {StringHelper} from '@enonic/lib-admin-ui/util/StringHelper';
import {PropertyArray} from '@enonic/lib-admin-ui/data/PropertyArray';
import {Value} from '@enonic/lib-admin-ui/data/Value';
import {ValueType} from '@enonic/lib-admin-ui/data/ValueType';
import {ValueTypes} from '@enonic/lib-admin-ui/data/ValueTypes';
import {UriHelper} from '@enonic/lib-admin-ui/util/UriHelper';
import {SelectedOption} from '@enonic/lib-admin-ui/ui/selector/combobox/SelectedOption';
import {CustomSelectorItem} from './CustomSelectorItem';
import {CustomSelectorComboBox, CustomSelectorSelectedOptionsView} from './CustomSelectorComboBox';
import {ContentInputTypeViewContext} from '../ContentInputTypeViewContext';
import {BaseInputTypeManagingAdd} from '@enonic/lib-admin-ui/form/inputtype/support/BaseInputTypeManagingAdd';
import {Input} from '@enonic/lib-admin-ui/form/Input';
import {ValueTypeConverter} from '@enonic/lib-admin-ui/data/ValueTypeConverter';
import {InputTypeManager} from '@enonic/lib-admin-ui/form/inputtype/InputTypeManager';
import {Class} from '@enonic/lib-admin-ui/Class';
import {UrlAction} from '../../UrlAction';
import {ContentSummaryAndCompareStatus} from '../../content/ContentSummaryAndCompareStatus';
import {ContentServerEventsHandler} from '../../event/ContentServerEventsHandler';
import {ProjectContext} from '../../project/ProjectContext';
import {Branch} from '../../versioning/Branch';
import {ContentSummary} from '../../content/ContentSummary';
import {SelectionChange} from '@enonic/lib-admin-ui/util/SelectionChange';
import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';

export class CustomSelector
    extends BaseInputTypeManagingAdd {

    public static debug: boolean = false;

    protected context: ContentInputTypeViewContext;

    private requestPath: string;

    private content?: ContentSummary;

    private comboBox: CustomSelectorComboBox;

    private initiallySelectedItems: string[];

    private static serviceUrlPrefix: string;

    constructor(context: ContentInputTypeViewContext) {
        super(context, 'custom-selector');

        if (CustomSelector.debug) {
            console.debug('CustomSelector: config', context.inputConfig);
        }

        if (this.content) {
            this.subscribeToContentUpdates();
        }
    }

    private subscribeToContentUpdates() {
        const handler = (data: ContentSummaryAndCompareStatus[]) => this.handleContentUpdated(data);

        ContentServerEventsHandler.getInstance().onContentUpdated(handler);
        ContentServerEventsHandler.getInstance().onContentRenamed(handler);
    }

    private handleContentUpdated(data: ContentSummaryAndCompareStatus[]) {

        const modifiedData = data.find((content: ContentSummaryAndCompareStatus) => content.getId() === this.content.getId());

        if (modifiedData) {
            this.content = modifiedData.getContentSummary();
        }
    }

    protected readInputConfig(): void {
        const cfg = this.context.inputConfig;
        const serviceCfg = cfg['service'];
        let serviceUrl;
        if (serviceCfg) {
            serviceUrl = serviceCfg[0] ? serviceCfg[0]['value'] : undefined;
        }
        const serviceParams = cfg['param'] || [];

        const params = serviceParams.reduce((prev, curr) => {
            prev[curr['@value']] = curr['value'];
            return prev;
        }, {});

        this.content = this.context.content;

        if (serviceUrl) {
            this.requestPath = `${CustomSelector.getServiceUrlPrefix()}/${UriHelper.appendUrlParams(serviceUrl, params)}`;
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

        return super.layout(input, propertyArray).then(() => {
            this.initiallySelectedItems = this.getSelectedItemsIds();
            this.comboBox = this.createComboBox(input, propertyArray);
            this.appendChild(this.comboBox);

            this.setupSortable();
            this.setLayoutInProgress(false);

            return Q<void>(null);
        });
    }

    update(propertyArray: PropertyArray, unchangedOnly?: boolean): Q.Promise<void> {
        const isDirty = this.isDirty();

        return super.update(propertyArray, unchangedOnly).then(() => {
            this.initiallySelectedItems = this.getSelectedItemsIds();

            if (!unchangedOnly || !isDirty) {
                this.comboBox.setSelectedItems(this.initiallySelectedItems);
            }
        });
    }

    reset() {
        // value is not set yet if not rendered, resetting will overwrite original value with empty value
    }

    private getRequestPath(): string {
        const contentId: string = `/${this.content?.getId() || 'undefined'}`;
        const projectId: string = this.context.project?.getName() || ProjectContext.get().getProject().getName();
        return StringHelper.format(this.requestPath, projectId, contentId);
    }

    private isDirty(): boolean {
        return !ObjectHelper.stringArrayEquals(this.initiallySelectedItems, this.getSelectedItemsIds());
    }

    private createComboBox(input: Input, propertyArray: PropertyArray): CustomSelectorComboBox {
        const comboBox: CustomSelectorComboBox = new CustomSelectorComboBox({
            maxSelected: input.getOccurrences().getMaximum(),
        });

        comboBox.getLoader().setRequestPath(this.getRequestPath());
        comboBox.setSelectedItems(this.initiallySelectedItems);

        comboBox.onSelectionChanged((selectionChange: SelectionChange<CustomSelectorItem>) => {
            this.ignorePropertyChange(true);

            selectionChange.selected?.forEach((item: CustomSelectorItem) => {
                const value = new Value(item.getId().toString(), ValueTypes.STRING);

                if (this.comboBox.countSelected() === 1) { // overwrite initial value
                    this.getPropertyArray().set(0, value);
                } else {
                    this.getPropertyArray().add(value);
                }
            });

            selectionChange.deselected?.forEach((item: CustomSelectorItem) => {
                const property = this.getPropertyArray().getProperties().find((property) => {
                    const propertyValue = property.hasNonNullValue() ? property.getString() : '';
                    return propertyValue === item.getId().toString();
                });

                if (property) {
                    this.getPropertyArray().remove(property.getIndex());
                }

            });

            this.refreshSortable();
            this.ignorePropertyChange(false);
            this.handleValueChanged(false);
            this.validate(false);
        });

        comboBox.onOptionMoved((moved: SelectedOption<CustomSelectorItem>, fromIndex: number) => this.handleMove(moved, fromIndex));

        return comboBox;
    }

    private getSelectedItemsIds(): string[] {
        return this.getValueFromPropertyArray(this.getPropertyArray()).split(';').filter((id) => !StringHelper.isBlank(id));
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

    private handleMove(moved: SelectedOption<CustomSelectorItem>, fromIndex: number) {
        this.getPropertyArray().move(fromIndex, moved.getIndex());
    }

    private refreshSortable() {
        this.updateSelectedOptionStyle();
        this.getSelectedOptionsView().refreshSortable();
    }

    private getSelectedOptionsView(): CustomSelectorSelectedOptionsView {
        this.updateSelectedOptionStyle();
        return this.comboBox.getSelectedOptionView();
    }

    private updateSelectedOptionStyle() {
        if (this.getPropertyArray().getSize() > 1) {
            this.addClass('multiple-occurrence').removeClass('single-occurrence');
        } else {
            this.addClass('single-occurrence').removeClass('multiple-occurrence');
        }
    }

    static getServiceUrlPrefix(): string {
        if (!CustomSelector.serviceUrlPrefix) {
            CustomSelector.serviceUrlPrefix = UriHelper.addSitePrefix(`/${UrlAction.EDIT}/{0}/${Branch.DRAFT}{1}/_/service`);
        }

        return CustomSelector.serviceUrlPrefix;
    }
}

InputTypeManager.register(new Class('CustomSelector', CustomSelector));
