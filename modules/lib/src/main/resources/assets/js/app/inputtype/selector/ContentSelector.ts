import * as Q from 'q';
import {StringHelper} from '@enonic/lib-admin-ui/util/StringHelper';
import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';
import {AppHelper} from '@enonic/lib-admin-ui/util/AppHelper';
import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {Input} from '@enonic/lib-admin-ui/form/Input';
import {InputTypeManager} from '@enonic/lib-admin-ui/form/inputtype/InputTypeManager';
import {Class} from '@enonic/lib-admin-ui/Class';
import {Property} from '@enonic/lib-admin-ui/data/Property';
import {PropertyArray} from '@enonic/lib-admin-ui/data/PropertyArray';
import {Value} from '@enonic/lib-admin-ui/data/Value';
import {ValueType} from '@enonic/lib-admin-ui/data/ValueType';
import {ValueTypes} from '@enonic/lib-admin-ui/data/ValueTypes';
import {SelectedOptionEvent} from '@enonic/lib-admin-ui/ui/selector/combobox/SelectedOptionEvent';
import {SelectedOption} from '@enonic/lib-admin-ui/ui/selector/combobox/SelectedOption';
import {ContentComboBox, ContentComboBoxBuilder, ContentSelectedOptionsView} from '../ui/selector/ContentComboBox';
import {ContentInputTypeManagingAdd} from '../ui/selector/ContentInputTypeManagingAdd';
import {ContentInputTypeViewContext} from '../ContentInputTypeViewContext';
import {ContentSummaryOptionDataLoader, ContentSummaryOptionDataLoaderBuilder} from '../ui/selector/ContentSummaryOptionDataLoader';
import {ContentTreeSelectorItem} from '../../item/ContentTreeSelectorItem';
import {ValueTypeConverter} from '@enonic/lib-admin-ui/data/ValueTypeConverter';
import {Reference} from '@enonic/lib-admin-ui/util/Reference';
import {NotifyManager} from '@enonic/lib-admin-ui/notify/NotifyManager';
import {ContentSummary} from '../../content/ContentSummary';
import {ContentId} from '../../content/ContentId';
import {ContentPath} from '../../content/ContentPath';
import {ContentServerEventsHandler} from '../../event/ContentServerEventsHandler';
import {ContentSummaryAndCompareStatus} from '../../content/ContentSummaryAndCompareStatus';
import {GetContentTypeByNameRequest} from '../../resource/GetContentTypeByNameRequest';
import {ContentType} from '../schema/ContentType';
import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';
import {NewContentButton} from './ui/NewContentButton';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {ContentAndStatusTreeSelectorItem} from '../../item/ContentAndStatusTreeSelectorItem';
import {ContentSummaryAndCompareStatusFetcher} from '../../resource/ContentSummaryAndCompareStatusFetcher';
import {CompareStatus} from '../../content/CompareStatus';
import {MovedContentItem} from '../../browse/MovedContentItem';
import {ContentServerChangeItem} from '../../event/ContentServerChangeItem';

export class ContentSelector
    extends ContentInputTypeManagingAdd<ContentTreeSelectorItem> {

    protected contentComboBox: ContentComboBox<ContentTreeSelectorItem>;

    protected comboBoxWrapper: DivEl;

    protected newContentButton: NewContentButton;

    protected treeMode: boolean;

    protected hideToggleIcon: boolean;

    protected contentDeletedListener: (paths: ContentServerChangeItem[], pending?: boolean) => void;

    protected static contentIdBatch: ContentId[] = [];

    protected static loadSummariesResult: Q.Deferred<ContentSummaryAndCompareStatus[]>;

    public static debug: boolean = false;

    protected static loadSummaries: () => void = AppHelper.debounce(ContentSelector.doFetchSummaries, 10, false);

    constructor(config: ContentInputTypeViewContext) {
        super(config, 'content-selector');
        this.initEventsListeners();
    }

    protected initEventsListeners() {
        const contentId: string = this.context.content?.getId();

        if (!contentId) {
            return;
        }

        ContentServerEventsHandler.getInstance().onContentRenamed((data: ContentSummaryAndCompareStatus[]) => {
            const isCurrentContentRenamed: boolean = data.some((item: ContentSummaryAndCompareStatus) => item.getId() === contentId);

            if (isCurrentContentRenamed) {
                this.handleContentRenamed();
            }
        });

        this.handleContentDeletedEvent();
        this.handleContentUpdatedEvent();
    }

    protected handleContentRenamed() {
        const selectedIds: ContentId[] = this.getSelectedOptions().map(
            (option: SelectedOption<ContentTreeSelectorItem>) => option.getOption().getDisplayValue().getContentId());

        this.doLoadContent(selectedIds).then((contents: ContentSummaryAndCompareStatus[]) => {
            this.contentComboBox.clearSelection(true, false);

            contents.forEach((content: ContentSummaryAndCompareStatus) => {
                this.contentComboBox.select(this.createSelectorItem(content));
            });
        });
    }

    private handleContentUpdatedEvent() {
        const contentUpdatedListener = (statuses: ContentSummaryAndCompareStatus[], oldPaths?: ContentPath[]) => {
            if (this.getSelectedOptions().length === 0) {
                return;
            }

            statuses.forEach((status: ContentSummaryAndCompareStatus, index: number) => {
                let selectedOption: SelectedOption<ContentTreeSelectorItem>;

                if (oldPaths) {
                    selectedOption = this.findSelectedOptionByContentPath(oldPaths[index]);
                } else {
                    selectedOption = this.getSelectedOptionsView().getById(status.getContentId().toString());
                }
                if (selectedOption) {
                    this.getContentComboBox().updateOption(selectedOption.getOption(), status);
                }
            });
        };

        const contentMovedListener = (movedItems: MovedContentItem[]) => {
            if (this.getSelectedOptions().length === 0) {
                return;
            }

            movedItems.forEach((movedItem: MovedContentItem) => {
                const selectedOption: SelectedOption<ContentTreeSelectorItem> = this.findSelectedOptionByContentPath(movedItem.oldPath);

                if (selectedOption) {
                    this.getContentComboBox().updateOption(selectedOption.getOption(), movedItem.item);
                }
            });
        };

        const handler: ContentServerEventsHandler = ContentServerEventsHandler.getInstance();
        handler.onContentMoved(contentMovedListener);
        handler.onContentRenamed(contentUpdatedListener);
        handler.onContentUpdated(contentUpdatedListener);

        this.onRemoved(() => {
            handler.unContentUpdated(contentUpdatedListener);
            handler.unContentRenamed(contentUpdatedListener);
            handler.unContentMoved(contentMovedListener);
        });
    }

    private findSelectedOptionByContentPath(contentPath: ContentPath): SelectedOption<ContentTreeSelectorItem> {
        const selectedOptions = this.getSelectedOptions();
        for (const selectedOption of selectedOptions) {
            if (contentPath.equals(this.getContentPath(selectedOption.getOption().getDisplayValue()))) {
                return selectedOption;
            }
        }
        return null;
    }

    private handleContentDeletedEvent() {
        this.contentDeletedListener = (paths: ContentServerChangeItem[], pending?: boolean) => {
            if (this.getSelectedOptions().length === 0) {
                return;
            }

            let selectedContentIdsMap: {} = {};
            this.getSelectedOptions().forEach((selectedOption: SelectedOption<ContentTreeSelectorItem>) => {
                if (selectedOption.getOption().getDisplayValue()?.getContentId()) {
                    selectedContentIdsMap[selectedOption.getOption().getDisplayValue().getContentId().toString()] = '';
                }
            });

            paths.filter(deletedItem => !pending && selectedContentIdsMap.hasOwnProperty(deletedItem.getContentId().toString()))
                .forEach((deletedItem) => {
                    let option = this.getSelectedOptionsView().getById(deletedItem.getContentId().toString());
                    if (option != null) {
                        this.getSelectedOptionsView().removeOption(option.getOption(), false);
                    }
                });
        };

        let handler = ContentServerEventsHandler.getInstance();
        handler.onContentDeleted(this.contentDeletedListener);

        this.onRemoved(() => {
            handler.unContentDeleted(this.contentDeletedListener);
        });
    }

    protected createSelectorItem(content: ContentSummary | ContentSummaryAndCompareStatus): ContentTreeSelectorItem {
        if (content instanceof  ContentSummaryAndCompareStatus) {
            return new ContentAndStatusTreeSelectorItem(content);
        }

        return new ContentTreeSelectorItem(content);
    }

    protected readInputConfig(): void {
        const inputConfig: Record<string, Record<string, string>[]> = this.context.inputConfig;
        const isTreeModeConfig = inputConfig['treeMode'] ? inputConfig['treeMode'][0] : {};
        this.treeMode = !StringHelper.isBlank(isTreeModeConfig['value']) ? isTreeModeConfig['value'].toLowerCase() === 'true' : false;

        const hideToggleIconConfig = inputConfig['hideToggleIcon'] ? inputConfig['hideToggleIcon'][0] : {};
        this.hideToggleIcon =
            !StringHelper.isBlank(hideToggleIconConfig['value']) ? hideToggleIconConfig['value'].toLowerCase() === 'true' : false;

        super.readInputConfig();
    }

    protected getDefaultAllowPath(): string {
        return '${site}';
    }

    public getContentComboBox(): ContentComboBox<ContentTreeSelectorItem> {
        return this.contentComboBox;
    }

    protected getSelectedOptionsView(): ContentSelectedOptionsView {
        return this.contentComboBox.getSelectedOptionView() as ContentSelectedOptionsView;
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
            this.addContentComboBox(input, propertyArray);
            return this.addExtraElementsOnLayout(input, propertyArray).then(() => this.doLayout(propertyArray));
        });
    }

    private addContentComboBox(input: Input, propertyArray: PropertyArray): void {
        this.contentComboBox = this.createContentComboBox(input, propertyArray);
        this.comboBoxWrapper = new DivEl('combobox-wrapper');
        this.comboBoxWrapper.appendChild(this.contentComboBox);
        this.appendChild(this.comboBoxWrapper);
    }

    protected addExtraElementsOnLayout(input: Input, propertyArray: PropertyArray): Q.Promise<void> {
        return this.isNewButtonToBeAdded().then((isNewButtonToBeAdded: boolean) => {
            if (isNewButtonToBeAdded) {
                this.addNewContentButton();
            }

            return Q.resolve();
        }).catch(DefaultErrorHandler.handle);
    }

    private isNewButtonToBeAdded(): Q.Promise<boolean> {
        if (!this.context.content) {
            return Q.resolve(true);
        }

        return new GetContentTypeByNameRequest(this.context.content.getType()).sendAndParse().then((contentType: ContentType) => {
            return Q.resolve(contentType.isAllowChildContent());
        });
    }

    private addNewContentButton(): void {
        this.comboBoxWrapper.addClass('new-content');

        this.newContentButton = new NewContentButton(
            {content: this.context.content, allowedContentTypes: this.allowedContentTypes, project: this.context.project});
        this.newContentButton.setTitle(i18n('action.addNew'));
        this.newContentButton.onContentAdded((content: ContentSummary) =>  {
            const item = ContentSummaryAndCompareStatus.fromContentAndCompareStatus(content, CompareStatus.NEW);
            this.contentComboBox.select(this.createSelectorItem(item));
        });

        this.comboBoxWrapper.appendChild(this.newContentButton);
    }

    protected doLayout(propertyArray: PropertyArray): Q.Promise<void> {
        const contentIds: ContentId[] = [];

        propertyArray.forEach((property: Property) => {
            if (property.hasNonNullValue()) {
                const referenceValue: Reference = property.getReference();

                if (ObjectHelper.iFrameSafeInstanceOf(referenceValue, Reference)) {
                    contentIds.push(ContentId.fromReference(referenceValue));
                }
            }
        });

        return this.doLoadContent(contentIds).then((contents: ContentSummaryAndCompareStatus[]) => {
            this.setupSortable();

            //TODO: original value doesn't work because of additional request, so have to select manually
            contents.forEach((content: ContentSummaryAndCompareStatus) => {
                this.contentComboBox.select(new ContentAndStatusTreeSelectorItem(content));
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
            .setContent(this.context.content)
            .setProject(this.context.project)
            .setApplicationKey(this.context.applicationKey);
    }

    protected doCreateContentComboBoxBuilder(): ContentComboBoxBuilder<ContentTreeSelectorItem> {
        return ContentComboBox.create().setProject(this.context.project);
    }

    protected createOptionDataLoader(): ContentSummaryOptionDataLoader<ContentTreeSelectorItem> {
        return this.createOptionDataLoaderBuilder().build();
    }

    protected createContentComboBoxBuilder(input: Input, propertyArray: PropertyArray): ContentComboBoxBuilder<ContentTreeSelectorItem> {
        const optionDataLoader: ContentSummaryOptionDataLoader<ContentTreeSelectorItem> = this.createOptionDataLoader();
        const comboboxValue: string = this.getValueFromPropertyArray(propertyArray);

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
            this.handleValueChanged(false);
        });

        contentComboBox.onOptionSelected((event: SelectedOptionEvent<ContentTreeSelectorItem>) => {
            this.fireFocusSwitchEvent(event);
            this.updateNewContentButton();

            const contentId: ContentId = event.getSelectedOption().getOption().getDisplayValue().getContentId();

            if (contentId) {
                this.setContentIdProperty(contentId);

                this.updateSelectedOptionIsEditable(event.getSelectedOption());
                this.getSelectedOptionsView().refreshSortable();
                this.updateSelectedOptionStyle();
                this.handleValueChanged(false);
                this.contentComboBox.getComboBox().setIgnoreNextFocus(true);
            }

        });

        contentComboBox.onOptionDeselected((event: SelectedOptionEvent<ContentTreeSelectorItem>) => {
            this.handleDeselected(event.getSelectedOption().getIndex());
            this.updateSelectedOptionStyle();
            this.updateNewContentButton();
            this.handleValueChanged(false);
        });

        contentComboBox.onOptionMoved(this.handleMoved.bind(this));

        contentComboBox.onValueLoaded(() => {
            this.updateNewContentButton();
        });
    }

    protected createContentComboBox(input: Input, propertyArray: PropertyArray): ContentComboBox<ContentTreeSelectorItem> {
        const contentComboBox: ContentComboBox<ContentTreeSelectorItem> = this.doCreateContentComboBox(input, propertyArray);

        this.initEvents(contentComboBox);

        return contentComboBox;
    }

    protected removePropertyWithId(id: string) {
        const length: number = this.getPropertyArray().getSize();

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
            console.log('update(' + JSON.stringify(propertyArray.toJson()) + ')');
        }

        return super.update(propertyArray, unchangedOnly).then(() => {
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

    clear() {
        this.contentComboBox.clearCombobox();
    }

    setEnabled(enable: boolean): void {
        super.setEnabled(enable);
        this.contentComboBox.setEnabled(enable);
    }

    private isResetRequired(): boolean {
        const values: ContentTreeSelectorItem[] = this.contentComboBox.getSelectedDisplayValues();

        if (this.getPropertyArray().getSize() !== values.length) {
            return true;
        }

        return !values.every((value: ContentTreeSelectorItem, index: number) => {
            const property: Property = this.getPropertyArray().get(index);
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

        const values: ContentTreeSelectorItem[] = this.contentComboBox.getSelectedDisplayValues();

        this.ignorePropertyChange(true);

        this.getPropertyArray().removeAll(true);
        values.forEach(value => this.contentComboBox.deselect(value, true));
        values.forEach(value => this.contentComboBox.select(value));

        this.ignorePropertyChange(false);
    }

    private static doFetchSummaries() {
        new ContentSummaryAndCompareStatusFetcher().fetchByIds(ContentSelector.contentIdBatch).then(
            (result: ContentSummaryAndCompareStatus[]) => {

                ContentSelector.contentIdBatch = []; // empty batch of ids after loading

                ContentSelector.loadSummariesResult.resolve(result);

                ContentSelector.loadSummariesResult = null; // empty loading result after resolving
            });
    }

    protected doLoadContent(contentIds: ContentId[]): Q.Promise<ContentSummaryAndCompareStatus[]> {
        ContentSelector.contentIdBatch = ContentSelector.contentIdBatch.concat(contentIds);

        if (!ContentSelector.loadSummariesResult) {
            ContentSelector.loadSummariesResult = Q.defer<ContentSummaryAndCompareStatus[]>();
        }

        ContentSelector.loadSummaries();

        return ContentSelector.loadSummariesResult.promise.then((result: ContentSummaryAndCompareStatus[]) => {
            const contentIdsStr: string[] = contentIds.map((id: ContentId) => id.toString());
            return result.filter(content => contentIdsStr.indexOf(content.getId()) >= 0);
        });
    }

    protected setContentIdProperty(contentId: ContentId) {
        const reference: Reference = new Reference(contentId.toString());
        const value: Value = new Value(reference, ValueTypes.REFERENCE);

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
        const selectedContentId: ContentId = selectedOption.getOption().getDisplayValue().getContentId();
        const refersToItself: boolean = selectedContentId.toString() === this.context.content?.getId();
        selectedOption.getOptionView().toggleClass('non-editable', refersToItself);
    }

    protected getNumberOfValids(): number {
        return this.getPropertyArray().getSize();
    }

    private updateNewContentButton(): void {
        this.newContentButton?.setVisible(!this.contentComboBox.maximumOccurrencesReached());
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
