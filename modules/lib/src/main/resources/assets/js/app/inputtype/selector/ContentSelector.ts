import * as Q from 'q';
import {StringHelper} from 'lib-admin-ui/util/StringHelper';
import {ObjectHelper} from 'lib-admin-ui/ObjectHelper';
import {AppHelper} from 'lib-admin-ui/util/AppHelper';
import {ContentId} from 'lib-admin-ui/content/ContentId';
import {DivEl} from 'lib-admin-ui/dom/DivEl';
import {Input} from 'lib-admin-ui/form/Input';
import {InputTypeManager} from 'lib-admin-ui/form/inputtype/InputTypeManager';
import {Class} from 'lib-admin-ui/Class';
import {Property} from 'lib-admin-ui/data/Property';
import {PropertyArray} from 'lib-admin-ui/data/PropertyArray';
import {Value} from 'lib-admin-ui/data/Value';
import {ValueType} from 'lib-admin-ui/data/ValueType';
import {ValueTypes} from 'lib-admin-ui/data/ValueTypes';
import {SelectedOptionEvent} from 'lib-admin-ui/ui/selector/combobox/SelectedOptionEvent';
import {SelectedOption} from 'lib-admin-ui/ui/selector/combobox/SelectedOption';
import {ContentComboBox, ContentSelectedOptionsView, ContentComboBoxBuilder} from '../ui/selector/ContentComboBox';
import {ContentInputTypeManagingAdd} from '../ui/selector/ContentInputTypeManagingAdd';
import {ContentInputTypeViewContext} from '../ContentInputTypeViewContext';
import {ContentSummaryOptionDataLoader, ContentSummaryOptionDataLoaderBuilder} from '../ui/selector/ContentSummaryOptionDataLoader';
import {ContentTreeSelectorItem} from '../../item/ContentTreeSelectorItem';
import {GetContentSummaryByIds} from '../../resource/GetContentSummaryByIds';
import {ContentPath} from 'lib-admin-ui/content/ContentPath';
import {ValueTypeConverter} from 'lib-admin-ui/data/ValueTypeConverter';
import {Reference} from 'lib-admin-ui/util/Reference';
import {NotifyManager} from 'lib-admin-ui/notify/NotifyManager';
import {ContentSummary} from '../../content/ContentSummary';

export class ContentSelector
    extends ContentInputTypeManagingAdd<ContentTreeSelectorItem> {

    protected contentComboBox: ContentComboBox<ContentTreeSelectorItem>;

    protected comboBoxWrapper: DivEl;

    protected treeMode: boolean;

    protected hideToggleIcon: boolean;

    protected static contentIdBatch: ContentId[] = [];

    protected static loadSummariesResult: Q.Deferred<ContentSummary[]>;

    public static debug: boolean = false;

    protected static loadSummaries: () => void = AppHelper.debounce(ContentSelector.doFetchSummaries, 10, false);

    constructor(config?: ContentInputTypeViewContext) {
        super('content-selector', config);
    }

    protected readConfig(inputConfig: { [element: string]: { [name: string]: string }[]; }): void {

        const isTreeModeConfig = inputConfig['treeMode'] ? inputConfig['treeMode'][0] : {};
        this.treeMode = !StringHelper.isBlank(isTreeModeConfig['value']) ? isTreeModeConfig['value'].toLowerCase() === 'true' : false;

        const hideToggleIconConfig = inputConfig['hideToggleIcon'] ? inputConfig['hideToggleIcon'][0] : {};
        this.hideToggleIcon =
            !StringHelper.isBlank(hideToggleIconConfig['value']) ? hideToggleIconConfig['value'].toLowerCase() === 'true' : false;

        super.readConfig(inputConfig);
    }

    protected getDefaultAllowPath(): string {
        return '${site}';
    }

    public getContentComboBox(): ContentComboBox<ContentTreeSelectorItem> {
        return this.contentComboBox;
    }

    protected getSelectedOptionsView(): ContentSelectedOptionsView {
        return <ContentSelectedOptionsView> this.contentComboBox.getSelectedOptionView();
    }

    protected getContentPath(raw: ContentTreeSelectorItem): ContentPath {
        return raw.getPath();
    }

    availableSizeChanged() {
        if (ContentSelector.debug) {
            console.log('Relationship.availableSizeChanged(' + this.getEl().getWidth() + 'x' + this.getEl().getWidth() + ')');
        }
    }

    getValueType(): ValueType {
        return ValueTypes.REFERENCE;
    }

    newInitialValue(): Value {
        return null;
    }

    layout(input: Input, propertyArray: PropertyArray): Q.Promise<void> {
        if (!ValueTypes.REFERENCE.equals(propertyArray.getType())) {
            propertyArray.convertValues(ValueTypes.REFERENCE, ValueTypeConverter.convertTo);
        }
        return super.layout(input, propertyArray).then(() => {
            this.contentComboBox = this.createContentComboBox(input, propertyArray);

            this.comboBoxWrapper = new DivEl('combobox-wrapper');
            this.comboBoxWrapper.appendChild(this.contentComboBox);

            this.appendChild(this.comboBoxWrapper);

            return this.doLayout(propertyArray);

        });
    }

    protected doLayout(propertyArray: PropertyArray): Q.Promise<void> {

        const contentIds: ContentId[] = [];
        propertyArray.forEach((property: Property) => {
            if (property.hasNonNullValue()) {
                let referenceValue = property.getReference();
                if (ObjectHelper.iFrameSafeInstanceOf(referenceValue, Reference)) {
                    contentIds.push(ContentId.fromReference(referenceValue));
                }
            }
        });

        return this.doLoadContent(contentIds).then((contents: ContentSummary[]) => {

            this.setupSortable();

            //TODO: original value doesn't work because of additional request, so have to select manually
            contents.forEach((content: ContentSummary) => {
                this.contentComboBox.select(new ContentTreeSelectorItem(content));
            });

            this.contentComboBox.getSelectedOptions().forEach((selectedOption: SelectedOption<ContentTreeSelectorItem>) => {
                this.updateSelectedOptionIsEditable(selectedOption);
            });

            this.setLayoutInProgress(false);
        });
    }

    protected createOptionDataLoaderBuilder(): ContentSummaryOptionDataLoaderBuilder {
        return ContentSummaryOptionDataLoader.create()
            .setAllowedContentPaths(this.allowedContentPaths)
            .setContentTypeNames(this.allowedContentTypes)
            .setRelationshipType(this.relationshipType)
            .setContent(this.config.content);
    }

    protected doCreateContentComboBoxBuilder(): ContentComboBoxBuilder<ContentTreeSelectorItem> {
        return ContentComboBox.create();
    }

    protected createOptionDataLoader(): ContentSummaryOptionDataLoader<ContentTreeSelectorItem> {
        return this.createOptionDataLoaderBuilder().build();
    }

    protected createContentComboBoxBuilder(input: Input, propertyArray: PropertyArray): ContentComboBoxBuilder<ContentTreeSelectorItem> {
        const optionDataLoader = this.createOptionDataLoader();
        const comboboxValue = this.getValueFromPropertyArray(propertyArray);

        return this.doCreateContentComboBoxBuilder()
                .setComboBoxName(input.getName())
                .setLoader(optionDataLoader)
                .setMaximumOccurrences(input.getOccurrences().getMaximum())
                .setRemoveMissingSelectedOptions(true)
                .setTreegridDropdownEnabled(this.treeMode)
                .setTreeModeTogglerAllowed(!this.hideToggleIcon)
                .setValue(comboboxValue);
    }

    protected doCreateContentComboBox(input: Input, propertyArray: PropertyArray): ContentComboBox<ContentTreeSelectorItem> {
        return this.createContentComboBoxBuilder(input, propertyArray).build();
    }

    protected initEvents(contentComboBox: ContentComboBox<ContentTreeSelectorItem>) {

        contentComboBox.getComboBox().onContentMissing((ids: string[]) => {
            ids.forEach(id => this.removePropertyWithId(id));
            this.validate(false);
        });

        contentComboBox.onOptionSelected((event: SelectedOptionEvent<ContentTreeSelectorItem>) => {
            this.fireFocusSwitchEvent(event);

            const contentId: ContentId = event.getSelectedOption().getOption().getDisplayValue().getContentId();

            if (contentId) {
                this.setContentIdProperty(contentId);

                this.updateSelectedOptionIsEditable(event.getSelectedOption());
                this.getSelectedOptionsView().refreshSortable();
                this.updateSelectedOptionStyle();
                this.validate(false);
            }

        });

        contentComboBox.onOptionDeselected((event: SelectedOptionEvent<ContentTreeSelectorItem>) => {

            this.handleDeselected(event.getSelectedOption().getIndex());
            this.updateSelectedOptionStyle();
            this.validate(false);
        });

        contentComboBox.onOptionMoved(this.handleMoved.bind(this));
    }

    protected createContentComboBox(input: Input, propertyArray: PropertyArray): ContentComboBox<ContentTreeSelectorItem> {
        const contentComboBox = this.doCreateContentComboBox(input, propertyArray);

        this.initEvents(contentComboBox);

        return contentComboBox;
    }

    protected removePropertyWithId(id: string) {
        let length = this.getPropertyArray().getSize();
        for (let i = 0; i < length; i++) {
            if (this.getPropertyArray().get(i).getValue().getString() === id) {
                this.getPropertyArray().remove(i);
                NotifyManager.get().showWarning('Failed to load content item with id ' + id +
                                                '. The reference will be removed upon save.');
                break;
            }
        }
    }

    update(propertyArray: PropertyArray, unchangedOnly: boolean): Q.Promise<void> {
        if (ContentSelector.debug) {
            console.log('update(' + propertyArray.toJson() + ')');
        }
        return super.update(propertyArray, unchangedOnly).then(() => {
            /*let value = this.getValueFromPropertyArray(propertyArray);
            this.contentComboBox.setValue(value);*/

            if (!unchangedOnly || !this.contentComboBox.isDirty() && this.contentComboBox.isRendered()) {
                let value = this.getValueFromPropertyArray(propertyArray);
                this.contentComboBox.setValue(value);
            } else if (this.contentComboBox.isDirty()) {
                this.resetPropertyValues();
            }
        });
    }

    reset() {
        this.contentComboBox.resetBaseValues();
    }

    setEnabled(enable: boolean): void {
        super.setEnabled(enable);
        this.contentComboBox.setEnabled(enable);
    }

    private isResetRequired(): boolean {
        const values = this.contentComboBox.getSelectedDisplayValues();
        if (this.getPropertyArray().getSize() !== values.length) {
            return true;
        }

        return !values.every((value: ContentTreeSelectorItem, index: number) => {
            const property = this.getPropertyArray().get(index);
            return property?.getString() === value.getId();
        });
    }

    resetPropertyValues() {
        if (ContentSelector.debug) {
            console.log('resetPropertyValues()');
        }
        if (!this.isResetRequired()) {
            return;
        }
        const values = this.contentComboBox.getSelectedDisplayValues();

        this.ignorePropertyChange(true);

        this.getPropertyArray().removeAll(true);
        values.forEach(value => this.contentComboBox.deselect(value, true));
        values.forEach(value => this.contentComboBox.select(value));

        this.ignorePropertyChange(false);
    }

    private static doFetchSummaries() {
        new GetContentSummaryByIds(ContentSelector.contentIdBatch).sendAndParse().then(
            (result: ContentSummary[]) => {

                ContentSelector.contentIdBatch = []; // empty batch of ids after loading

                ContentSelector.loadSummariesResult.resolve(result);

                ContentSelector.loadSummariesResult = null; // empty loading result after resolving
            });
    }

    protected doLoadContent(contentIds: ContentId[]): Q.Promise<ContentSummary[]> {

        ContentSelector.contentIdBatch = ContentSelector.contentIdBatch.concat(contentIds);

        if (!ContentSelector.loadSummariesResult) {
            ContentSelector.loadSummariesResult = Q.defer<ContentSummary[]>();
        }

        ContentSelector.loadSummaries();

        return ContentSelector.loadSummariesResult.promise.then((result: ContentSummary[]) => {
            let contentIdsStr = contentIds.map(id => id.toString());
            return result.filter(content => contentIdsStr.indexOf(content.getId()) >= 0);
        });
    }

    protected setContentIdProperty(contentId: ContentId) {
        let reference = Reference.from(contentId);

        let value = new Value(reference, ValueTypes.REFERENCE);

        if (!this.getPropertyArray().containsValue(value)) {
            this.ignorePropertyChange(true);
            if (this.contentComboBox.countSelected() === 1) { // overwrite initial value
                this.getPropertyArray().set(0, value);
            } else {
                this.getPropertyArray().add(value);
            }
            this.ignorePropertyChange(false);
        }
    }

    protected setupSortable() {
        this.getSelectedOptionsView().setOccurrencesSortable(true);
        this.updateSelectedOptionStyle();
    }

    protected handleMoved(moved: SelectedOption<ContentTreeSelectorItem>, fromIndex: number) {
        this.ignorePropertyChange(true);
        this.getPropertyArray().move(fromIndex, moved.getIndex());
        this.ignorePropertyChange(false);
    }

    protected handleDeselected(index: number) {
        this.ignorePropertyChange(true);
        this.getPropertyArray().remove(index);
        this.ignorePropertyChange(false);
    }

    protected updateSelectedOptionStyle() {
        if (this.getPropertyArray().getSize() > 1) {
            this.addClass('multiple-occurrence').removeClass('single-occurrence');
        } else {
            this.addClass('single-occurrence').removeClass('multiple-occurrence');
        }
    }

    protected updateSelectedOptionIsEditable(selectedOption: SelectedOption<ContentTreeSelectorItem>) {
        let selectedContentId = selectedOption.getOption().getDisplayValue().getContentId();
        let refersToItself = selectedContentId.toString() === this.config.content.getId();
        selectedOption.getOptionView().toggleClass('non-editable', refersToItself);
    }

    protected getNumberOfValids(): number {
        return this.getPropertyArray().getSize();
    }

    giveFocus(): boolean {
        if (this.contentComboBox.maximumOccurrencesReached()) {
            return false;
        }
        return this.contentComboBox.giveFocus();
    }

    onFocus(listener: (event: FocusEvent) => void) {
        this.contentComboBox.onFocus(listener);
    }

    unFocus(listener: (event: FocusEvent) => void) {
        this.contentComboBox.unFocus(listener);
    }

    onBlur(listener: (event: FocusEvent) => void) {
        this.contentComboBox.onBlur(listener);
    }

    unBlur(listener: (event: FocusEvent) => void) {
        this.contentComboBox.unBlur(listener);
    }

}

InputTypeManager.register(new Class('ContentSelector', ContentSelector));
