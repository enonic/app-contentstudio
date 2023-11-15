import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';
import {SpanEl} from '@enonic/lib-admin-ui/dom/SpanEl';
import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';
import {Grid} from '@enonic/lib-admin-ui/ui/grid/Grid';
import {GridColumn, GridColumnBuilder} from '@enonic/lib-admin-ui/ui/grid/GridColumn';
import {ResponsiveManager} from '@enonic/lib-admin-ui/ui/responsive/ResponsiveManager';
import {ResponsiveRanges} from '@enonic/lib-admin-ui/ui/responsive/ResponsiveRanges';
import {BaseSelectedOptionsView} from '@enonic/lib-admin-ui/ui/selector/combobox/BaseSelectedOptionsView';
import {ComboBox, ComboBoxConfig} from '@enonic/lib-admin-ui/ui/selector/combobox/ComboBox';
import {RichComboBox, RichComboBoxBuilder} from '@enonic/lib-admin-ui/ui/selector/combobox/RichComboBox';
import {RichSelectedOptionView, RichSelectedOptionViewBuilder} from '@enonic/lib-admin-ui/ui/selector/combobox/RichSelectedOptionView';
import {SelectedOption} from '@enonic/lib-admin-ui/ui/selector/combobox/SelectedOption';
import {SelectedOptionsView} from '@enonic/lib-admin-ui/ui/selector/combobox/SelectedOptionsView';
import {Option} from '@enonic/lib-admin-ui/ui/selector/Option';
import {OptionDataHelper} from '@enonic/lib-admin-ui/ui/selector/OptionDataHelper';
import {OptionDataLoader} from '@enonic/lib-admin-ui/ui/selector/OptionDataLoader';
import {OptionsFactory} from '@enonic/lib-admin-ui/ui/selector/OptionsFactory';
import {Viewer} from '@enonic/lib-admin-ui/ui/Viewer';
import {AppHelper} from '@enonic/lib-admin-ui/util/AppHelper';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {StringHelper} from '@enonic/lib-admin-ui/util/StringHelper';
import {ValueChangedEvent} from '@enonic/lib-admin-ui/ValueChangedEvent';
import * as Q from 'q';
import {ContentRowFormatter} from '../../../browse/ContentRowFormatter';
import {ContentId} from '../../../content/ContentId';
import {ContentPath} from '../../../content/ContentPath';
import {ContentSummary, ContentSummaryBuilder} from '../../../content/ContentSummary';
import {ContentSummaryAndCompareStatus} from '../../../content/ContentSummaryAndCompareStatus';
import {EditContentEvent} from '../../../event/EditContentEvent';
import {ContentAndStatusTreeSelectorItem} from '../../../item/ContentAndStatusTreeSelectorItem';
import {ContentTreeSelectorItem} from '../../../item/ContentTreeSelectorItem';
import {ContentTreeSelectorItemViewer} from '../../../item/ContentTreeSelectorItemViewer';
import {ContentsExistRequest} from '../../../resource/ContentsExistRequest';
import {Project} from '../../../settings/data/project/Project';
import {ContentSummaryOptionDataHelper} from '../../../util/ContentSummaryOptionDataHelper';
import {ContentSummaryOptionDataLoader, ContentSummaryOptionDataLoaderBuilder} from './ContentSummaryOptionDataLoader';
import {ModeTogglerButton} from './ModeTogglerButton';


export class ContentComboBox<ITEM_TYPE extends ContentTreeSelectorItem>
    extends RichComboBox<ContentTreeSelectorItem> {

    public static NOT_FOUND_CLASS = 'content-not-found';

    protected optionsFactory: OptionsFactory<ITEM_TYPE>;

    protected treegridDropdownEnabled: boolean;

    protected treeModeTogglerAllowed: boolean;

    protected initialTreeEnabledState: boolean;

    protected showAfterReload: boolean;

    protected preventReload: boolean;

    protected treeModeToggler?: ModeTogglerButton;

    private statusColumn: GridColumn<Slick.SlickData>;

    constructor(builder: ContentComboBoxBuilder<ITEM_TYPE>) {
        super(builder);

        this.addClass('content-combo-box');

        this.initElements(builder);
        this.initListeners();
    }

    protected initElements(builder: ContentComboBoxBuilder<ITEM_TYPE>) {
        this.treegridDropdownEnabled = builder.treegridDropdownEnabled;
        this.initialTreeEnabledState = this.treegridDropdownEnabled;

        this.treeModeTogglerAllowed = builder.treeModeTogglerAllowed;
        if (this.treeModeTogglerAllowed) {
            this.initTreeModeToggler();
        }

        this.showAfterReload = false;
        this.optionsFactory = new OptionsFactory<ITEM_TYPE>(this.getLoader(), builder.optionDataHelper);
        (this.getSelectedOptionView() as ContentSelectedOptionsView).setProject(builder.project);
    }

    private createStatusColumn() {
        this.statusColumn = new GridColumnBuilder()
            .setId('status')
            .setName('Status')
            .setField('displayValue')
            .setFormatter(ContentRowFormatter.statusSelectorFormatter)
            .setCssClass('status')
            .setBoundaryWidth(75, 75)
            .build();
    }

    protected initListeners() {
        const debouncedHandler = AppHelper.debounce(this.handleAvailableSizeChanged.bind(this), 300);
        ResponsiveManager.onAvailableSizeChanged(this, debouncedHandler);
    }

    private handleAvailableSizeChanged() {
        if (ResponsiveRanges._360_540.isFitOrSmaller(this.getEl().getWidth())) {
            this.removeStatusColumnIfShown();
        } else {
            this.addStatusColumnIfHidden();
        }
    }

    private removeStatusColumnIfShown() {
        if (this.isStatusColumnShown()) {
            const newColumns: GridColumn<Slick.SlickData>[] = this.getColumnsWithoutCheckbox()
                .filter((column: GridColumn<Slick.SlickData>) => column.id !== 'status');
            this.getDataGrid().setColumns(newColumns, true);
        }
    }

    private addStatusColumnIfHidden() {
        if (!this.isStatusColumnShown()) {
            const newColumns: GridColumn<Slick.SlickData>[] = [...this.getColumnsWithoutCheckbox(), this.statusColumn];
            this.getDataGrid().setColumns(newColumns, true);
        }
    }

    private getDataGrid(): Grid<ContentTreeSelectorItem> {
        return this.getComboBox().getComboBoxDropdownGrid().getGrid();
    }

    private getColumnsWithoutCheckbox(): GridColumn<Slick.SlickData>[] {
        return this.getDataGrid().getColumns().filter((column: GridColumn<Slick.SlickData>) => column.id !== '_checkbox_selector');
    }

    private isStatusColumnShown(): boolean {
        return this.getColumnsWithoutCheckbox().some((column: GridColumn<Slick.SlickData>) => column.id === 'status');
    }

    protected createComboboxConfig(builder: ContentComboBoxBuilder<ITEM_TYPE>): ComboBoxConfig<ContentTreeSelectorItem> {
        this.prepareBuilder(builder);
        const config = super.createComboboxConfig(builder);
        config.treegridDropdownAllowed = builder.treegridDropdownEnabled || builder.treeModeTogglerAllowed;

        return config;
    }

    protected prepareBuilder(builder: ContentComboBoxBuilder<ITEM_TYPE>) {
        this.createStatusColumn();

        if (!builder.loader) {
            builder.setLoader(this.createLoader(builder) as ContentSummaryOptionDataLoader<ITEM_TYPE>);
        }

        builder.setCreateColumns([this.statusColumn]);

        if (builder.isRequestMissingOptions) {
            builder.setRequestMissingOptions((missingOptionIds: string[]) => {
                return new ContentsExistRequest(missingOptionIds)
                    .setRequestProject(builder.project)
                    .sendAndParse()
                    .then(result => result.getContentsExistMap());
            });
        }
    }

    protected createLoader(builder: ContentComboBoxBuilder<ITEM_TYPE>): ContentSummaryOptionDataLoader<ContentTreeSelectorItem> {
        return this.createLoaderBuilder(builder).setProject(builder.project).build();
    }

    protected createLoaderBuilder(builder: ContentComboBoxBuilder<ITEM_TYPE>): ContentSummaryOptionDataLoaderBuilder {
        return ContentSummaryOptionDataLoader.create();
    }

    getLoader(): ContentSummaryOptionDataLoader<ITEM_TYPE> {
        return super.getLoader() as ContentSummaryOptionDataLoader<ITEM_TYPE>;
    }

    getSelectedContent(): ContentSummary {
        let option = this.getOptionByValue(this.getValue());
        if (option) {
            return (option.getDisplayValue() as ITEM_TYPE).getContent();
        }
        return null;
    }

    setEnabled(enable: boolean): void {
        super.setEnabled(enable);

        if (this.treeModeToggler) {
            this.treeModeToggler.setEnabled(enable);
        }
    }

    getContent(contentId: ContentId): ContentSummary {
        let option = this.getOptionByValue(contentId.toString());
        if (option) {
            return (option.getDisplayValue() as ITEM_TYPE).getContent();
        }
        return null;
    }

    getComboBox(): ComboBox<ITEM_TYPE> {
        return super.getComboBox() as ComboBox<ITEM_TYPE>;
    }

    setContent(content: ContentSummary) {

        this.clearSelection();
        if (content) {
            let optionToSelect: Option<ContentTreeSelectorItem> = this.getOptionByValue(content.getContentId().toString());
            if (!optionToSelect) {
                optionToSelect = this.createOption(content);
                this.addOption(optionToSelect);
            }
            this.selectOption(optionToSelect);

        }
    }

    protected toggleGridOptions(_treeMode: boolean) {
        // May be overridden in deriving class if the grid should
        // have different settings in different modes
    }

    private initTreeModeToggler() {

        this.treeModeToggler = new ModeTogglerButton();
        this.treeModeToggler.setActive(this.treegridDropdownEnabled);
        this.getComboBox().prependChild(this.treeModeToggler);

        this.treeModeToggler.onActiveChanged(isActive => {
            this.treegridDropdownEnabled = isActive;
            this.toggleGridOptions(isActive);
            if (!this.preventReload) {
                this.reload(this.getComboBox().getInput().getValue());
            }
        });

        this.onLoaded(() => {
            if (this.showAfterReload) {
                this.getComboBox().getInput().setEnabled(true);
                this.showAfterReload = false;
            }
        });

        this.treeModeToggler.onClicked(() => {
            this.giveFocus();
            this.showAfterReload = true;

            this.getComboBox().showDropdown();
            this.getComboBox().setEmptyDropdownText(i18n('field.search.inprogress'));
        });

        this.getComboBox().getInput().onValueChanged((event: ValueChangedEvent) => {

            if (this.initialTreeEnabledState && StringHelper.isEmpty(event.getNewValue())) {
                if (!this.treeModeToggler.isActive()) {
                    this.preventReload = true;
                    this.treeModeToggler.setActive(true);
                    this.preventReload = false;
                }
                return;
            }

            if (this.treeModeToggler.isActive()) {
                this.preventReload = true;
                this.treeModeToggler.setActive(false);
                this.preventReload = false;
            }

        });
    }

    protected createOptions(items: ITEM_TYPE[]): Q.Promise<Option<ITEM_TYPE>[]> {
        return this.optionsFactory.createOptions(items);
    }

    protected createOption(data: ContentSummary | ContentTreeSelectorItem, readOnly?: boolean): Option<ITEM_TYPE> {
        const item: ITEM_TYPE = ObjectHelper.iFrameSafeInstanceOf(data, ContentTreeSelectorItem) ?
            data as ITEM_TYPE :
            new ContentTreeSelectorItem(data as ContentSummary) as ITEM_TYPE;

        return this.optionsFactory.createOption(item, readOnly);
    }

    protected reload(inputValue: string): Q.Promise<ContentTreeSelectorItem[]> {

        const deferred = Q.defer<ContentTreeSelectorItem[]>();

        if (this.ifFlatLoadingMode(inputValue)) {
            this.getLoader().search(inputValue).then(() => {
                deferred.resolve();
            }).catch((reason) => {
                DefaultErrorHandler.handle(reason);
            }).done();
        } else {
            this.getLoader().setTreeFilterValue(inputValue);

            this.getComboBox().getComboBoxDropdownGrid().reload().then(() => {
                if (this.getComboBox().isDropdownShown()) {
                    this.getComboBox().showDropdown();
                    this.getComboBox().getInput().setEnabled(true);
                }

                this.notifyLoaded(this.getComboBox().getOptions().map(option => option.getDisplayValue()));

                deferred.resolve();
            }).catch((reason) => {
                DefaultErrorHandler.handle(reason);
            }).done();
        }

        return deferred.promise;
    }

    private ifFlatLoadingMode(inputValue: string): boolean {
        return !this.treegridDropdownEnabled || (!this.treeModeTogglerAllowed && !StringHelper.isEmpty(inputValue));
    }

    public static create(): ContentComboBoxBuilder<ContentTreeSelectorItem> {
        return new ContentComboBoxBuilder<ContentTreeSelectorItem>();
    }
}

export class ContentSelectedOptionsView
    extends BaseSelectedOptionsView<ContentTreeSelectorItem> {

    private project?: Project;

    private contextContent: ContentSummary;

    createSelectedOption(option: Option<ContentTreeSelectorItem>): SelectedOption<ContentTreeSelectorItem> {
        const optionView = new ContentSelectedOptionView(option, this.project);

        const selectedContentId = option.getDisplayValue().getId();
        const refersToItself: boolean = this.contextContent && this.contextContent.getId() === selectedContentId;
        optionView.toggleClass('non-editable', !!refersToItself);

        return new SelectedOption<ContentTreeSelectorItem>(optionView, this.count());
    }

    setProject(value: Project): this {
        this.project = value;
        return this;
    }

    setContextContent(value: ContentSummary): this {
        this.contextContent = value;
        return this;
    }
}

export class MissingContentSelectedOptionView
    extends BaseSelectedOptionView<ContentTreeSelectorItem> {

    protected getEmptyDisplayValue(id: string): ContentTreeSelectorItem {
        const content = new ContentSummary(new ContentSummaryBuilder().setId(id).setContentId(new ContentId(id)));
        return new ContentTreeSelectorItem(content);
    }
}

export class ContentSelectedOptionView
    extends RichSelectedOptionView<ContentTreeSelectorItem> {

    private project?: Project;

    private readonly statusEl: SpanEl;

    private isMissing: boolean;

    constructor(option: Option<ContentTreeSelectorItem>, project?: Project) {
        super(new RichSelectedOptionViewBuilder<ContentTreeSelectorItem>()
            .setDraggable(true)
            .setEditable(true)
            .setOption(option) as RichSelectedOptionViewBuilder<ContentTreeSelectorItem>
        );

        this.updateMissingStatus(option);
        this.project = project;
        this.statusEl = new SpanEl();
    }

    resolveIconUrl(content: ContentTreeSelectorItem): string {
        return this.isMissing ? '' : content.getIconUrl();
    }

    resolveTitle(content: ContentTreeSelectorItem): string {
        if (this.isMissing) {
            return content.getId();
        }

        const isRoot = content.getPath().equals(ContentPath.getRoot());
        return (isRoot ? '/ ' : '') + content.getDisplayName().toString();
    }

    resolveSubTitle(content: ContentTreeSelectorItem): string {
        if (this.isMissing) {
            return i18n('text.content.not.found');
        }

        const isRoot = content.getPath().equals(ContentPath.getRoot());
        return !isRoot ? content.getPath().toString() : undefined;
    }

    protected onEditButtonClicked(e: MouseEvent) {
        let content = this.getOptionDisplayValue().getContent();
        let model = [ContentSummaryAndCompareStatus.fromContentSummary(content)];
        new EditContentEvent(model, this.project).fire();

        return super.onEditButtonClicked(e);
    }

    setOption(option: Option<ContentTreeSelectorItem>): void {
        this.updateMissingStatus(option);
        super.setOption(option);
        this.setStatus(this.getOptionDisplayValue());
    }

    private setStatus(item: ContentTreeSelectorItem): void {
        if (item instanceof ContentAndStatusTreeSelectorItem) {
            const content = ContentSummaryAndCompareStatus.fromContentAndCompareAndPublishStatus(item.getContent(),
                item.getCompareStatus(),
                item.getPublishStatus());

            this.statusEl.addClass(content.getStatusClass());
            this.statusEl.setHtml(content.getStatusText());
        }
    }

    private updateMissingStatus(option: Option<ContentTreeSelectorItem>): void {
        this.isMissing = option.getDisplayValue() && !option.getDisplayValue().getPath();
        this.setEditable(!this.isMissing);
        this.toggleClass(ContentComboBox.NOT_FOUND_CLASS, this.isMissing);
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            const item = this.getOptionDisplayValue();
            const status = new SpanEl('status').appendChild(this.statusEl);
            this.setStatus(item);
            this.appendChild(status);

            this.addClass('content-selected-option-view');
            this.toggleClass('no-icon', !!item.getPath()?.equals(ContentPath.getRoot()));
            this.removeClass('not-found');

            return rendered;
        });
    }
}

export class ContentComboBoxBuilder<ITEM_TYPE extends ContentTreeSelectorItem>
    extends RichComboBoxBuilder<ContentTreeSelectorItem> {

    comboBoxName: string = 'contentSelector';

    selectedOptionsView: SelectedOptionsView<ContentTreeSelectorItem> =
        new ContentSelectedOptionsView() as SelectedOptionsView<ContentTreeSelectorItem>;

    loader: ContentSummaryOptionDataLoader<ContentTreeSelectorItem>;

    optionDataHelper: OptionDataHelper<ContentTreeSelectorItem> = new ContentSummaryOptionDataHelper();

    optionDisplayValueViewer: Viewer<ContentTreeSelectorItem> = new ContentTreeSelectorItemViewer();

    maximumOccurrences: number = 0;

    delayedInputValueChangedHandling: number = 750;

    minWidth: number;

    value: string;

    displayMissingSelectedOptions: boolean;

    removeMissingSelectedOptions: boolean;

    treegridDropdownEnabled: boolean = false;

    treeModeTogglerAllowed: boolean = true;

    isRequestMissingOptions: boolean = true;

    project: Project;

    setTreegridDropdownEnabled(value: boolean): this {
        this.treegridDropdownEnabled = value;
        return this;
    }

    setTreeModeTogglerAllowed(value: boolean): this {
        this.treeModeTogglerAllowed = value;
        return this;
    }

    setMaximumOccurrences(maximumOccurrences: number): this {
        super.setMaximumOccurrences(maximumOccurrences);
        return this;
    }

    setComboBoxName(value: string): this {
        super.setComboBoxName(value);
        return this;
    }

    setSelectedOptionsView(selectedOptionsView: SelectedOptionsView<ITEM_TYPE>): this {
        super.setSelectedOptionsView(selectedOptionsView);
        return this;
    }

    setLoader(loader: OptionDataLoader<ITEM_TYPE>): this {
        super.setLoader(loader);
        return this;
    }

    setMinWidth(value: number): this {
        super.setMinWidth(value);
        return this;
    }

    setValue(value: string): this {
        super.setValue(value);
        return this;
    }

    setDelayedInputValueChangedHandling(value: number): this {
        super.setDelayedInputValueChangedHandling(value ? value : 750);
        return this;
    }

    setDisplayMissingSelectedOptions(value: boolean): this {
        super.setDisplayMissingSelectedOptions(value);
        return this;
    }

    setRemoveMissingSelectedOptions(value: boolean): this {
        super.setRemoveMissingSelectedOptions(value);
        return this;
    }

    setSkipAutoDropShowOnValueChange(value: boolean): this {
        super.setSkipAutoDropShowOnValueChange(value);
        return this;
    }

    setOptionDisplayValueViewer(value: Viewer<ContentTreeSelectorItem>): this {
        super.setOptionDisplayValueViewer(value || new ContentTreeSelectorItemViewer());
        return this;
    }

    setOptionDataHelper(value: OptionDataHelper<ITEM_TYPE>): this {
        super.setOptionDataHelper(value);
        return this;
    }

    setHideComboBoxWhenMaxReached(value: boolean): this {
        super.setHideComboBoxWhenMaxReached(value);
        return this;
    }

    setProject(value: Project): this {
        this.project = value;
        return this;
    }

    build(): ContentComboBox<ITEM_TYPE> {
        return new ContentComboBox<ITEM_TYPE>(this);
    }
}
