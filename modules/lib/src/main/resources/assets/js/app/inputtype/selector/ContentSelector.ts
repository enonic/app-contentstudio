import * as Q from 'q';
import {StringHelper} from '@enonic/lib-admin-ui/util/StringHelper';
import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';
import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {Input} from '@enonic/lib-admin-ui/form/Input';
import {InputTypeManager} from '@enonic/lib-admin-ui/form/inputtype/InputTypeManager';
import {Class} from '@enonic/lib-admin-ui/Class';
import {PropertyArray} from '@enonic/lib-admin-ui/data/PropertyArray';
import {Value} from '@enonic/lib-admin-ui/data/Value';
import {ValueType} from '@enonic/lib-admin-ui/data/ValueType';
import {ValueTypes} from '@enonic/lib-admin-ui/data/ValueTypes';
import {SelectedOption} from '@enonic/lib-admin-ui/ui/selector/combobox/SelectedOption';
import {ContentSelectedOptionsView} from '../ui/selector/ContentComboBox';
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
import {CompareStatus} from '../../content/CompareStatus';
import {MovedContentItem} from '../../browse/MovedContentItem';
import {ContentServerChangeItem} from '../../event/ContentServerChangeItem';
import {ContentSelectorDropdown} from './ContentSelectorDropdown';
import {SelectionChange} from '@enonic/lib-admin-ui/util/SelectionChange';
import {ContentListBox} from './ContentListBox';
import {ContentTreeSelectorDropdown} from './ContentTreeSelectorDropdown';

export class ContentSelector
    extends ContentInputTypeManagingAdd<ContentTreeSelectorItem> {

    protected contentSelectorDropdown: ContentSelectorDropdown;

    protected contentSelectedOptionsView: ContentSelectedOptionsView;

    protected comboBoxWrapper: DivEl;

    protected newContentButton: NewContentButton;

    protected treeMode: boolean;

    protected initiallySelectedItems: string[];

    protected hideToggleIcon: boolean;

    protected contentDeletedListener: (paths: ContentServerChangeItem[], pending?: boolean) => void;

    public static debug: boolean = false;

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

        // remove missing options via removePropertyWithId
    }

    protected handleContentRenamed() {
        // handle content renamed
    }

    private handleContentUpdatedEvent() {
        const contentUpdatedListener = (statuses: ContentSummaryAndCompareStatus[], oldPaths?: ContentPath[]) => {
            if (this.getSelectedOptions().length === 0) {
                return;
            }

            statuses.forEach((status: ContentSummaryAndCompareStatus) => {
                this.contentSelectorDropdown.updateItem(this.createSelectorItem(status));
            });
        };

        const contentMovedListener = (movedItems: MovedContentItem[]) => {
            if (this.getSelectedOptions().length === 0) {
                return;
            }

            movedItems.forEach((movedItem: MovedContentItem) => {
                this.contentSelectorDropdown.updateItem(this.createSelectorItem(movedItem.item));
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
        if (content instanceof ContentSummaryAndCompareStatus) {
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

    protected getSelectedOptionsView(): ContentSelectedOptionsView {
        return this.contentSelectedOptionsView;
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
            this.initiallySelectedItems = this.getSelectedItemsIds();
            this.contentSelectorDropdown = this.createSelectorDropdown(input);
            this.comboBoxWrapper = new DivEl('combobox-wrapper');
            this.comboBoxWrapper.appendChild(this.contentSelectorDropdown);
            this.appendChild(this.comboBoxWrapper);
            return this.addExtraElementsOnLayout(input, propertyArray).then(() => this.doLayout(propertyArray));
        });
    }

    protected createSelectorDropdown(input: Input): ContentSelectorDropdown {
        this.contentSelectedOptionsView = this.createSelectedOptionsView().setContextContent(this.context.content);
        const loader = this.createLoader();
        const listBox = this.createContentListBox(loader);
        const dropdownOptions = {
            listBox: listBox,
            loader: loader,
            className: this.getDropdownClassName(),
            maxSelected: input.getOccurrences().getMaximum(),
            selectedOptionsView: this.contentSelectedOptionsView,
            getSelectedItems: this.getSelectedItemsIds.bind(this),
        };

        const contentSelectorDropdown = this.doCreateSelectorDropdown(dropdownOptions);

        this.contentSelectedOptionsView.onOptionMoved(this.handleMoved.bind(this));

        contentSelectorDropdown.onSelectionChanged((selectionChange: SelectionChange<ContentTreeSelectorItem>) => {
            selectionChange.selected?.forEach((item: ContentTreeSelectorItem) => {
                this.updateNewContentButton();

                const contentId: ContentId = item.getContentId();

                if (contentId) {
                    this.setContentIdProperty(contentId);

                    this.getSelectedOptionsView().refreshSortable();
                    this.updateSelectedOptionStyle();
                    this.handleValueChanged(false);
                }
            });

            selectionChange.deselected?.forEach((item: ContentTreeSelectorItem) => {
                const property = this.getPropertyArray().getProperties().find((property) => {
                    const propertyValue = property.hasNonNullValue() ? property.getString() : '';
                    return propertyValue === item.getId();
                });

                if (property) {
                    this.handleDeselected(property.getIndex());
                    this.updateSelectedOptionStyle();
                    this.updateNewContentButton();
                    this.handleValueChanged(false);
                }
            });
        });

        return contentSelectorDropdown;
    }

    protected doCreateSelectorDropdown(dropdownOptions): ContentSelectorDropdown {
        return new ContentTreeSelectorDropdown(dropdownOptions);
    }

    protected getDropdownClassName(): string {
        return '';
    }

    protected getSelectedItemsIds(): string[] {
        return this.getValueFromPropertyArray(this.getPropertyArray()).split(';');
    }

    protected createSelectedOptionsView(): ContentSelectedOptionsView {
        return new ContentSelectedOptionsView();
    }

    protected createContentListBox(loader: ContentSummaryOptionDataLoader<ContentTreeSelectorItem>): ContentListBox<ContentTreeSelectorItem> {
        return new ContentListBox({loader: loader});
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
            this.contentSelectorDropdown.select(this.createSelectorItem(item));
        });

        this.comboBoxWrapper.appendChild(this.newContentButton);
    }

    protected doLayout(propertyArray: PropertyArray): Q.Promise<void> {
        this.setLayoutInProgress(false);
        this.setupSortable();

        return Q.resolve();
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

    protected createLoader(): ContentSummaryOptionDataLoader<ContentTreeSelectorItem> {
        return this.createOptionDataLoaderBuilder().setAppendLoadResults(false).build();
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

        const isDirty = this.isDirty();

        return super.update(propertyArray, unchangedOnly).then(() => {
            this.initiallySelectedItems = this.getSelectedItemsIds();

            if (!unchangedOnly || !isDirty) {
                this.contentSelectorDropdown.updateSelectedItems();
            } else if (isDirty) {
                this.updateDirty();
            }
        });
    }

    private isDirty(): boolean {
        return !ObjectHelper.stringArrayEquals(this.initiallySelectedItems, this.getSelectedItemsIds());
    }

    reset() {
        //this.contentComboBox.resetBaseValues();
    }

    clear() {
        // this.contentComboBox.clearCombobox();
    }

    setEnabled(enable: boolean): void {
        super.setEnabled(enable);
        this.contentSelectorDropdown.setEnabled(enable);
    }

    updateDirty() {
        if (ContentSelector.debug) {
            console.log('resetPropertyValues()');
        }

        this.ignorePropertyChange(true);
        this.getPropertyArray().removeAll(true);

        this.contentSelectorDropdown.getSelectedOptions().filter((option: SelectedOption<ContentTreeSelectorItem>) => {
            const contentId = option.getOption().getDisplayValue().getContentId();
            const reference: Reference = new Reference(contentId.toString());
            const value: Value = new Value(reference, ValueTypes.REFERENCE);
            this.getPropertyArray().add(value);
        });

        this.ignorePropertyChange(false);
    }

    protected setContentIdProperty(contentId: ContentId) {
        const reference: Reference = new Reference(contentId.toString());
        const value: Value = new Value(reference, ValueTypes.REFERENCE);

        if (!this.getPropertyArray().containsValue(value)) {
            this.ignorePropertyChange(true);
            if (this.contentSelectorDropdown.countSelected() === 1) { // overwrite initial value
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
            this.contentSelectorDropdown.addClass('multiple-occurrence').removeClass('single-occurrence');
        } else {
            this.addClass('single-occurrence').removeClass('multiple-occurrence');
            this.contentSelectorDropdown.addClass('single-occurrence').removeClass('multiple-occurrence');
        }
    }

    protected getNumberOfValids(): number {
        return this.getPropertyArray().getSize();
    }

    private updateNewContentButton(): void {
        this.newContentButton?.setVisible(!this.contentSelectorDropdown.maximumOccurrencesReached());
    }

    giveFocus(): boolean {
        if (this.contentSelectorDropdown.maximumOccurrencesReached()) {
            return false;
        }
        return this.contentSelectorDropdown.giveFocus();
    }

    onFocus(listener: (event: FocusEvent) => void) {
        this.contentSelectorDropdown.onFocus(listener);
    }

    unFocus(listener: (event: FocusEvent) => void) {
        this.contentSelectorDropdown.unFocus(listener);
    }

    onBlur(listener: (event: FocusEvent) => void) {
        this.contentSelectorDropdown.onBlur(listener);
    }

    unBlur(listener: (event: FocusEvent) => void) {
        this.contentSelectorDropdown.unBlur(listener);
    }
}

InputTypeManager.register(new Class('ContentSelector', ContentSelector));
