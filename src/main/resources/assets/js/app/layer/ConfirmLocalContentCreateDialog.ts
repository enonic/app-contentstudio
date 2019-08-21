import ModalDialog = api.ui.dialog.ModalDialog;
import i18n = api.util.i18n;
import ModalDialogConfig = api.ui.dialog.ModalDialogConfig;
import Action = api.ui.Action;
import Element = api.dom.Element;
import LocaleViewer = api.ui.locale.LocaleViewer;
import Locale = api.locale.Locale;
import GetLocalesRequest = api.locale.GetLocalesRequest;
import {LayerContext} from './LayerContext';

export class ConfirmLocalContentCreateDialog
    extends ModalDialog {

    private createLocalCopyAction: Action;

    private localCopyCreateHandler: Function;

    private cancelHandler: Function;

    constructor() {
        super(<ModalDialogConfig>{
            title: i18n('dialog.layers.confirm.local.create.title'),
            class: 'layer-dialog layer-confirm-local-content-create-dialog'
        });
    }

    initElements() {
        super.initElements();

        this.createLocalCopyAction =
            new Action(i18n('dialog.layers.confirm.local.create.button', LayerContext.get().getCurrentLayer().getDisplayName()));
    }

    protected initListeners() {
        super.initListeners();

        this.createLocalCopyAction.onExecuted(() => {
            this.close(false);

            if (this.localCopyCreateHandler) {
                this.localCopyCreateHandler();
            }
        });
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            this.appendChildToHeader(this.createSubHeader());
            this.appendChildToContentPanel(this.createBodyText());
            this.appendChildToContentPanel(this.createLocaleViewer());
            this.addCancelButtonToBottom();
            this.addAction(this.createLocalCopyAction, true);

            return rendered;
        });
    }

    close(invokeCancelHandler: boolean = true) {
        super.close();
        if (invokeCancelHandler) {
            this.cancelHandler();
        }
    }

    setLocalCopyCreateHandler(handler: Function) {
        this.localCopyCreateHandler = handler;
    }

    setCancelHandler(handler: Function) {
        this.cancelHandler = handler;
    }

    private createSubHeader(): Element {
        const subHeader: api.dom.Element = new api.dom.H6El('subtitle');
        subHeader.setHtml(i18n('dialog.layers.confirm.local.create.subtitle'));

        return subHeader;
    }

    private createBodyText(): Element {
        const bodyText: api.dom.Element = new api.dom.H6El('bodytext');
        bodyText.setHtml(i18n('dialog.layers.confirm.local.create.body.text', LayerContext.get().getCurrentLayer().getDisplayName()));

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
