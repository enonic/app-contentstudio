import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';
import {Option} from '@enonic/lib-admin-ui/ui/selector/Option';
import {SelectedOptionsView} from '@enonic/lib-admin-ui/ui/selector/combobox/SelectedOptionsView';
import {ContentTypeName} from '@enonic/lib-admin-ui/schema/content/ContentTypeName';
import {OptionDataHelper} from '@enonic/lib-admin-ui/ui/selector/OptionDataHelper';
import {ComboBox} from '@enonic/lib-admin-ui/ui/selector/combobox/ComboBox';
import {ContentComboBox, ContentComboBoxBuilder} from '../ContentComboBox';
import {ImageOptionDataLoader, ImageOptionDataLoaderBuilder} from './ImageOptionDataLoader';
import {ImageContentComboboxKeyEventsHandler} from './ImageContentComboboxKeyEventsHandler';
import {ImageSelectorSelectedOptionsView} from './ImageSelectorSelectedOptionsView';
import {ImageSelectorViewer} from './ImageSelectorViewer';
import {MediaTreeSelectorItem} from '../media/MediaTreeSelectorItem';
import {ContentSummaryOptionDataLoaderBuilder} from '../ContentSummaryOptionDataLoader';
import {ResponsiveManager} from '@enonic/lib-admin-ui/ui/responsive/ResponsiveManager';
import {ResponsiveItem} from '@enonic/lib-admin-ui/ui/responsive/ResponsiveItem';
import {ResponsiveRanges} from '@enonic/lib-admin-ui/ui/responsive/ResponsiveRanges';
import {GridOptions} from '@enonic/lib-admin-ui/ui/grid/GridOptions';
import {Grid} from '@enonic/lib-admin-ui/ui/grid/Grid';
import {ContentSummary} from '../../../../content/ContentSummary';
import {ContentId} from '../../../../content/ContentId';
import {ContentTreeSelectorItem} from '../../../../item/ContentTreeSelectorItem';

export class ImageContentComboBox
    extends ContentComboBox<MediaTreeSelectorItem> {

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
        const options = this.getComboBox().getComboBoxDropdownGrid().getGrid().getOptions();

        if (options.enableGalleryMode) {
            const columnsFitInRow: number = this.getGalleryModeColumnsNumber();

            if (options.galleryModeColumns !== columnsFitInRow) {
                this.doToggleGridOptions(false, columnsFitInRow);
            }
        }
    }

    protected prepareBuilder(builder: ContentComboBoxBuilder<MediaTreeSelectorItem>) {
        super.prepareBuilder(builder);
        builder.setMaxHeight(620);

    }

    protected createLoader(builder: ImageContentComboBoxBuilder): ImageOptionDataLoader {
        return ImageOptionDataLoader.build(this.createLoaderBuilder(builder));
    }

    protected createLoaderBuilder(builder: ImageContentComboBoxBuilder): ImageOptionDataLoaderBuilder {
        return new ImageOptionDataLoaderBuilder()
            .setContent(builder.content)
            .setProject(builder.project);
    }

    getContent(contentId: ContentId): ContentSummary {
        let option = this.getOptionByValue(contentId.toString());
        if (option) {
            return (option.getDisplayValue() as MediaTreeSelectorItem).getContentSummary();
        }
        return null;
    }

    getComboBox(): ComboBox<MediaTreeSelectorItem> {
        return super.getComboBox();
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
        const grid = this.getComboBox().getComboBoxDropdownGrid().getGrid();
        grid.toggleClass('tree-mode', treeMode);

        grid.getOptions().setRowHeight(treeMode ? 40 : 198)
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
            return data as MediaTreeSelectorItem;
        }

        if (ObjectHelper.iFrameSafeInstanceOf(data, ContentSummary)) {
            return new MediaTreeSelectorItem(data as ContentSummary);
        }

        return null;
    }

    getLoader(): ImageOptionDataLoader {
        return super.getLoader() as ImageOptionDataLoader;
    }

    load() {
        this.reload(this.getComboBox().getInput().getValue());
    }

    clear() {
        super.clear();
    }

    public static create(): ImageContentComboBoxBuilder {
        return new ImageContentComboBoxBuilder();
    }
}

export class ImageContentComboBoxBuilder
    extends ContentComboBoxBuilder<MediaTreeSelectorItem> {

    comboBoxName: string = 'imageContentSelector';

    selectedOptionsView: SelectedOptionsView<ContentTreeSelectorItem> =
        new ImageSelectorSelectedOptionsView() as SelectedOptionsView<ContentTreeSelectorItem>;

    optionDisplayValueViewer: ImageSelectorViewer = new ImageSelectorViewer();

    loader: ImageOptionDataLoader;

    content: ContentSummary;

    isRequestMissingOptions: boolean = false;

    setContent(value: ContentSummary): ImageContentComboBoxBuilder {
        this.content = value;
        return this;
    }

    build(): ImageContentComboBox {
        return new ImageContentComboBox(this);
    }

}
