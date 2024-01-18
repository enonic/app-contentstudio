import {ButtonEl} from '@enonic/lib-admin-ui/dom/ButtonEl';
import {Action} from '@enonic/lib-admin-ui/ui/Action';
import {ActionButton} from '@enonic/lib-admin-ui/ui/button/ActionButton';
import {HtmlEditor, SagaHtmlEditorEventData} from '../../../../inputtype/ui/text/HtmlEditor';
import {SagaCommands} from '../../../../saga/SagaCommands';
import {WidgetItemView} from '../../WidgetItemView';
import {UpdateSagaWidgetItemView} from './UpdateSagaWidgetItemView';
import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {TextArea} from '@enonic/lib-admin-ui/ui/text/TextArea';
import {Element} from '@enonic/lib-admin-ui/dom/Element';
import {SagaGetRequestResult} from '../../../../saga/SagaGetRequest';
import {CommandDescriptionEl} from './CommandDescriptionEl';
import {InteractionEl} from './InteractionEl';
import {Principal} from '@enonic/lib-admin-ui/security/Principal';
import {IsAuthenticatedRequest} from '@enonic/lib-admin-ui/security/auth/IsAuthenticatedRequest';
import {LoginResult} from '@enonic/lib-admin-ui/security/auth/LoginResult';
import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';
import {StringHelper} from '@enonic/lib-admin-ui/util/StringHelper';
import {SagaCommandProcessor} from './SagaCommandProcessor';
import {SagaPostRequestResult} from '../../../../saga/SagaPostRequest';

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

    private data: SagaWidgetItemViewData;

    private actionButtons: ActionButton[] = [];

    private commandDescription: CommandDescriptionEl;

    private interactionContainer: DivEl;

    private chatInput: TextArea;

    private sendButton: ButtonEl;

    private user: Principal;

    constructor() {
        super('saga-widget-item-view');

        this.initElements();
        this.initEventListeners();
    }

    protected initElements() {
        this.chatInput = this.createChatInput();
        this.sendButton = this.createSendButton();
        this.commandDescription = new CommandDescriptionEl();
        this.interactionContainer = new DivEl('chat-interaction-container');
        this.interactionContainer.hide();

        const actionsContainer = new DivEl('command-shortcuts');
        this.actionButtons = this.createActionButtons();
        actionsContainer.appendChildren(...this.actionButtons);

        const chatInputContainer = new DivEl('chat-input-container');
        chatInputContainer.appendChildren(this.chatInput, this.sendButton as Element);

        new IsAuthenticatedRequest().sendAndParse().then((result: LoginResult) => {
            this.user = result.getUser();
        }).catch(DefaultErrorHandler.handle);

        this.appendChildren(this.commandDescription, this.interactionContainer, actionsContainer, chatInputContainer);
    }

    protected createActionButtons(): ActionButton[] {
        return [this.createExpandButton(), this.createCheckButton(), this.createNewButton()];
    }

    private createExpandButton(): ActionButton {
        return this.createButton('Expand', 'Please expand the text provided');
    }

    private createCheckButton(): ActionButton {
        return this.createButton('Check', 'Please fix errors in the text provided');
    }

    private createNewButton(): ActionButton {
        return this.createButton('Create', 'Please create a new text on the basis of the text provided');
    }

    private createButton(label: string, command: string): ActionButton {
        const action = new Action(label);

        action.onExecuted(() => {
            this.askAssistant(command);
        });

        const button = new ActionButton(action);
        button.addClass('command-button blue').setTitle('Click to ask Enonic Assistant');

        return button;
    }

    private createChatInput(): TextArea {
        const input = new TextArea('chat-input').addClass('chat-input') as TextArea;
        input.getEl().setAttribute('placeholder', 'Message Enonic Assistant...');

        input.onValueChanged((event) => {
            this.sendButton.setEnabled(!StringHelper.isBlank(event.getNewValue()));
        });

        return input;
    }

    private createSendButton(): ButtonEl {
        const button = new ButtonEl();
        button.addClass('send-button icon-arrow-left2');
        button.setEnabled(false);

        button.onClicked(() => {
            this.askAssistant();
        });

        return button;
    }

    protected initEventListeners() {
        UpdateSagaWidgetItemView.on((event: UpdateSagaWidgetItemView) => {
            this.updateState(State.READY);
            this.data = event.getData();
            this.commandDescription.setLinkText(this.data.editor.getName());
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

        if (state === State.LOADING) {
            this.toggleLoadLock(true);
        } else if (this.state === State.LOADING) {
            this.toggleLoadLock(false);
        }

        this.removeClass(this.state);
        this.state = state;
        this.addClass(this.state);
    }

    private toggleLoadLock(lock: boolean): void {
        this.actionButtons.forEach((button) => {
            button.setEnabled(!lock);
            button.toggleClass('icon-spinner', lock);
        });

        this.chatInput.setEnabled(!lock);
    }

    private askAssistant(command?: string): void {
        if (this.state !== State.READY) {
            return;
        }

        this.updateState(State.LOADING);
        this.interactionContainer.show();
        const interaction = new InteractionEl(this.user);
        this.interactionContainer.appendChild(interaction);
        const commandText = command || this.chatInput.getValue();
        interaction.addUserMessage(commandText).startWaiting();

        SagaCommands.expandText(SagaCommandProcessor.convertToAssistantMessage(commandText, this.data.html))
            .then((result: SagaPostRequestResult) => {
                return SagaCommands.waitForSagaToFinish(result.threadId, result.runId).then((result: SagaGetRequestResult) => {
                    interaction.addAssistantMessage(result.messages.pop(), this.applyAssistantMessage.bind(this));
                });
            })
            .catch((e) => {
                interaction.addError('Oops! Something went wrong!');
                DefaultErrorHandler.handle(e);
            })
            .finally(() => {
                interaction.stopWaiting();
                interaction.getHTMLElement().scrollIntoView({block: 'start', behavior: 'smooth'});
                this.updateState(State.READY);
                this.chatInput.setValue('');
            });
    }

    private applyAssistantMessage(message: string): void {
        this.data.editor.setData(message);
    }
}
