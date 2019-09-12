import Flag = api.ui.locale.Flag;
import ImgEl = api.dom.ImgEl;
import {ContentLayer} from '../content/ContentLayer';
import {LayersHelper} from './LayersHelper';

export class LayerIcon
    extends Flag {

    private thumbnail: ImgEl;

    constructor(layer?: ContentLayer) {
        super(!!layer ? layer.getLanguage() : '', 'layer-icon');

        this.initElements();

        if (layer && layer.hasIcon()) {
            this.setCustomThumbnailSrc(LayersHelper.makeThumbnailSrc(layer));
        }
    }

    protected initElements() {
        this.thumbnail = new ImgEl();
        this.appendChild(this.thumbnail); // appending in constructor so LayerViewer in LayerCombobox rendered correctly
    }

    setCustomThumbnailSrc(value: string) {
        this.thumbnail.setSrc(value);

        this.toggleClass('has-thumbnail', !!value);
    }

    removeCustomThumbnail() {
        this.thumbnail.setSrc('');
        this.removeClass('has-thumbnail');
    }

    reset() {
        this.removeCustomThumbnail();
        this.updateCountryCode('');
    }
}
