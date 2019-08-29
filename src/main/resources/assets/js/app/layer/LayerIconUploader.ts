import FormItemEl = api.dom.FormItemEl;
import Locale = api.locale.Locale;
import {LayerIcon} from './LayerIcon';

// TODO: Replace `FormItemEl` with `FormInputEl` and make it upload icon
export class LayerIconUploader
    extends FormItemEl {

    private locale: Locale;

    private icon: LayerIcon;

    constructor() {
        super('div', 'layer-icon-uploader');
        this.initElements();
    }

    protected initElements() {
        this.icon = new LayerIcon('');
    }

    updateIconByLocale(locale: Locale) {
        this.locale = locale;
        const code = locale != null ? locale.getTag() : '';
        this.icon.updateCountryCode(code);
    }

    updateIconByTag(value: string) {
        this.icon.updateCountryCode(value);
    }

    reset() {
        this.updateIconByLocale(null);
    }

    doRender(): wemQ.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            this.appendChild(this.icon);

            return rendered;
        });
    }
}
