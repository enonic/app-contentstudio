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
import {ContentSummary} from 'lib-admin-ui/content/ContentSummary';
import {CustomSelectorItem} from './CustomSelectorItem';
import {CustomSelectorComboBox, CustomSelectorSelectedOptionsView} from './CustomSelectorComboBox';
import {ContentInputTypeViewContext} from '../ContentInputTypeViewContext';
import {BaseInputTypeManagingAdd} from 'lib-admin-ui/form/inputtype/support/BaseInputTypeManagingAdd';
import {Input} from 'lib-admin-ui/form/Input';
import {ValueTypeConverter} from 'lib-admin-ui/data/ValueTypeConverter';
import {InputTypeManager} from 'lib-admin-ui/form/inputtype/InputTypeManager';
import {Class} from 'lib-admin-ui/Class';
import {UrlAction} from '../../UrlAction';
import {CustomSelectorLoader} from './CustomSelectorLoader';
import {ContentSummaryAndCompareStatus} from '../../content/ContentSummaryAndCompareStatus';
import {ContentServerEventsHandler} from '../../event/ContentServerEventsHandler';
import {ProjectContext} from '../../project/ProjectContext';
import {Branch} from '../../versioning/Branch';

export class CustomSelector
    extends BaseInputTypeManagingAdd {

    public static debug: boolean = false;

    private static portalUrl: string = UriHelper.addSitePrefix(`/${UrlAction.EDIT}/{0}/${Branch.DRAFT}{1}/_/service/`);

    private requestPath: string;

    private content: ContentSummary;

    private comboBox: RichComboBox<CustomSelectorItem>;

    constructor(context: ContentInputTypeViewContext) {
        super('custom-selector');

        if (CustomSelector.debug) {
            console.debug('CustomSelector: config', context.inputConfig);
        }

        this.readConfig(context);
        this.subscribeToContentUpdates();
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

    private readConfig(context: ContentInputTypeViewContext): void {
        const cfg = context.inputConfig;
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

        this.content = context.content;

        if (serviceUrl) {
            this.requestPath = CustomSelector.portalUrl + UriHelper.appendUrlParams(serviceUrl, params);
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

    private getRequestPath(): string {
        const contentPath = this.content.getPath().toString();
        const projectId = ProjectContext.get().getProject().getName();
        return StringHelper.format(this.requestPath, projectId, contentPath);
    }

    private createLoader(): CustomSelectorLoader {
        const loader: CustomSelectorLoader = new CustomSelectorLoader();
        loader.onLoadingData(() => {
            loader.setRequestPath(this.getRequestPath());
        });

        return loader;
    }

    createComboBox(input: Input, propertyArray: PropertyArray): RichComboBox<CustomSelectorItem> {

        const comboBox: CustomSelectorComboBox = <CustomSelectorComboBox>CustomSelectorComboBox.create()
            .setComboBoxName(input.getName())
            .setMaximumOccurrences(input.getOccurrences().getMaximum())
            .setValue(this.getValueFromPropertyArray(propertyArray))
            .setLoader(this.createLoader())
            .build();

        comboBox.onOptionSelected((event: SelectedOptionEvent<CustomSelectorItem>) => {
            this.ignorePropertyChange(true);

            const option = event.getSelectedOption();
            let value = new Value(String(option.getOption().getValue()), ValueTypes.STRING);
            if (option.getIndex() >= 0) {
                this.getPropertyArray().set(option.getIndex(), value);
            } else {
                this.getPropertyArray().add(value);
            }
            this.refreshSortable();

            this.ignorePropertyChange(false);

            this.validate(false);
            this.fireFocusSwitchEvent(event);
        });

        comboBox.onOptionDeselected((event: SelectedOptionEvent<CustomSelectorItem>) => {
            this.ignorePropertyChange(true);

            this.getPropertyArray().remove(event.getSelectedOption().getIndex());

            this.refreshSortable();
            this.ignorePropertyChange(false);
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
