import {ObjectHelper} from 'lib-admin-ui/ObjectHelper';
import {ContentId} from 'lib-admin-ui/content/ContentId';
import {ContentSummary} from 'lib-admin-ui/content/ContentSummary';
import {Option} from 'lib-admin-ui/ui/selector/Option';
import {SelectedOptionsView} from 'lib-admin-ui/ui/selector/combobox/SelectedOptionsView';
import {ContentTypeName} from 'lib-admin-ui/schema/content/ContentTypeName';
import {OptionDataHelper} from 'lib-admin-ui/ui/selector/OptionDataHelper';
import {ComboBox} from 'lib-admin-ui/ui/selector/combobox/ComboBox';
import {ContentComboBox, ContentComboBoxBuilder} from '../ContentComboBox';
import {ImageOptionDataLoader} from './ImageOptionDataLoader';
import {ImageContentComboboxKeyEventsHandler} from './ImageContentComboboxKeyEventsHandler';
import {ImageSelectorSelectedOptionsView} from './ImageSelectorSelectedOptionsView';
import {ImageSelectorViewer} from './ImageSelectorViewer';
import {MediaTreeSelectorItem} from '../media/MediaTreeSelectorItem';
import {ContentSummaryOptionDataLoaderBuilder} from '../ContentSummaryOptionDataLoader';
import {ResponsiveManager} from 'lib-admin-ui/ui/responsive/ResponsiveManager';
import {ResponsiveItem} from 'lib-admin-ui/ui/responsive/ResponsiveItem';
import {ResponsiveRanges} from 'lib-admin-ui/ui/responsive/ResponsiveRanges';
import {GridOptions} from 'lib-admin-ui/ui/grid/GridOptions';
import {Grid} from 'lib-admin-ui/ui/grid/Grid';

export class ImageContentComboBox
    extends ContentComboBox<MediaTreeSelectorItem> {

    protected maxHeight: number = 250;

    private item: ResponsiveItem;

    constructor(builder: ImageContentComboBoxBuilder) {
        super(builder);

        this.addClass('image-content-combo-box');
        this.initAvailableSizeChangeListener();
        this.toggleGridOptions(builder.treegridDropdownEnabled);
        this.setKeyEventsHandler(new ImageContentComboboxKeyEventsHandler(this));
    }

    private initAvailableSizeChangeListener() {
        this.item = ResponsiveManager.onAvailableSizeChanged(this, (item: ResponsiveItem) => this.updateGalleryModeColumnsNumber());
    }

    private updateGalleryModeColumnsNumber() {
        const options: GridOptions<any> = this.getComboBox().getComboBoxDropdownGrid().getGrid().getOptions();

        if (options.enableGalleryMode) {
            const columnsFitInRow: number = this.getGalleryModeColumnsNumber();

            if (options.galleryModeColumns !== columnsFitInRow) {
                this.doToggleGridOptions(false, columnsFitInRow);
            }
        }
    }

    protected createLoader(builder: ImageContentComboBoxBuilder): ImageOptionDataLoader {
        return ImageOptionDataLoader.build(this.createLoaderBuilder(builder));
    }

    protected createLoaderBuilder(builder: ImageContentComboBoxBuilder): ContentSummaryOptionDataLoaderBuilder {
        return super.createLoaderBuilder(builder)
            .setContent(builder.content)
            .setContentTypeNames([ContentTypeName.IMAGE.toString(), ContentTypeName.MEDIA_VECTOR.toString()]);
    }

    getContent(contentId: ContentId): ContentSummary {
        let option = this.getOptionByValue(contentId.toString());
        if (option) {
            return (<MediaTreeSelectorItem>option.getDisplayValue()).getContentSummary();
        }
        return null;
    }

    getComboBox(): ComboBox<MediaTreeSelectorItem> {
        return <ComboBox<MediaTreeSelectorItem>>super.getComboBox();
    }

    protected toggleGridOptions(treeMode: boolean) {
        const columnsFitInRow: number = treeMode ? 3 : this.getGalleryModeColumnsNumber();

        this.doToggleGridOptions(treeMode, columnsFitInRow);
    }

    private getGalleryModeColumnsNumber(): number {
        if (this.item.isInRangeOrSmaller(ResponsiveRanges._240_360)) {
            return 1;
        }

        if (this.item.isInRangeOrSmaller(ResponsiveRanges._360_540)) {
            return 2;
        }

        return 3;
    }

    private doToggleGridOptions(treeMode: boolean, columns: number) {
        const grid: Grid<any> = this.getComboBox().getComboBoxDropdownGrid().getGrid();
        grid.toggleClass('tree-mode', treeMode);

        grid.getOptions().setRowHeight(treeMode ? 50 : 198)
            .setEnableGalleryMode(!treeMode)
            .setGalleryModeColumns(columns);

        grid.invalidate();
    }

    protected createOption(data: Object, readOnly?: boolean): Option<MediaTreeSelectorItem> {
        const item: MediaTreeSelectorItem = this.dataToMediaTreeSelectorItem(data);
        if (item) {
            return this.optionsFactory.createOption(item, readOnly);
        }

        return null;
    }

    private dataToMediaTreeSelectorItem(data: Object): MediaTreeSelectorItem {
        if (ObjectHelper.iFrameSafeInstanceOf(data, MediaTreeSelectorItem)) {
            return <MediaTreeSelectorItem>data;
        }

        if (ObjectHelper.iFrameSafeInstanceOf(data, ContentSummary)) {
            return new MediaTreeSelectorItem(<ContentSummary>data);
        }

        return null;
    }

    getLoader(): ImageOptionDataLoader {
        return <ImageOptionDataLoader>super.getLoader();
    }

    load() {
        this.reload(this.getComboBox().getInput().getValue());
    }

    public static create(): ImageContentComboBoxBuilder {
        return new ImageContentComboBoxBuilder();
    }
}

export class ImageContentComboBoxBuilder
    extends ContentComboBoxBuilder<MediaTreeSelectorItem> {

    comboBoxName: string = 'imageContentSelector';

    selectedOptionsView: SelectedOptionsView<MediaTreeSelectorItem> =
        <SelectedOptionsView<MediaTreeSelectorItem>>new ImageSelectorSelectedOptionsView();

    optionDisplayValueViewer: ImageSelectorViewer = new ImageSelectorViewer();

    loader: ImageOptionDataLoader;

    content: ContentSummary;

    isRequestMissingOptions: boolean = false;

    setContent(value: ContentSummary): ImageContentComboBoxBuilder {
        this.content = value;
        return this;
    }

    setValue(value: string): ImageContentComboBoxBuilder {
        super.setValue(value);
        return this;
    }

    setMaximumOccurrences(value: number): ImageContentComboBoxBuilder {
        super.setMaximumOccurrences(value);
        return this;
    }

    setLoader(value: ImageOptionDataLoader): ImageContentComboBoxBuilder {
        super.setLoader(value);
        return this;
    }

    setMinWidth(value: number): ImageContentComboBoxBuilder {
        super.setMinWidth(value);
        return this;
    }

    setSelectedOptionsView(value: SelectedOptionsView<any>): ImageContentComboBoxBuilder {
        super.setSelectedOptionsView(value);
        return this;
    }

    setOptionDisplayValueViewer(value: ImageSelectorViewer): ImageContentComboBoxBuilder {
        super.setOptionDisplayValueViewer(value);
        return this;
    }

    setOptionDataHelper(value: OptionDataHelper<MediaTreeSelectorItem>): ImageContentComboBoxBuilder {
        super.setOptionDataHelper(value);
        return this;
    }

    setTreegridDropdownEnabled(value: boolean): ImageContentComboBoxBuilder {
        super.setTreegridDropdownEnabled(value);
        return this;
    }

    setTreeModeTogglerAllowed(value: boolean): ImageContentComboBoxBuilder {
        super.setTreeModeTogglerAllowed(value);
        return this;
    }

    build(): ImageContentComboBox {
        return new ImageContentComboBox(this);
    }

}
