import {LangDirection} from '@enonic/lib-admin-ui/dom/Element';
import {Locale} from '@enonic/lib-admin-ui/locale/Locale';
import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';
import {HTMLAreaHelper} from '../../app/inputtype/ui/text/HTMLAreaHelper';
import {PageState} from '../../app/wizard/page/PageState';
import {ComponentView, ComponentViewBuilder} from '../ComponentView';
import {CreateTextComponentViewConfig} from '../CreateTextComponentViewConfig';
import {TextItemType} from './TextItemType';
import {TextPlaceholder} from './TextPlaceholder';
import {StringHelper} from '@enonic/lib-admin-ui/util/StringHelper';

export class TextComponentViewBuilder
    extends ComponentViewBuilder {

    text: string;

    constructor() {
        super();
        this.setType(TextItemType.get());
    }

    setText(value: string): this {
        this.text = value;
        return this;
    }

}

export class TextComponentView
    extends ComponentView {

    private value: string;

    public static debug: boolean = false;

    private static DEFAULT_TEXT: string = '';

    constructor(builder: TextComponentViewBuilder) {
        super(builder.setPlaceholder(new TextPlaceholder()));

        const normalizedValue = this.normalizeInitialValue(builder.text);

        if (TextComponentView.debug) {
            console.log(`TextComponentView.normalizeValue:\n${builder.text}\nprocessedText:\n${normalizedValue}`);
        }

        this.setText(normalizedValue);

        this.addClassEx('text-view');
        this.setTextDir();
    }

    private normalizeInitialValue(initialText?: string): string {
        if (ObjectHelper.isDefined(initialText)) {
            return initialText;
        } else {
            const isPageTemplateMode = !PageState.getState() || PageState.getState().hasTemplate();

            if (isPageTemplateMode) {
                // using html from live edit load if page is rendered using a template and no page object is present
                return this.getEl().getInnerHtml();
            } else {
                return this.liveEditParams.getTextComponentData(this.getPath().toString());
            }
        }
    }

    private setTextDir(): void {
        const contentsLangDirection: LangDirection = this.getLangDirection();

        if (contentsLangDirection === LangDirection.RTL) {
            this.setDir(LangDirection.RTL);
        }
    }

    highlight() {
        if (!this.isDragging()) {
            super.highlight();
        }
    }

    getText(): string {
        return this.value;
    }

    setText(text: string): void {
        this.value = text;
        let processedText: string;
        if (StringHelper.isBlank(text)) {
            processedText = '';
        } else {
            processedText = HTMLAreaHelper.convertRenderSrcToPreviewSrc(text, this.getLiveEditParams().contentId);
        }
        if (TextComponentView.debug) {
            console.log(`TextComponentView.setText:\n${text}\nprocessedText:\n${processedText}`);
        }
        this.setHtml(processedText, false);
        this.refreshEmptyState();
    }

    isEmpty(): boolean {
        let isEmpty = StringHelper.isBlank(this.value);
        if (TextComponentView.debug) {
            console.log(`TextComponentView.isEmpty: ${isEmpty}`);
        }
        return isEmpty;
    }

    private getLangDirection(): LangDirection {
        const lang: string = this.getLiveEditParams().language;

        if (Locale.supportsRtl(lang)) {
            return LangDirection.RTL;
        }

        return LangDirection.AUTO;
    }

    reset(): void {
        this.setText(TextComponentView.DEFAULT_TEXT);
        this.hideContextMenu();
    }

    makeDuplicateConfig(): CreateTextComponentViewConfig {
        return super.makeDuplicateConfig(new CreateTextComponentViewConfig().setText(this.getText())) as CreateTextComponentViewConfig;
    }
}
