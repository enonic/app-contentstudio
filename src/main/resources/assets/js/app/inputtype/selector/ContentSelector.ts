import Property = api.data.Property;
import PropertyArray = api.data.PropertyArray;
import Value = api.data.Value;
import ValueType = api.data.ValueType;
import ValueTypes = api.data.ValueTypes;
import SelectedOptionEvent = api.ui.selector.combobox.SelectedOptionEvent;
import SelectedOption = api.ui.selector.combobox.SelectedOption;
import StringHelper = api.util.StringHelper;
import ContentTreeSelectorItem = api.content.resource.ContentTreeSelectorItem;
import DivEl = api.dom.DivEl;
import ContentId = api.content.ContentId;
import ContentSummary = api.content.ContentSummary;
import {ContentComboBox, ContentSelectedOptionsView} from '../ui/selector/ContentComboBox';
import {ContentInputTypeManagingAdd} from '../ui/selector/ContentInputTypeManagingAdd';
import {ContentInputTypeViewContext} from '../ContentInputTypeViewContext';
import {ContentSummaryOptionDataLoader} from '../ui/selector/ContentSummaryOptionDataLoader';

export class ContentSelector
    extends ContentInputTypeManagingAdd<ContentTreeSelectorItem> {

    protected contentComboBox: ContentComboBox<ContentTreeSelectorItem>;

    protected comboBoxWrapper: DivEl;

    protected draggingIndex: number;

    protected treeMode: boolean;

    protected hideToggleIcon: boolean;

    protected showStatus: boolean;

    protected static contentIdBatch: ContentId[] = [];

    protected static loadSummariesResult: wemQ.Deferred<ContentSummary[]>;

    public static debug: boolean = false;

    protected static loadSummaries: () => void = api.util.AppHelper.debounce(ContentSelector.doFetchSummaries, 10, false);

    constructor(config?: ContentInputTypeViewContext) {
        super('relationship', config);
    }

    protected readConfig(inputConfig: { [element: string]: { [name: string]: string }[]; }): void {

        const isTreeModeConfig = inputConfig['treeMode'] ? inputConfig['treeMode'][0] : {};
        this.treeMode = !StringHelper.isBlank(isTreeModeConfig['value']) ? isTreeModeConfig['value'].toLowerCase() === 'true' : false;

        const showStatusConfig = inputConfig['showStatus'] ? inputConfig['showStatus'][0] : {};
        this.showStatus = !StringHelper.isBlank(showStatusConfig['value']) ? showStatusConfig['value'].toLowerCase() === 'true' : false;

        const hideToggleIconConfig = inputConfig['hideToggleIcon'] ? inputConfig['hideToggleIcon'][0] : {};
        this.hideToggleIcon =
            !StringHelper.isBlank(hideToggleIconConfig['value']) ? hideToggleIconConfig['value'].toLowerCase() === 'true' : false;

        super.readConfig(inputConfig);
    }

    public getContentComboBox(): ContentComboBox<ContentTreeSelectorItem> {
        return this.contentComboBox;
    }

    protected getSelectedOptionsView(): ContentSelectedOptionsView {
        return <ContentSelectedOptionsView> this.contentComboBox.getSelectedOptionView();
    }

    protected getContentPath(raw: ContentTreeSelectorItem): api.content.ContentPath {
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

    protected createOptionDataLoader(): ContentSummaryOptionDataLoader<ContentTreeSelectorItem> {
        return ContentSummaryOptionDataLoader.create().setAllowedContentPaths(
            this.allowedContentPaths).setContentTypeNames(this.allowedContentTypes).setRelationshipType(
            this.relationshipType).setContent(this.config.content).setLoadStatus(this.showStatus).build();

    }

    layout(input: api.form.Input, propertyArray: PropertyArray): wemQ.Promise<void> {
        if (!ValueTypes.REFERENCE.equals(propertyArray.getType())) {
            propertyArray.convertValues(ValueTypes.REFERENCE);
        }
        return super.layout(input, propertyArray).then(() => {
            this.contentComboBox = this.createContentComboBox(input, propertyArray);

            this.comboBoxWrapper = new api.dom.DivEl('combobox-wrapper');
            this.comboBoxWrapper.appendChild(this.contentComboBox);

            this.appendChild(this.comboBoxWrapper);

            return this.doLayout(propertyArray);

        });
    }

    protected doLayout(propertyArray: PropertyArray): wemQ.Promise<void> {

        const contentIds: ContentId[] = [];
        propertyArray.forEach((property: Property) => {
            if (property.hasNonNullValue()) {
                let referenceValue = property.getReference();
                if (referenceValue instanceof api.util.Reference) {
                    contentIds.push(ContentId.fromReference(referenceValue));
                }
            }
        });

        return this.doLoadContent(contentIds).then((contents: api.content.ContentSummary[]) => {

            this.setupSortable();

            //TODO: original value doesn't work because of additional request, so have to select manually
            contents.forEach((content: api.content.ContentSummary) => {
                this.contentComboBox.select(new ContentTreeSelectorItem(content));
            });

            this.contentComboBox.getSelectedOptions().forEach((selectedOption: SelectedOption<ContentTreeSelectorItem>) => {
                this.updateSelectedOptionIsEditable(selectedOption);
            });

            this.setLayoutInProgress(false);
        });
    }

    protected createContentComboBox(input: api.form.Input, propertyArray: PropertyArray): ContentComboBox<ContentTreeSelectorItem> {
        const optionDataLoader = this.createOptionDataLoader();
        const comboboxValue = this.getValueFromPropertyArray(propertyArray);

        const contentComboBox = ContentComboBox.create()
            .setComboBoxName(input.getName())
            .setMaximumOccurrences(input.getOccurrences().getMaximum())
            .setLoader(optionDataLoader)
            .setValue(comboboxValue)
            .setRemoveMissingSelectedOptions(true)
            .setTreegridDropdownEnabled(this.treeMode)
            .setTreeModeTogglerAllowed(!this.hideToggleIcon)
            .setShowStatus(this.showStatus)
            .build();

        contentComboBox.getComboBox().onContentMissing((ids: string[]) => {
            ids.forEach(id => this.removePropertyWithId(id));
            this.validate(false);
        });

        contentComboBox.onOptionSelected((event: SelectedOptionEvent<ContentTreeSelectorItem>) => {
            this.fireFocusSwitchEvent(event);

            const contentId: ContentId = event.getSelectedOption().getOption().displayValue.getContentId();

            if (contentId) {
                const reference = api.util.Reference.from(event.getSelectedOption().getOption().displayValue.getContentId());

                const value = new Value(reference, ValueTypes.REFERENCE);
                if (contentComboBox.countSelected() === 1) { // overwrite initial value
                    this.getPropertyArray().set(0, value);
                } else if (!this.getPropertyArray().containsValue(value)) {
                    this.getPropertyArray().add(value);
                }
                this.updateSelectedOptionIsEditable(event.getSelectedOption());
                this.refreshSortable();
                this.updateSelectedOptionStyle();
                this.validate(false);
            }

        });

        contentComboBox.onOptionDeselected((event: SelectedOptionEvent<ContentTreeSelectorItem>) => {

            this.getPropertyArray().remove(event.getSelectedOption().getIndex());
            this.updateSelectedOptionStyle();
            this.validate(false);
        });

        return contentComboBox;
    }

    protected removePropertyWithId(id: string) {
        let length = this.getPropertyArray().getSize();
        for (let i = 0; i < length; i++) {
            if (this.getPropertyArray().get(i).getValue().getString() === id) {
                this.getPropertyArray().remove(i);
                api.notify.NotifyManager.get().showWarning('Failed to load content item with id ' + id +
                                                           '. The reference will be removed upon save.');
                break;
            }
        }
    }

    update(propertyArray: api.data.PropertyArray, unchangedOnly: boolean): Q.Promise<void> {
        return super.update(propertyArray, unchangedOnly).then(() => {
            if (!unchangedOnly || !this.contentComboBox.isDirty() && this.contentComboBox.isRendered()) {
                let value = this.getValueFromPropertyArray(propertyArray);
                this.contentComboBox.setValue(value);
            }
        });
    }

    reset() {
        this.contentComboBox.resetBaseValues();
    }

    private static doFetchSummaries() {
        new api.content.resource.GetContentSummaryByIds(ContentSelector.contentIdBatch).sendAndParse().then(
            (result: api.content.ContentSummary[]) => {

                ContentSelector.contentIdBatch = []; // empty batch of ids after loading

                ContentSelector.loadSummariesResult.resolve(result);

                ContentSelector.loadSummariesResult = null; // empty loading result after resolving
            });
    }

    protected doLoadContent(contentIds: ContentId[]): wemQ.Promise<api.content.ContentSummary[]> {

        ContentSelector.contentIdBatch = ContentSelector.contentIdBatch.concat(contentIds);

        if (!ContentSelector.loadSummariesResult) {
            ContentSelector.loadSummariesResult = wemQ.defer<ContentSummary[]>();
        }

        ContentSelector.loadSummaries();

        return ContentSelector.loadSummariesResult.promise.then((result: api.content.ContentSummary[]) => {
            let contentIdsStr = contentIds.map(id => id.toString());
            return result.filter(content => contentIdsStr.indexOf(content.getId()) >= 0);
        });
    }

    protected setupSortable() {
        wemjq(this.getHTMLElement()).find('.selected-options').sortable({
            axis: 'y',
            containment: 'parent',
            handle: '.drag-control',
            tolerance: 'pointer',
            start: (_event: Event, ui: JQueryUI.SortableUIParams) => this.handleDnDStart(ui),
            update: (_event: Event, ui: JQueryUI.SortableUIParams) => this.handleDnDUpdate(ui)
        });

        this.updateSelectedOptionStyle();
    }

    private handleDnDStart(ui: JQueryUI.SortableUIParams): void {

        let draggedElement = api.dom.Element.fromHtmlElement(<HTMLElement>ui.item[0]);
        this.draggingIndex = draggedElement.getSiblingIndex();

        ui.placeholder.html('Drop form item set here');
    }

    private handleDnDUpdate(ui: JQueryUI.SortableUIParams) {

        if (this.draggingIndex >= 0) {
            let draggedElement = api.dom.Element.fromHtmlElement(<HTMLElement>ui.item[0]);
            let draggedToIndex = draggedElement.getSiblingIndex();
            this.getPropertyArray().move(this.draggingIndex, draggedToIndex);
        }

        this.draggingIndex = -1;
    }

    protected updateSelectedOptionStyle() {
        if (this.getPropertyArray().getSize() > 1) {
            this.addClass('multiple-occurrence').removeClass('single-occurrence');
        } else {
            this.addClass('single-occurrence').removeClass('multiple-occurrence');
        }
    }

    protected updateSelectedOptionIsEditable(selectedOption: SelectedOption<ContentTreeSelectorItem>) {
        let selectedContentId = selectedOption.getOption().displayValue.getContentId();
        let refersToItself = selectedContentId.toString() === this.config.content.getId();
        selectedOption.getOptionView().toggleClass('non-editable', refersToItself);
    }

    protected refreshSortable() {
        wemjq(this.getHTMLElement()).find('.selected-options').sortable('refresh');
    }

    protected getNumberOfValids(): number {
        return this.contentComboBox.countSelected();
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

api.form.inputtype.InputTypeManager.register(new api.Class('ContentSelector', ContentSelector));
