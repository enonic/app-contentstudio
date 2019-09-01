import i18n = api.util.i18n;
import ModalDialogConfig = api.ui.dialog.ModalDialogConfig;
import Element = api.dom.Element;
import LocaleViewer = api.ui.locale.LocaleViewer;
import Locale = api.locale.Locale;
import GetLocalesRequest = api.locale.GetLocalesRequest;
import ConfirmationDialog = api.ui.dialog.ConfirmationDialog;
import {LayerContext} from './LayerContext';

export class ConfirmLocalContentCreateDialog
    extends ConfirmationDialog {

    constructor() {
        super(<ModalDialogConfig>{
            title: i18n('dialog.layers.confirm.local.create.title'),
            class: 'layer-dialog layer-confirm-local-content-create-dialog'
        });
    }

    initElements() {
        super.initElements();

        this.yesAction.setLabel(i18n('dialog.layers.confirm.local.create.button'));
        this.noAction.setLabel(i18n('action.view'));
    }

    protected initListeners() {
        super.initListeners();
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            this.addClass('layer-dialog layer-confirm-local-content-create-dialog');
            this.appendChildToHeader(this.createSubHeader());
            this.appendChildToContentPanel(this.createBodyText());
            this.appendChildToContentPanel(this.createLocaleViewer());

            return rendered;
        });
    }

    private createSubHeader(): Element {
        const subHeader: api.dom.Element = new api.dom.H6El('subtitle');
        subHeader.setHtml(i18n('dialog.layers.confirm.local.create.subtitle'));

        return subHeader;
    }

    private createBodyText(): Element {
        const bodyText: api.dom.Element = new api.dom.H6El('bodytext');
        const currentLayer = LayerContext.get().getCurrentLayer();
        bodyText.setHtml(i18n('dialog.layers.confirm.local.create.body.text', currentLayer.getDisplayName(), currentLayer.getName()) + ':');

        return bodyText;
    }

    private createLocaleViewer(): LocaleViewer {
        const localeViewer: LocaleViewer = new LocaleViewer();

        new GetLocalesRequest().sendAndParse().then((locales: Locale[]) => {
            const layerLanguage: string = LayerContext.get().getCurrentLayer().getLanguage();
            const layerLocales: Locale[] = locales.filter((locale: Locale) => {
                if (locale.getProcessedTag() === layerLanguage) {
                    return true;
                }
            });

            if (layerLocales.length > 0) {
                localeViewer.setObject(layerLocales[0]);
            }
        }).catch(api.DefaultErrorHandler.handle);

        return localeViewer;
    }
}
