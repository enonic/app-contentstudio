import * as Q from 'q';
import {NamesAndIconView, NamesAndIconViewBuilder} from '@enonic/lib-admin-ui/app/NamesAndIconView';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {ItemViewIconClassResolver} from '../../../../../../page-editor/ItemViewIconClassResolver';
import {ContentRequiresSaveEvent} from '../../../../../event/ContentRequiresSaveEvent';
import {TextComponent} from '../../../../../page/region/TextComponent';
import {NamesAndIconViewSize} from '@enonic/lib-admin-ui/app/NamesAndIconViewSize';
import {StyleHelper} from '@enonic/lib-admin-ui/StyleHelper';
import {StringHelper} from '@enonic/lib-admin-ui/util/StringHelper';
import {TextComponentType} from '../../../../../page/region/TextComponentType';
import {ComponentInspectionPanel} from './ComponentInspectionPanel';
import {HtmlEditor} from '../../../../../inputtype/ui/text/HtmlEditor';
import {HtmlEditorParams} from '../../../../../inputtype/ui/text/HtmlEditorParams';
import {CONFIG} from '@enonic/lib-admin-ui/util/Config';
import {TextArea} from '@enonic/lib-admin-ui/ui/text/TextArea';
import {StylesRequest} from '../../../../../inputtype/ui/text/styles/StylesRequest';
import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';
import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {LiveEditModel} from '../../../../../../page-editor/LiveEditModel';
import {PageState} from '../../../PageState';
import {ComponentUpdatedEvent} from '../../../../../page/region/ComponentUpdatedEvent';
import {HTMLAreaHelper} from '../../../../../inputtype/ui/text/HTMLAreaHelper';
import {PageEventsManager} from '../../../../PageEventsManager';
import {ComponentTextUpdatedEvent} from '../../../../../page/region/ComponentTextUpdatedEvent';
import {HTMLAreaProxy} from '../../../../../inputtype/ui/text/dialog/HTMLAreaProxy';

export class TextInspectionPanel
    extends ComponentInspectionPanel<TextComponent> {

    private namesAndIcon: NamesAndIconView;

    private textArea: TextArea;

    private htmlEditor: HtmlEditor;

    private modelSetListeners: (() => void)[] = [];

    constructor() {
        super({
            iconClass: ItemViewIconClassResolver.resolveByType(TextComponentType.get().getShortName(), 'icon-xlarge'),
        });

        this.initElements();
        this.initListeners();
    }

    protected initElements(): void {
        this.namesAndIcon =
            new NamesAndIconView(new NamesAndIconViewBuilder().setSize(NamesAndIconViewSize.medium)).setIconClass(
                ItemViewIconClassResolver.resolveByType('text'));

        this.textArea = new TextArea('text-inspection-editor');
    }

    protected initListeners(): void {
        this.whenModelSet(() => {
            this.textArea.whenRendered(() => {
                StylesRequest.fetchStyles(this.liveEditModel.getContent().getId());
                this.initHtmlEditor(this.textArea.getId()).then((htmlEditor) => {
                    this.htmlEditor = htmlEditor;
                    this.initPageEventsListeners();
                }).catch(DefaultErrorHandler.handle);
            });
        });
    }

    private initPageEventsListeners(): void {
        PageState.getEvents().onComponentUpdated((event: ComponentUpdatedEvent) => {
            if (event instanceof ComponentTextUpdatedEvent) {
                this.handleTextComponentUpdated(event);
            }
        });
    }

    private handleTextComponentUpdated(event: ComponentTextUpdatedEvent): void {
        this.updateNamesAndIconView();

        if (event.getOrigin() !== 'inspector' && event.getPath().equals(this.component?.getPath())) {
            const content = HTMLAreaHelper.convertRenderSrcToPreviewSrc(event.getText(), this.liveEditModel.getContent().getId());

            if (content !== this.getEditorContent()) {
                this.htmlEditor.setData(content);
            }
        }
    }

    private whenModelSet(listener: () => void): void {
        if (this.liveEditModel) {
            listener();
        } else {
            this.modelSetListeners.push(listener);
        }
    }

    private getEditorContent(): string {
        return HTMLAreaHelper.convertPreviewSrcToRenderSrc(this.htmlEditor.getData());
    }

    setModel(liveEditModel: LiveEditModel): void {
        super.setModel(liveEditModel);

        this.modelSetListeners.forEach((listener) => listener());
        this.modelSetListeners = [];
    }

    private initHtmlEditor(editorId: string): Q.Promise<HtmlEditor> {
        let isFocused = false;

        const focusHandler = () => {
            isFocused = true;
        };

        const blurHandler = () => {
            isFocused = false;
        };

        const editorValueChangedHandler = () => {
            if (isFocused) {
                PageEventsManager.get().notifyTextComponentUpdateRequested(this.component.getPath(), this.getEditorContent(), 'inspector');
            }
        };

        return HTMLAreaHelper.isSourceCodeEditable().then((isEditable) => {
            const htmlEditorParams: HtmlEditorParams = HtmlEditorParams.create()
                .setEditorContainerId(editorId)
                .setAssetsUri(CONFIG.getString('assetsUri'))
                .setCreateDialogHandler(HTMLAreaProxy.createAndOpenDialog)
                .setSaveHandler(() => {
                    new ContentRequiresSaveEvent(this.liveEditModel.getContent().getContentId()).fire();
                })
                .setInline(false)
                .setFocusHandler(focusHandler)
                .setBlurHandler(blurHandler)
                .setNodeChangeHandler(editorValueChangedHandler)
                .setEditableSourceCode(isEditable)
                .setContent(this.liveEditModel.getContent())
                .setApplicationKeys(this.liveEditModel.getSiteModel().getApplicationKeys())
                .setCustomStylesToBeUsed(true)
                .build();

            return HtmlEditor.create(htmlEditorParams);
        });
    }

    setComponent(textComponent: TextComponent) {
        super.setComponent(textComponent);

        if (textComponent) {
            this.updateNamesAndIconView();

            const content = HTMLAreaHelper.convertRenderSrcToPreviewSrc(textComponent.getText(), this.liveEditModel.getContent().getId());
            this.htmlEditor?.setData(content);
        }
    }

    private updateNamesAndIconView(): void {
        if (!this.component) {
            return;
        }

        const text = StringHelper.htmlToString(this.component.getText()?.trim()).trim() || this.component.getName().toString();
        const path = this.component.getPath();
        this.namesAndIcon.setMainName(text);
        this.namesAndIcon.setSubName(path?.isRoot() ? undefined : path?.toString());
        this.namesAndIcon.setIconClass(StyleHelper.getCommonIconCls(TextComponentType.get().getShortName()));
    }

    getName(): string {
        return i18n('widget.components.insert.text');
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered) => {
            this.addClass('text-inspection-panel');
            this.appendChild(this.namesAndIcon);

            const textAreaWrapper = new DivEl('text-inspection-editor-wrapper custom-html-editor-container');
            textAreaWrapper.appendChildren(new DivEl('sticky-dock'), this.textArea);
            this.appendChild(textAreaWrapper);

            return rendered;
        });
    }

}
