import {ContentLayer} from '../content/ContentLayer';
import {LayerViewer} from './LayerViewer';
import {ContentLayerJson} from '../resource/json/ContentLayerJson';
import {ListContentLayerRequest} from '../resource/layer/ListContentLayerRequest';
import {LayersHelper} from './LayersHelper';
import {ContentLayerExtended} from './ContentLayerExtended';
import BaseSelectedOptionsView = api.ui.selector.combobox.BaseSelectedOptionsView;
import SelectedOption = api.ui.selector.combobox.SelectedOption;
import Option = api.ui.selector.Option;

export class LayerComboBox
    extends api.ui.selector.combobox.RichComboBox<ContentLayer> {
    constructor(maxOccurrences?: number, value?: string) {
        const builder = new api.ui.selector.combobox.RichComboBoxBuilder<ContentLayer>()
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

    protected loadOptionsAfterShowDropdown(): wemQ.Promise<void> {
        return super.loadOptionsAfterShowDropdown().then(() => {
            this.getComboBox().getComboBoxDropdownGrid().getGrid().invalidate();
        });
    }
}

class ContentLayerSelectedOptionsView
    extends BaseSelectedOptionsView<ContentLayer> {

    createSelectedOption(option: api.ui.selector.Option<ContentLayer>): SelectedOption<ContentLayer> {
        const optionView: ContentLayerSelectedOptionView = new ContentLayerSelectedOptionView(option);
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
        return LayersHelper.sortAndExtendLayers(layers);
    }

}

class LayerViewerExtended
    extends LayerViewer {

    doLayout(layer: ContentLayer) {
        super.doLayout(layer);

        const level: number = (<ContentLayerExtended>layer).getLevel();
        this.getEl().setPaddingLeft(`${level * 15}px`);
    }
}
