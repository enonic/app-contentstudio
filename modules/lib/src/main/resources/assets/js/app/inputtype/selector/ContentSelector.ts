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
import {ContentSummary, ContentSummaryBuilder} from '../../content/ContentSummary';
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

    protected static loadSummariesResult: Q.Deferred<ContentSummaryAndCompareStatus[]> = Q.defer<ContentSummaryAndCompareStatus[]>();

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

        ContentServerEventsHandler.getInstance().onContentRenamed((data: ContentSummaryAndCompareStatus[], oldPaths: ContentPath[]) => {
            data.forEach((renamed: ContentSummaryAndCompareStatus, index: number) => {
                this.updateSelectedItemsPathsIfParentRenamed(renamed, oldPaths[index]);
            });
        });

        this.handleContentDeletedEvent();
        this.handleContentUpdatedEvent();
    }

    private updateSelectedItemsPathsIfParentRenamed(renamedContent: ContentSummaryAndCompareStatus, renamedItemOldPath: ContentPath): void {
        this.getSelectedOptions().forEach((selectedOption: SelectedOption<ContentTreeSelectorItem>) => {
            const selectedOptionPath = selectedOption.getOption().getDisplayValue().getPath();

            if (selectedOptionPath?.isDescendantOf(renamedItemOldPath)) {
                this.updatePathForRenamedItemDescendant(selectedOption, renamedItemOldPath, renamedContent);
            }
        });
    }

    private updatePathForRenamedItemDescendant(selectedOption: SelectedOption<ContentTreeSelectorItem>, renamedItemOldPath: ContentPath,
                                               renamedAncestor: ContentSummaryAndCompareStatus) {
        const selectedOptionPath = selectedOption.getOption().getDisplayValue().getPath();
        const option = selectedOption.getOption();
        const newPath = this.makeNewPathForRenamedItemDescendant(selectedOptionPath, renamedItemOldPath, renamedAncestor);
        const newValue = this.makeNewItemWithUpdatedPath(option.getDisplayValue(), newPath);
        option.setDisplayValue(newValue);
        selectedOption.getOptionView().removeClass(ContentComboBox.NOT_FOUND_CLASS);
        selectedOption.getOptionView().setOption(option);
    }

    protected makeNewPathForRenamedItemDescendant(descendantItemPath: ContentPath, renamedItemOldPath: ContentPath,
                                                  renamedItem: ContentSummaryAndCompareStatus): ContentPath {
        const descendantItemPathAsString = descendantItemPath.toString();
        const renamedItemOldPathAsString = renamedItemOldPath.toString();
        const newSelectedOptionPathAsString = descendantItemPathAsString.replace(renamedItemOldPathAsString,
            renamedItem.getPath().toString());
        return ContentPath.create().fromString(newSelectedOptionPathAsString).build();
    }

    private makeNewItemWithUpdatedPath(oldValue: ContentTreeSelectorItem, newPath: ContentPath): ContentTreeSelectorItem {
        const content = oldValue.getContent();
        const newContentSummary = new ContentSummaryBuilder(content).setPath(newPath).build();
        const wrappedContent = this.wrapRenamedContentSummary(newContentSummary, oldValue);

        return this.createSelectorItem(wrappedContent, oldValue?.isSelectable(), oldValue?.isExpandable());
    }

    protected wrapRenamedContentSummary(newContentSummary: ContentSummary,
                                        oldValue: ContentTreeSelectorItem): ContentSummary | ContentSummaryAndCompareStatus {
        if (oldValue instanceof ContentAndStatusTreeSelectorItem) {
            return ContentSummaryAndCompareStatus.fromContentAndCompareAndPublishStatus(newContentSummary, oldValue.getCompareStatus(),
                oldValue.getPublishStatus());
        }

        return newContentSummary;
    }

    private handleContentUpdatedEvent(): void {
        const contentUpdatedListener = this.handleContentUpdated.bind(this);
        const contentMovedListener = this.handleContentMoved.bind(this);

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

            const optionsUpdated: SelectedOption<ContentTreeSelectorItem>[] = [];
            const selectedContentIds: string[] = [];

            this.getSelectedOptions().forEach((selectedOption: SelectedOption<ContentTreeSelectorItem>) => {
                const selectedOptionContentId = selectedOption.getOption().getDisplayValue()?.getContentId();
                if (selectedOptionContentId) {
                    selectedContentIds.push(selectedOptionContentId.toString());
                }
            });

            paths.filter(deletedItem => !pending && selectedContentIds.indexOf(deletedItem.getContentId().toString()) > -1)
                .forEach((deletedItem) => {
                    const selectedOption = this.getSelectedOptionsView().getById(deletedItem.getContentId().toString());
                    if (selectedOption) {
                        const option = selectedOption.getOption();
                        const newValue = this.createMissingContentItem(deletedItem.getContentId());
                        option.setDisplayValue(newValue);
                        selectedOption.getOptionView().setOption(option);
                        optionsUpdated.push(selectedOption);
                    }
                });

            if (optionsUpdated.length > 0) {
               this.handleOptionUpdated(optionsUpdated);
            }
        };

        let handler = ContentServerEventsHandler.getInstance();
        handler.onContentDeleted(this.contentDeletedListener);

        this.onRemoved(() => {
            handler.unContentDeleted(this.contentDeletedListener);
        });
    }

    protected createSelectorItem(content: ContentSummary | ContentSummaryAndCompareStatus, selectable: boolean = true,
                                 expandable: boolean = true): ContentTreeSelectorItem {
        if (content instanceof ContentSummaryAndCompareStatus) {
                return new ContentAndStatusTreeSelectorItem(content, selectable, expandable);
        }

        return new ContentTreeSelectorItem(content, selectable, expandable);
    }

    protected handleContentMoved(movedItems: MovedContentItem[]): void {
        if (this.getSelectedOptions().length === 0) {
            return;
        }

        movedItems.forEach((movedItem: MovedContentItem) => {
            const selectedOption: SelectedOption<ContentTreeSelectorItem> = this.findSelectedOptionByContentPath(movedItem.oldPath);

            if (selectedOption) {
                const contentTreeSelectorItem = this.createSelectorItem(movedItem.item);
                this.getContentComboBox().updateOption(selectedOption.getOption(), contentTreeSelectorItem);
            }
        });
    }

    protected handleContentUpdated(updatedContents: ContentSummaryAndCompareStatus[], oldPaths?: ContentPath[]): void {
        if (this.getSelectedOptions().length === 0) {
            return;
        }

        const optionsUpdated: SelectedOption<ContentTreeSelectorItem>[] = this.updateSelectedOptions(updatedContents, oldPaths);

        if (optionsUpdated.length > 0) {
            this.handleOptionUpdated(optionsUpdated);
        }
    }

    private updateSelectedOptions(updatedContents: ContentSummaryAndCompareStatus[], oldPaths?: ContentPath[]): SelectedOption<ContentTreeSelectorItem>[] {
        const updatedOptions: SelectedOption<ContentTreeSelectorItem>[] = [];

        updatedContents.forEach((content, index) => {
            const selectedOption = this.resolveSelectedOption(content, index, oldPaths);
            if (selectedOption) {
                this.updateSelectedOption(selectedOption, content);
                updatedOptions.push(selectedOption);
            }
        });

        return updatedOptions;
    }

    private resolveSelectedOption(content: ContentSummaryAndCompareStatus, index: number,
                                  oldPaths?: ContentPath[]): SelectedOption<ContentTreeSelectorItem> {
        return oldPaths ?
               this.findSelectedOptionByContentPath(oldPaths[index]) :
               this.getSelectedOptionsView().getById(content.getContentId().toString());
    }

    private updateSelectedOption(selectedOption: SelectedOption<ContentTreeSelectorItem>, content: ContentSummaryAndCompareStatus): void {
        const option = selectedOption.getOption();
        const oldValue = option.getDisplayValue();
        const newValue = this.createSelectorItem(
            content,
            oldValue?.isSelectable(),
            oldValue?.isExpandable()
        );

        option.setDisplayValue(newValue);
        selectedOption.getOptionView().removeClass(ContentComboBox.NOT_FOUND_CLASS);
        selectedOption.getOptionView().setOption(option);
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
        this.newContentButton.onContentAdded((content: ContentSummary) => {
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
            contentIds.forEach((contentId: ContentId) => {
                const content = contents.find((item) => item.getContentId().equals(contentId));
                const dataItem = content ? this.createSelectorItem(content) : this.createMissingContentItem(contentId);

                this.contentComboBox.select(dataItem, undefined, true);
            });

            this.contentComboBox.resetBaseValues();

            this.updateNewContentButton();

            this.contentComboBox.getSelectedOptions().forEach((selectedOption: SelectedOption<ContentTreeSelectorItem>) => {
                this.updateSelectedOptionIsEditable(selectedOption);
            });

            this.setLayoutInProgress(false);
        });
    }

    protected createMissingContentItem(id: ContentId): ContentTreeSelectorItem {
        const content = new ContentSummary(new ContentSummaryBuilder().setId(id.toString()).setContentId(id));
        return new ContentTreeSelectorItem(content);
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
        return ContentComboBox.create().setRemoveMissingSelectedOptions(false).setDisplayMissingSelectedOptions(true).setProject(
            this.context.project);
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
            .setTreegridDropdownEnabled(this.treeMode)
            .setTreeModeTogglerAllowed(!this.hideToggleIcon)
            .setValue(comboboxValue);
    }

    protected doCreateContentComboBox(input: Input, propertyArray: PropertyArray): ContentComboBox<ContentTreeSelectorItem> {
        return this.createContentComboBoxBuilder(input, propertyArray).build();
    }

    protected initEvents(contentComboBox: ContentComboBox<ContentTreeSelectorItem>) {
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
        const idsToLoad = ContentSelector.contentIdBatch;
        ContentSelector.contentIdBatch = [];
        const promiseForIdsToLoad = ContentSelector.loadSummariesResult;
        ContentSelector.loadSummariesResult = Q.defer<ContentSummaryAndCompareStatus[]>();
        new ContentSummaryAndCompareStatusFetcher().fetchAndCompareStatus(idsToLoad).then(
            (result: ContentSummaryAndCompareStatus[]) => {
                promiseForIdsToLoad.resolve(result);
            });
    }

    protected doLoadContent(contentIds: ContentId[]): Q.Promise<ContentSummaryAndCompareStatus[]> {
        ContentSelector.contentIdBatch = ContentSelector.contentIdBatch.concat(contentIds);
        const resultPromise = ContentSelector.loadSummariesResult.promise;
        ContentSelector.loadSummaries();

        return resultPromise.then((result: ContentSummaryAndCompareStatus[]) => {
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

    protected handleOptionUpdated(optionsUpdated: SelectedOption<ContentTreeSelectorItem>[]): void {
        //
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
