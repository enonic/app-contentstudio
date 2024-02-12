import {HtmlEditor, SagaHtmlEditorEventData} from './HtmlEditor';
import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';
import {AppHelper} from '@enonic/lib-admin-ui/util/AppHelper';
import {UpdateSagaWidgetEvent} from '../../../view/context/widget/saga/event/UpdateSagaWidgetEvent';
import {ToggleContextPanelEvent} from '../../../view/context/ToggleContextPanelEvent';
import {ContextPanelState} from '../../../view/context/ContextPanelState';
import {HtmlEditorParams} from './HtmlEditorParams';
import {StartSagaWidgetEvent} from '../../../view/context/widget/saga/event/StartSagaWidgetEvent';
import {InputInteractionEventType} from '@enonic/lib-admin-ui/form/InputInteractionData';
import {InputInteractionEvent} from '@enonic/lib-admin-ui/form/InputInteractionEvent';

export class HtmlEditorSagaEventsOperator {

    private readonly editor: CKEDITOR.editor;

    private readonly htmlEditor: HtmlEditor;

    private readonly htmlEditorParams: HtmlEditorParams;

    private previousSelection: CKEDITOR.dom.selection;

    private eventType: InputInteractionEventType = 'focus';

    private debouncedUpdateSaga: () => void;

    constructor(htmlEditor: HtmlEditor, htmlEditorParams: HtmlEditorParams, editor: CKEDITOR.editor) {
        this.htmlEditor = htmlEditor;
        this.editor = editor;
        this.htmlEditorParams = htmlEditorParams;

        this.initElements();
        this.initListeners();
    }

    private initElements(): void {
        this.debouncedUpdateSaga = AppHelper.debounce(() => {
            const data = this.getSagaData(this.editor);
            new UpdateSagaWidgetEvent(
                {
                    ...data,
                    editor: this.htmlEditor,
                    label: this.htmlEditorParams.getLabel(),
                    content: this.htmlEditorParams.getContent()
                }).fire();

            this.fireInputInteractionEvent();
        }, 200);
    }

    private initListeners(): void {
        let intervalNumber: number;
        let intervalFunction = this.checkAndHandleSelectionChange.bind(this);


        this.editor.on('openSaga', () => {
            new ToggleContextPanelEvent(ContextPanelState.EXPANDED).fire();
            new StartSagaWidgetEvent().fire();
            this.debouncedUpdateSaga();
        });

        this.editor.on('focus', () => {
            this.eventType = 'focus';
            this.debouncedUpdateSaga();
            intervalNumber = setInterval(intervalFunction, 100);
        });

        this.editor.on('blur', () => {
            this.eventType = 'blur';
            this.fireInputInteractionEvent();
            clearInterval(intervalNumber);
            this.previousSelection = null;
        });

        this.editor.on('change', () => {
            this.eventType = 'change';
            this.fireInputInteractionEvent();
        });
    }

    private checkAndHandleSelectionChange(): void {
        const currentSelection = this.editor.getSelection();
        const isSelectionChanged: boolean = !ObjectHelper.stringEquals(currentSelection?.getSelectedText() || null,
            this.previousSelection?.getSelectedText() || null);

        if (isSelectionChanged) {
            this.eventType = 'selection';
            this.debouncedUpdateSaga();
        }

        this.previousSelection = currentSelection;
    }

    private getSagaData = (editor: CKEDITOR.editor): SagaHtmlEditorEventData => {
        const text = editor.document.getBody().getText();
        const html = editor.getData();

        const selection = editor.getSelection();
        const ranges = selection?.getRanges();
        const hasSelection = ranges?.length > 0;
        if (!hasSelection) {
            return {text, html};
        }

        const range = ranges[0];

        const clonedSelection = range.cloneContents();
        const div = new CKEDITOR.dom.element('div');
        div.append(clonedSelection);

        return {
            text,
            html,
            selection: {
                startOffset: range.startOffset,
                endOffset: range.endOffset,
                text: selection.getSelectedText(),
                html: div.getHtml(),
            }
        };
    };

    private fireInputInteractionEvent(): void {
        new InputInteractionEvent({
            input: this.htmlEditor,
            eventType: this.eventType,
            inputDataType: 'html',
            inputLabel: this.htmlEditorParams.getLabel()
        }).fire();
    }
}
