import {ButtonEl} from '@enonic/lib-admin-ui/dom/ButtonEl';
import {PEl} from '@enonic/lib-admin-ui/dom/PEl';
import {SpanEl} from '@enonic/lib-admin-ui/dom/SpanEl';
import {Action} from '@enonic/lib-admin-ui/ui/Action';
import {ActionButton} from '@enonic/lib-admin-ui/ui/button/ActionButton';
import {HtmlEditor, SagaHtmlEditorEventData} from '../../../../inputtype/ui/text/HtmlEditor';
import {SagaCommands} from '../../../../saga/SagaCommands';
import {WidgetItemView} from '../../WidgetItemView';
import {UpdateSagaWidgetItemView} from './UpdateSagaWidgetItemView';

export interface SagaWidgetItemViewData
    extends SagaHtmlEditorEventData {
    editor: HtmlEditor;
}

enum State {
    INITIAL = 'initial',
    LOADING = 'loading',
    READY = 'ready',
}

export class SagaWidgetItemView
    extends WidgetItemView {

    private state: State = State.INITIAL;

    private editorLink: ButtonEl;

    private data: SagaWidgetItemViewData;

    private commandButton: ActionButton;

    constructor() {
        super('saga-widget-item-view');

        this.initElements();
        this.initEventListeners();
    }

    protected initElements() {
        this.editorLink = new ButtonEl('command-editor-link');
        this.editorLink.setHtml('@');

        const commandDescription = new PEl('command-description');
        commandDescription.appendChildren(
            SpanEl.fromText('In '),
            this.editorLink,
            SpanEl.fromText(': '),
            SpanEl.fromText('expand').addClass('command-name'),
            SpanEl.fromText(' text.'),
        );

        const action = new Action('Expand Text');
        action.onExecuted(() => {
            if (this.state !== State.READY) {
                return;
            }

            this.updateState(State.LOADING);
            SagaCommands.expandText(this.data.html, this.data.selection?.html).then((result) => {
                this.updateState(State.READY);
                console.log('html', result.data);
            });
        });
        this.commandButton = new ActionButton(action);
        this.commandButton.addClass('command-button blue');

        this.appendChildren(commandDescription, this.commandButton);
    }

    protected initEventListeners() {
        UpdateSagaWidgetItemView.on((event: UpdateSagaWidgetItemView) => {
            this.updateState(State.READY);
            this.data = event.getData();
            this.editorLink.setHtml(this.data.editor.getName());
            // Can pass additional data from content: event.getData().editor.editorParams.content
            // Name can be taken from event.getData().editor.getId()
            // Name must be clickable in navigate to the Editor
            // Hovering the name must highlight the Editor
            // Consider getting data directly from the Editor in the future
        });
    }

    private updateState(state: State): void {
        if (this.state === state) {
            return;
        }

        this.removeClass(this.state);
        this.state = state;
        this.addClass(this.state);
    }
}
