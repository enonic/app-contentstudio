import {ContentLayer, ContentLayerBuilder} from '../content/ContentLayer';
import {LayerViewer} from './LayerViewer';
import {ContentLayerJson} from '../resource/json/ContentLayerJson';
import {ListContentLayerRequest} from '../resource/layer/ListContentLayerRequest';
import BaseSelectedOptionsView = api.ui.selector.combobox.BaseSelectedOptionsView;
import SelectedOption = api.ui.selector.combobox.SelectedOption;
import Option = api.ui.selector.Option;

export class LayerComboBox
    extends api.ui.selector.combobox.RichComboBox<ContentLayer> {
    constructor(maxOccurrences?: number, value?: string) {
        let builder = new api.ui.selector.combobox.RichComboBoxBuilder<ContentLayer>()
            .setMaximumOccurrences(maxOccurrences || 0)
            .setComboBoxName('layerSelector')
            .setIdentifierMethod('getName')
            .setLoader(new LayerLoader())
            .setValue(value)
            .setSelectedOptionsView(new ContentLayerSelectedOptionsView())
            .setOptionDisplayValueViewer(new LayerViewerExtended())
            .setDelayedInputValueChangedHandling(500);
        super(builder);
    }

    clearSelection(forceClear: boolean = false) {
        this.getLoader().search('');
        super.clearSelection(forceClear);
    }
}

class ContentLayerSelectedOptionsView
    extends BaseSelectedOptionsView<ContentLayer> {

    createSelectedOption(option: api.ui.selector.Option<ContentLayer>): SelectedOption<ContentLayer> {

        let optionView = new ContentLayerSelectedOptionView(option);
        return new SelectedOption<ContentLayer>(optionView, this.count());
    }
}

class ContentLayerSelectedOptionView
    extends LayerViewer
    implements api.ui.selector.combobox.SelectedOptionView<ContentLayer> {

    private option: Option<ContentLayer>;

    constructor(option: Option<ContentLayer>) {
        super('selected-option');
        this.setOption(option);
        this.appendRemoveButton();
    }

    setOption(option: api.ui.selector.Option<ContentLayer>) {
        this.option = option;
        this.setObject(option.displayValue);
    }

    getOption(): api.ui.selector.Option<ContentLayer> {
        return this.option;
    }

}

class LayerLoader
    extends api.util.loader.BaseLoader<ContentLayerJson[], ContentLayer> {

    protected request: ListContentLayerRequest;

    protected createRequest(): ListContentLayerRequest {
        return new ListContentLayerRequest();
    }

    filterFn(layer: ContentLayer): boolean {
        const searchString: string = this.getSearchString().toLowerCase();
        return layer.getDisplayName().toLowerCase().indexOf(searchString) !== -1 ||
               layer.getName().toLowerCase().indexOf(searchString) !== -1;
    }

    protected processLoadedData(layers: ContentLayer[]): ContentLayer[] {
        return new LayersSorter().sort(layers);
    }

}

class LayersSorter {

    private result: ContentLayerExtended[];

    private layersToSort: ContentLayer[];

    sort(layers: ContentLayer[]): ContentLayerExtended[] {
        this.result = [];
        this.layersToSort = layers;

        this.doSort(null, 0);

        return this.result;
    }

    private doSort(parentName: string, level: number) {
        const children: ContentLayer[] = this.findDirectChildren(parentName);

        children.forEach((child: ContentLayer) => {
            this.result.push(new ContentLayerExtended(child, level));
            this.doSort(child.getName(), level + 1);
        });
    }

    private findDirectChildren(parentName: string) {
        return this.layersToSort.filter((item: ContentLayer) => item.getParentName() === parentName);
    }

}

class ContentLayerExtended
    extends ContentLayer {

    private level: number;

    constructor(source: ContentLayer, level: number) {
        super(new ContentLayerBuilder()
            .setName(source.getName())
            .setParentName(source.getParentName())
            .setDescription(source.getDescription())
            .setDisplayName(source.getDisplayName())
            .setLanguage(source.getLanguage())
            .setIcon(source.getIcon()));

        this.level = level;
    }

    getLevel(): number {
        return this.level;
    }

}

class LayerViewerExtended
    extends LayerViewer {

    doLayout(layer: ContentLayer) {
        super.doLayout(layer);

        const level: number = (<ContentLayerExtended>layer).getLevel();
        this.removeClass('level-0 level-1 level-2 level-3 level-4 level-5');
        this.addClass(`level-${level}`);
    }
}
