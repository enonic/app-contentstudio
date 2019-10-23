import {ObjectHelper} from 'lib-admin-ui/ObjectHelper';
import {ContentId} from 'lib-admin-ui/content/ContentId';
import {ContentSummary} from 'lib-admin-ui/content/ContentSummary';
import {Option} from 'lib-admin-ui/ui/selector/Option';
import {SelectedOptionsView} from 'lib-admin-ui/ui/selector/combobox/SelectedOptionsView';
import {ContentTypeName} from 'lib-admin-ui/schema/content/ContentTypeName';
import {OptionDataHelper} from 'lib-admin-ui/ui/selector/OptionDataHelper';
import {ComboBox, ComboBoxConfig} from 'lib-admin-ui/ui/selector/combobox/ComboBox';
import {ContentComboBox, ContentComboBoxBuilder} from '../ContentComboBox';
import {ImageOptionDataLoader} from './ImageOptionDataLoader';
import {ImageContentComboboxKeyEventsHandler} from './ImageContentComboboxKeyEventsHandler';
import {ImageSelectorSelectedOptionsView} from './ImageSelectorSelectedOptionsView';
import {ImageSelectorViewer} from './ImageSelectorViewer';
import {MediaTreeSelectorItem} from '../media/MediaTreeSelectorItem';
import {ContentTreeSelectorItem} from '../../../../item/ContentTreeSelectorItem';

export class ImageContentComboBox
    extends ContentComboBox<MediaTreeSelectorItem> {

    constructor(builder: ImageContentComboBoxBuilder) {
        let loader = builder.loader || ImageOptionDataLoader.create().setContent(builder.content).setContentTypeNames(
            [ContentTypeName.IMAGE.toString(), ContentTypeName.MEDIA_VECTOR.toString()]).build();

        builder.setLoader(loader).setMaxHeight(250);

        super(builder);

        this.addClass('image-content-combo-box');
        this.toggleGridOptions(builder.treegridDropdownEnabled);
        this.setKeyEventsHandler(new ImageContentComboboxKeyEventsHandler(this));
    }

    getContent(contentId: ContentId): ContentSummary {
        let option = this.getOptionByValue(contentId.toString());
        if (option) {
            return (<MediaTreeSelectorItem>option.displayValue).getContentSummary();
        }
        return null;
    }

    getComboBox(): ComboBox<MediaTreeSelectorItem> {
        return <ComboBox<MediaTreeSelectorItem>>super.getComboBox();
    }

    protected toggleGridOptions(treeMode: boolean) {
        const grid = this.getComboBox().getComboBoxDropdownGrid().getGrid();

        grid.getOptions().setRowHeight(treeMode ? 50 : 198)
            .setEnableGalleryMode(!treeMode)
            .setGalleryModeColumns(3);

        return true;
    }

    protected createOption(data: Object, readOnly?: boolean): Option<MediaTreeSelectorItem> {

        let option;

        if (ObjectHelper.iFrameSafeInstanceOf(data, MediaTreeSelectorItem)) {
            option = this.optionsFactory.createOption(<MediaTreeSelectorItem>data, readOnly);
        } else if (ObjectHelper.iFrameSafeInstanceOf(data, ContentSummary)) {
            option = {
                value: (<ContentSummary>data).getId(),
                displayValue: new MediaTreeSelectorItem(<ContentSummary>data)
            };
        }

        return option;
    }

    protected createComboboxConfig(builder: ContentComboBoxBuilder<MediaTreeSelectorItem>): ComboBoxConfig<ContentTreeSelectorItem> {
        const config = super.createComboboxConfig(builder);
        config.treegridDropdownAllowed = true; // to make use DropdownTreeGrid for displaying options

        return config;
    }

    getLoader(): ImageOptionDataLoader {
        return <ImageOptionDataLoader>super.getLoader();
    }

    public static create(): ImageContentComboBoxBuilder {
        return new ImageContentComboBoxBuilder();
    }
}

export class ImageContentComboBoxBuilder
    extends ContentComboBoxBuilder<MediaTreeSelectorItem> {

    comboBoxName: string = 'imageContentSelector';

    selectedOptionsView: SelectedOptionsView<MediaTreeSelectorItem> =
        <SelectedOptionsView<MediaTreeSelectorItem>> new ImageSelectorSelectedOptionsView();

    optionDisplayValueViewer: ImageSelectorViewer = new ImageSelectorViewer();

    loader: ImageOptionDataLoader;

    content: ContentSummary;

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
