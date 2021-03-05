import * as Q from 'q';
import {i18n} from 'lib-admin-ui/util/Messages';
import {StringHelper} from 'lib-admin-ui/util/StringHelper';
import {ObjectHelper} from 'lib-admin-ui/ObjectHelper';
import {Viewer} from 'lib-admin-ui/ui/Viewer';
import {DefaultErrorHandler} from 'lib-admin-ui/DefaultErrorHandler';
import {ContentId} from 'lib-admin-ui/content/ContentId';
import {ContentSummary} from 'lib-admin-ui/content/ContentSummary';
import {SelectedOption} from 'lib-admin-ui/ui/selector/combobox/SelectedOption';
import {Option} from 'lib-admin-ui/ui/selector/Option';
import {RichComboBox, RichComboBoxBuilder} from 'lib-admin-ui/ui/selector/combobox/RichComboBox';
import {OptionsFactory} from 'lib-admin-ui/ui/selector/OptionsFactory';
import {OptionDataHelper} from 'lib-admin-ui/ui/selector/OptionDataHelper';
import {SelectedOptionsView} from 'lib-admin-ui/ui/selector/combobox/SelectedOptionsView';
import {ComboBox, ComboBoxConfig} from 'lib-admin-ui/ui/selector/combobox/ComboBox';
import {ModeTogglerButton} from './ModeTogglerButton';
import {ContentSummaryOptionDataLoader, ContentSummaryOptionDataLoaderBuilder} from './ContentSummaryOptionDataLoader';
import {ContentTreeSelectorItem} from '../../../item/ContentTreeSelectorItem';
import {ContentRowFormatter} from '../../../browse/ContentRowFormatter';
import {ContentTreeSelectorItemViewer} from '../../../item/ContentTreeSelectorItemViewer';
import {ContentSummaryOptionDataHelper} from '../../../util/ContentSummaryOptionDataHelper';
import {EditContentEvent} from '../../../event/EditContentEvent';
import {ContentsExistRequest} from '../../../resource/ContentsExistRequest';
import {ContentSummaryAndCompareStatus} from '../../../content/ContentSummaryAndCompareStatus';
import {BaseSelectedOptionsView} from 'lib-admin-ui/ui/selector/combobox/BaseSelectedOptionsView';
import {GridColumn, GridColumnBuilder} from 'lib-admin-ui/ui/grid/GridColumn';
import {ValueChangedEvent} from 'lib-admin-ui/ValueChangedEvent';
import {BaseSelectedOptionView} from 'lib-admin-ui/ui/selector/combobox/BaseSelectedOptionView';
import {H6El} from 'lib-admin-ui/dom/H6El';
import {RichSelectedOptionView, RichSelectedOptionViewBuilder} from 'lib-admin-ui/ui/selector/combobox/RichSelectedOptionView';
import {ContentSummaryViewer} from '../../../content/ContentSummaryViewer';
import {ResponsiveManager} from 'lib-admin-ui/ui/responsive/ResponsiveManager';
import {ResponsiveRanges} from 'lib-admin-ui/ui/responsive/ResponsiveRanges';
import {AppHelper} from 'lib-admin-ui/util/AppHelper';
import {Grid} from 'lib-admin-ui/ui/grid/Grid';

export class ContentComboBox<ITEM_TYPE extends ContentTreeSelectorItem>
    extends RichComboBox<ContentTreeSelectorItem> {

    protected optionsFactory: OptionsFactory<ITEM_TYPE>;

    protected treegridDropdownEnabled: boolean;

    protected treeModeTogglerAllowed: boolean;

    protected initialTreeEnabledState: boolean;

    protected showAfterReload: boolean;

    protected preventReload: boolean;

    protected treeModeToggler?: ModeTogglerButton;

    protected maxHeight: number = 230;

    private statusColumn: GridColumn<any>;

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
            const newColumns: GridColumn<any>[] = this.getColumnsWithoutCheckbox().filter((column: GridColumn<any>) => column.id !== 'status') ;
            this.getDataGrid().setColumns(newColumns, true);
        }
    }

    private addStatusColumnIfHidden() {
        if (!this.isStatusColumnShown()) {
            const newColumns: GridColumn<any>[] = [...this.getColumnsWithoutCheckbox(), this.statusColumn];
            this.getDataGrid().setColumns(newColumns, true);
        }
    }

    private getDataGrid(): Grid<any> {
        return this.getComboBox().getComboBoxDropdownGrid().getGrid();
    }

    private getColumnsWithoutCheckbox(): GridColumn<any>[] {
        return this.getDataGrid().getColumns().filter((column: GridColumn<any>) => column.id !== '_checkbox_selector');
    }

    private isStatusColumnShown(): boolean {
        return this.getColumnsWithoutCheckbox().some((column: GridColumn<any>) => column.id === 'status');
    }

    protected createComboboxConfig(builder: ContentComboBoxBuilder<ITEM_TYPE>): ComboBoxConfig<ContentTreeSelectorItem> {
        this.prepareBuilder(builder);
        const config = super.createComboboxConfig(builder);
        config.treegridDropdownAllowed = builder.treegridDropdownEnabled || builder.treeModeTogglerAllowed;

        return config;
    }

    private prepareBuilder(builder: ContentComboBoxBuilder<ITEM_TYPE>) {
        this.createStatusColumn();

        if (!builder.loader) {
            builder.setLoader(<ContentSummaryOptionDataLoader<ITEM_TYPE>>this.createLoader(builder));
        }

        builder.setMaxHeight(this.maxHeight);
        builder.setCreateColumns([this.statusColumn]);

        if (builder.isRequestMissingOptions) {
            builder.setRequestMissingOptions((missingOptionIds: string[]) => {
                return new ContentsExistRequest(missingOptionIds).sendAndParse().then(result => result.getContentsExistMap());
            });
        }
    }

    protected createLoader(builder: ContentComboBoxBuilder<ITEM_TYPE>): ContentSummaryOptionDataLoader<ContentTreeSelectorItem> {
        return this.createLoaderBuilder(builder).build();
    }

    protected createLoaderBuilder(builder: ContentComboBoxBuilder<ITEM_TYPE>): ContentSummaryOptionDataLoaderBuilder {
        return ContentSummaryOptionDataLoader.create();
    }

    getLoader(): ContentSummaryOptionDataLoader<ITEM_TYPE> {
        return <ContentSummaryOptionDataLoader<ITEM_TYPE>> super.getLoader();
    }

    getSelectedContent(): ContentSummary {
        let option = this.getOptionByValue(this.getValue());
        if (option) {
            return (<ITEM_TYPE>option.getDisplayValue()).getContent();
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
            return (<ITEM_TYPE>option.getDisplayValue()).getContent();
        }
        return null;
    }

    getComboBox(): ComboBox<ITEM_TYPE> {
        return <ComboBox<ITEM_TYPE>>super.getComboBox();
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

    protected createOption(data: Object, readOnly?: boolean): Option<ITEM_TYPE> {
        const item: ITEM_TYPE = ObjectHelper.iFrameSafeInstanceOf(data, ContentTreeSelectorItem) ?
            <ITEM_TYPE>data :
            <ITEM_TYPE>new ContentTreeSelectorItem(<ContentSummary>data);

        return this.optionsFactory.createOption(item, readOnly);
    }

    protected reload(inputValue: string): Q.Promise<any> {

        const deferred = Q.defer<void>();

        if (this.ifFlatLoadingMode(inputValue)) {
            this.getLoader().search(inputValue).then(() => {
                deferred.resolve(null);
            }).catch((reason: any) => {
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

                deferred.resolve(null);
            }).catch((reason: any) => {
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

    createSelectedOption(option: Option<ContentTreeSelectorItem>): SelectedOption<ContentTreeSelectorItem> {
        let optionView = !!option.getDisplayValue() ? new ContentSelectedOptionView(option) : new MissingContentSelectedOptionView(option);
        return new SelectedOption<ContentTreeSelectorItem>(optionView, this.count());
    }
}

export class MissingContentSelectedOptionView
    extends BaseSelectedOptionView<ContentTreeSelectorItem> {

    private id: string;

    constructor(option: Option<ContentTreeSelectorItem>) {
        super(option);
        this.id = option.getValue();
        this.setEditable(false);
    }

    protected appendActionButtons() {
        super.appendActionButtons();

        let message = new H6El('missing-content');
        message.setHtml(i18n('field.content.noaccess', this.id));

        this.appendChild(message);
    }
}

export class ContentSelectedOptionView
    extends RichSelectedOptionView<ContentTreeSelectorItem> {

    constructor(option: Option<ContentTreeSelectorItem>) {
        super(
            new RichSelectedOptionViewBuilder<ContentTreeSelectorItem>(option)
                .setEditable(true)
                .setDraggable(true)
        );
        this.addClass('content-selected-option-view');
    }

    resolveIconUrl(content: ContentTreeSelectorItem): string {
        return content.getIconUrl();
    }

    resolveTitle(content: ContentTreeSelectorItem): string {
        return content.getDisplayName().toString();
    }

    resolveSubTitle(content: ContentTreeSelectorItem): string {
        return content.getPath().toString();
    }

    protected onEditButtonClicked(e: MouseEvent) {
        let content = this.getOptionDisplayValue().getContent();
        let model = [ContentSummaryAndCompareStatus.fromContentSummary(content)];
        new EditContentEvent(model).fire();

        return super.onEditButtonClicked(e);
    }
}

export class ContentComboBoxBuilder<ITEM_TYPE extends ContentTreeSelectorItem>
    extends RichComboBoxBuilder<ContentTreeSelectorItem> {

    comboBoxName: string = 'contentSelector';

    selectedOptionsView: SelectedOptionsView<ContentTreeSelectorItem> =
        <SelectedOptionsView<ContentTreeSelectorItem>> new ContentSelectedOptionsView();

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

    setTreegridDropdownEnabled(value: boolean): ContentComboBoxBuilder<ITEM_TYPE> {
        this.treegridDropdownEnabled = value;
        return this;
    }

    setTreeModeTogglerAllowed(value: boolean): ContentComboBoxBuilder<ITEM_TYPE> {
        this.treeModeTogglerAllowed = value;
        return this;
    }

    setMaximumOccurrences(maximumOccurrences: number): ContentComboBoxBuilder<ITEM_TYPE> {
        super.setMaximumOccurrences(maximumOccurrences);
        return this;
    }

    setComboBoxName(value: string): ContentComboBoxBuilder<ITEM_TYPE> {
        super.setComboBoxName(value);
        return this;
    }

    setSelectedOptionsView(selectedOptionsView: SelectedOptionsView<ITEM_TYPE>): ContentComboBoxBuilder<ITEM_TYPE> {
        super.setSelectedOptionsView(selectedOptionsView);
        return this;
    }

    setLoader(loader: ContentSummaryOptionDataLoader<ITEM_TYPE>): ContentComboBoxBuilder<ITEM_TYPE> {
        super.setLoader(loader);
        return this;
    }

    setMinWidth(value: number): ContentComboBoxBuilder<ITEM_TYPE> {
        super.setMinWidth(value);
        return this;
    }

    setValue(value: string): ContentComboBoxBuilder<ITEM_TYPE> {
        super.setValue(value);
        return this;
    }

    setDelayedInputValueChangedHandling(value: number): ContentComboBoxBuilder<ITEM_TYPE> {
        super.setDelayedInputValueChangedHandling(value ? value : 750);
        return this;
    }

    setDisplayMissingSelectedOptions(value: boolean): ContentComboBoxBuilder<ITEM_TYPE> {
        super.setDisplayMissingSelectedOptions(value);
        return this;
    }

    setRemoveMissingSelectedOptions(value: boolean): ContentComboBoxBuilder<ITEM_TYPE> {
        super.setRemoveMissingSelectedOptions(value);
        return this;
    }

    setSkipAutoDropShowOnValueChange(value: boolean): ContentComboBoxBuilder<ITEM_TYPE> {
        super.setSkipAutoDropShowOnValueChange(value);
        return this;
    }

    setOptionDisplayValueViewer(value: Viewer<any>): ContentComboBoxBuilder<ITEM_TYPE> {
        super.setOptionDisplayValueViewer(value ? value : new ContentSummaryViewer());
        return this;
    }

    setOptionDataHelper(value: OptionDataHelper<ITEM_TYPE>): ContentComboBoxBuilder<ITEM_TYPE> {
        super.setOptionDataHelper(value);
        return this;
    }

    setHideComboBoxWhenMaxReached(value: boolean): ContentComboBoxBuilder<ITEM_TYPE> {
        super.setHideComboBoxWhenMaxReached(value);
        return this;
    }

    build(): ContentComboBox<ITEM_TYPE> {
        return new ContentComboBox<ITEM_TYPE>(this);
    }
}
