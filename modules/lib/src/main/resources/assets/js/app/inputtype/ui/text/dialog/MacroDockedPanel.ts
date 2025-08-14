import * as $ from 'jquery';
import Q from 'q';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {AppHelper} from '@enonic/lib-admin-ui/util/AppHelper';
import {ResponsiveManager} from '@enonic/lib-admin-ui/ui/responsive/ResponsiveManager';
import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';
import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {FormView} from '@enonic/lib-admin-ui/form/FormView';
import {DockedPanel} from '@enonic/lib-admin-ui/ui/panel/DockedPanel';
import {Panel} from '@enonic/lib-admin-ui/ui/panel/Panel';
import {PropertySet} from '@enonic/lib-admin-ui/data/PropertySet';
import {LoadMask} from '@enonic/lib-admin-ui/ui/mask/LoadMask';
import {ContentFormContext} from '../../../../ContentFormContext';
import {Content} from '../../../../content/Content';
import {PropertyTree} from '@enonic/lib-admin-ui/data/PropertyTree';
import {IFrameEl} from '@enonic/lib-admin-ui/dom/IFrameEl';
import {ContentSummary} from '../../../../content/ContentSummary';
import {GetPreviewRequest} from '../../../../macro/resource/GetPreviewRequest';
import {GetPreviewStringRequest} from '../../../../macro/resource/GetPreviewStringRequest';
import {MacroDescriptor} from '@enonic/lib-admin-ui/macro/MacroDescriptor';
import {MacroPreview} from '../../../../macro/MacroPreview';
import {StringHelper} from '@enonic/lib-admin-ui/util/StringHelper';

export class MacroDockedPanel
    extends DockedPanel {

    private configurationTabName: string = i18n('dialog.macro.tab.configuration');
    private previewTabName: string = i18n('dialog.macro.tab.preview');
    private macroFormIncompleteMessage: string = i18n('dialog.macro.form.incomplete');
    private previewLoadErrorMessage: string = i18n('dialog.macro.tab.preview.loaderror');

    private configPanel: Panel;
    private previewPanel: Panel;

    private content: ContentSummary;
    private macroDescriptor: MacroDescriptor;
    private previewResolved: boolean = false;
    private macroPreview: MacroPreview;
    private data: PropertySet;
    private previewPanelLoadMask: LoadMask;
    private configPanelLoadMask: LoadMask;

    private formValueChangedHandler: () => void;

    private panelRenderedListeners: (() => void)[] = [];

    constructor() {
        super();

        this.addItem(this.configurationTabName, true, this.createConfigurationPanel());
        this.addItem(this.previewTabName, true, this.createPreviewPanel());

        this.previewPanelLoadMask = new LoadMask(this.previewPanel);
        this.configPanelLoadMask = new LoadMask(this.configPanel);
        this.appendChild(this.previewPanelLoadMask);
        this.appendChild(this.configPanelLoadMask);

        this.handleConfigPanelShowEvent();
        this.handlePreviewPanelShowEvent();

        this.formValueChangedHandler = () => {
            this.previewResolved = false;
        };
    }

    public setContent(content: ContentSummary) {
        this.content = content;
    }

    private createConfigurationPanel(): Panel {
        return this.configPanel = new Panel('macro-config-panel');
    }

    private createPreviewPanel(): Panel {
        return this.previewPanel = new Panel('macro-preview-panel');
    }

    private handlePreviewPanelShowEvent() {
        this.previewPanel.onShown(() => {
            if (this.validateMacroForm()) {
                if (!!this.macroDescriptor && !this.previewResolved) {
                    this.previewPanel.removeChildren();
                    this.previewPanelLoadMask.show();
                    this.fetchPreview().then((macroPreview: MacroPreview) => {
                        this.previewResolved = true;
                        this.macroPreview = macroPreview;
                        this.renderPreview(macroPreview);
                    }).catch((reason) => {
                        DefaultErrorHandler.handle(reason);
                        this.renderPreviewWithMessage(this.previewLoadErrorMessage);
                    }).finally(() => {
                        this.previewPanelLoadMask.hide();
                    });
                } else {
                    this.notifyPanelRendered();
                }
            } else {
                this.renderPreviewWithMessage(this.macroFormIncompleteMessage);
            }
        });
    }

    private handleConfigPanelShowEvent() {
        this.configPanel.onShown(() => {
            this.notifyPanelRendered();
        });
    }

    private fetchPreview(): Q.Promise<MacroPreview> {
        return new GetPreviewRequest(
            new PropertyTree(this.data),
            this.macroDescriptor.getKey(),
            this.content.getPath()).sendAndParse().then((result: MacroPreview) => {
                if (this.isSystemEmbedMacro()) {
                    return MacroPreview.create()
                        .setPageContributions(result.getPageContributions())
                        .setMacroString(result.getMacroString())
                        .setHtml(`<div class='embed-preview'>${i18n('dialog.macro.form.embed.preview')}</div>`)
                        .build();
                }

                return result;
        });
    }

    private isSystemEmbedMacro(): boolean {
        return this.macroDescriptor.getKey().getRefString().toUpperCase() === 'SYSTEM:EMBED';
    }

    private getSanitizedData(): PropertyTree {
        const propertyTree = new PropertyTree(this.data);
        const bodyProperty = this.data.getProperty('body');

        if (bodyProperty) {
            propertyTree.setString('body', bodyProperty.getIndex(), StringHelper.escapeHtml(bodyProperty.getString()));
        }

        return propertyTree;
    }

    private fetchMacroString(): Q.Promise<string> {
        return new GetPreviewStringRequest(this.getSanitizedData(), this.macroDescriptor.getKey()).sendAndParse();
    }

    public getMacroPreviewString(): Q.Promise<string> {
        let deferred = Q.defer<string>();
        if (this.previewResolved) {
            deferred.resolve(this.macroPreview.getMacroString());
        } else {
            this.configPanelLoadMask.show();
            this.fetchMacroString().then((macroString: string) => {
                deferred.resolve(StringHelper.htmlToString(macroString));
            }).catch((reason) => {
                deferred.reject(reason);
            }).finally(() => {
                this.configPanelLoadMask.hide();
            });
        }

        return deferred.promise;
    }

    private renderPreviewWithMessage(message: string) {
        this.previewPanel.removeChildren();
        let appendMe = new DivEl('preview-message');
        appendMe.setHtml(message);
        this.previewPanel.appendChild(appendMe);
    }

    private renderPreview(macroPreview: MacroPreview) {
        // render in iframe if there are scripts to be included for preview rendering
        if (macroPreview.getPageContributions().hasAtLeastOneScript()) {
            this.previewPanel.appendChild(this.makePreviewFrame(macroPreview));
        } else {
            const appendMe: DivEl = new DivEl('preview-content');
            appendMe.setHtml(macroPreview.getHtml(), false);
            this.previewPanel.appendChild(appendMe);
            this.notifyPanelRendered();
        }
    }

    private makePreviewFrame(macroPreview: MacroPreview): MacroPreviewFrame {
        const previewFrame = new MacroPreviewFrame(macroPreview);
        const previewFrameRenderedHandler: () => void = () => {
            this.notifyPanelRendered();
        };

        previewFrame.onPreviewRendered(previewFrameRenderedHandler);
        previewFrame.onRemoved(() => {
            previewFrame.unPreviewRendered(previewFrameRenderedHandler);
        });

        return previewFrame;
    }

    public getConfigForm(): FormView {
        return (this.configPanel.getFirstChild()) as FormView;
    }

    public validateMacroForm(): boolean {
        let isValid = true;
        const form = (this.configPanel.getFirstChild()) as FormView;

        if (form) {
            isValid = form.validate(false).isValid();
            form.displayValidationErrors(!isValid);
        }
        return isValid;
    }

    public setMacroDescriptor(macroDescriptor: MacroDescriptor, data?: PropertySet) {
        this.macroDescriptor = macroDescriptor;
        this.previewResolved = false;

        this.initPropertySetForDescriptor(data);
        this.showDescriptorConfigView(macroDescriptor);
    }

    private showDescriptorConfigView(macroDescriptor: MacroDescriptor) {
        this.selectPanel(this.configPanel);

        if (macroDescriptor) {
            let formView: FormView = new FormView(
                ContentFormContext.create().setPersistedContent(this.content as Content).build(),
                macroDescriptor.getForm(), this.data);

            this.renderConfigView(formView);
        }
    }

    private initPropertySetForDescriptor(data?: PropertySet) {
        if (!!this.data) {
            this.data.unChanged(this.formValueChangedHandler);
        }
        this.data = !!data ? data : new PropertySet();
        this.data.onChanged(this.formValueChangedHandler);
    }

    private renderConfigView(formView: FormView) {
        this.configPanel.removeChildren();

        formView.layout().then(() => {
            this.configPanel.appendChild(formView);
            ResponsiveManager.fireResizeEvent();
        });
    }

    onPanelRendered(listener: () => void) {
        this.panelRenderedListeners.push(listener);
    }

    unPanelRendered(listener: () => void) {
        this.panelRenderedListeners = this.panelRenderedListeners.filter((curr) => {
            return curr !== listener;
        });
    }

    private notifyPanelRendered() {
        this.panelRenderedListeners.forEach((listener) => {
            listener();
        });
    }
}

export class MacroPreviewFrame
    extends IFrameEl {

    private id: string = 'macro-preview-frame-id';

    private macroPreview: MacroPreview;

    private debouncedResizeHandler: () => void = AppHelper.debounce(() => {
        this.adjustFrameHeight();
    }, 500, false);

    private previewRenderedListeners: (() => void)[] = [];

    constructor(macroPreview: MacroPreview) {
        super('preview-iframe');
        this.setId(this.id);
        this.macroPreview = macroPreview;

        this.initFrameContent(macroPreview);
    }

    private initFrameContent(macroPreview: MacroPreview) {
        this.onLoaded(() => {

            let doc = this.getHTMLElement()['contentWindow'] || this.getHTMLElement()['contentDocument'];
            if (doc.document) {
                doc = doc.document;
            }

            doc.open();
            doc.write(this.makeContentForPreviewFrame(macroPreview));
            doc.close();

            if (this.isYoutubePreview()) {
                doc.body.style.marginRight = 4;
            }

            this.debouncedResizeHandler();
            this.adjustFrameHeightOnContentsUpdate();
        });
    }

    private isYoutubePreview(): boolean {
        return this.macroPreview.getMacroString().indexOf('[youtube') === 0;
    }

    private isInstagramPreview(): boolean {
        return this.macroPreview.getMacroString().indexOf('[instagram') === 0;
    }

    private adjustFrameHeightOnContentsUpdate() {
        let frameWindow = this.getHTMLElement()['contentWindow'];
        if (frameWindow) {
            let observer = new MutationObserver(this.debouncedResizeHandler);
            let config = {attributes: true, childList: true, characterData: true};

            observer.observe(frameWindow.document.body, config);
        }
    }

    private adjustFrameHeight() {
        try {
            let frameWindow = this.getHTMLElement()['contentWindow'] || this.getHTMLElement()['contentDocument'];
            let scrollHeight = frameWindow.document.body.scrollHeight;
            let maxFrameHeight = this.getMaxFrameHeight();
            this.getEl().setHeightPx(scrollHeight > 150
                                     ? scrollHeight > maxFrameHeight ? maxFrameHeight : scrollHeight + (this.isInstagramPreview() ? 18 : 0)
                                     : $('#' + this.id).contents().find('body').outerHeight());
            this.notifyPreviewRendered();
        } catch (error) { /* empty*/ }
    }

    private getMaxFrameHeight(): number {
        return $(window).height() - 250;
    }

    private makeContentForPreviewFrame(macroPreview: MacroPreview): string {
        let result = '';
        macroPreview.getPageContributions().getHeadBegin().forEach(script => result += script);
        macroPreview.getPageContributions().getHeadEnd().forEach(script => result += script);
        macroPreview.getPageContributions().getBodyBegin().forEach(script => result += script);
        result += macroPreview.getHtml();
        macroPreview.getPageContributions().getBodyEnd().forEach(script => result += script);
        return result;
    }

    onPreviewRendered(listener: () => void) {
        this.previewRenderedListeners.push(listener);
    }

    unPreviewRendered(listener: () => void) {
        this.previewRenderedListeners = this.previewRenderedListeners.filter((curr) => {
            return curr !== listener;
        });
    }

    private notifyPreviewRendered() {
        this.previewRenderedListeners.forEach((listener) => {
            listener();
        });
    }
}
