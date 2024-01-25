import {ButtonEl} from '@enonic/lib-admin-ui/dom/ButtonEl';
import {HtmlEditor, SagaHtmlEditorEventData} from '../../../../inputtype/ui/text/HtmlEditor';
import {SagaCommands} from '../../../../saga/SagaCommands';
import {WidgetItemView} from '../../WidgetItemView';
import {UpdateSagaWidgetEvent} from './event/UpdateSagaWidgetEvent';
import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {TextArea} from '@enonic/lib-admin-ui/ui/text/TextArea';
import {Element} from '@enonic/lib-admin-ui/dom/Element';
import {SagaGetRequestResult} from '../../../../saga/SagaGetRequest';
import {SessionContextEl} from './SessionContextEl';
import {InteractionEl} from './InteractionEl';
import {Principal} from '@enonic/lib-admin-ui/security/Principal';
import {IsAuthenticatedRequest} from '@enonic/lib-admin-ui/security/auth/IsAuthenticatedRequest';
import {LoginResult} from '@enonic/lib-admin-ui/security/auth/LoginResult';
import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';
import {StringHelper} from '@enonic/lib-admin-ui/util/StringHelper';
import {SagaCommandProcessor} from './SagaCommandProcessor';
import {SagaPostRequestResult} from '../../../../saga/SagaPostRequest';
import {ValueChangedEvent} from '@enonic/lib-admin-ui/ValueChangedEvent';
import {ContentSummary} from '../../../../content/ContentSummary';
import {PlaceholderGenerator} from './PlaceholderGenerator';

export interface SagaWidgetItemViewData
    extends SagaHtmlEditorEventData {
    editor: HtmlEditor;
    label?: string;
    content?: ContentSummary;
}

enum AssistantState {
    INITIAL = 'initial',
    LOADING = 'loading',
    READY = 'ready',
}

enum WidgetState {
    ACTIVE = 'active',
    INACTIVE = 'inactive',
}

export class SagaWidgetItemView
    extends WidgetItemView {

    private widgetState: WidgetState = WidgetState.INACTIVE;

    private assistantState: AssistantState = AssistantState.INITIAL;

    private data: SagaWidgetItemViewData;

    private sessionContextElement: SessionContextEl;

    private activeInteractionContainer: DivEl;

    private activeEditorId: string;

    private chatInput: TextArea;

    private sendButton: ButtonEl;

    private user: Principal;

    private interactionHistory: Map<string, Element> = new Map<string, Element>();

    constructor() {
        super('saga-widget-item-view');

        this.initElements();
        this.initEventListeners();
    }

    setActive(): void {
        this.widgetState = WidgetState.ACTIVE;
        console.log('active');
    }

    reset(): void {
        super.reset();
        this.widgetState = WidgetState.INACTIVE;
        console.log('inactive');
    }

    protected initElements() {
        this.chatInput = this.createChatInput();
        this.sendButton = this.createSendButton();
        this.sessionContextElement = new SessionContextEl();

        const chatInputContainer = new DivEl('chat-input-container');
        chatInputContainer.appendChildren(this.chatInput, this.sendButton as Element);

        new IsAuthenticatedRequest().sendAndParse().then((result: LoginResult) => {
            this.user = result.getUser();
        }).catch(DefaultErrorHandler.handle);

        this.appendChildren(this.sessionContextElement, chatInputContainer);
    }

    private createChatInput(): TextArea {
        const input = new TextArea('chat-input').addClass('chat-input') as TextArea;

        input.onValueChanged((event: ValueChangedEvent) => {
            this.sendButton.setEnabled(!StringHelper.isBlank(event.getNewValue()));
        });

        return input;
    }

    private updatePlaceholder(): void {
        this.chatInput.getEl().setAttribute('placeholder', PlaceholderGenerator.generate(this.data));
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

    protected initEventListeners(): void {
        UpdateSagaWidgetEvent.on((event: UpdateSagaWidgetEvent) => {
            if (this.isActive()) {
                this.handleUpdateEvent(event);
            }

            // Can pass additional data from content: event.getData().editor.editorParams.content
            // Name can be taken from event.getData().editor.getId()
            // Name must be clickable in navigate to the Editor
            // Hovering the name must highlight the Editor
            // Consider getting data directly from the Editor in the future
        });
    }

    private isActive(): boolean {
        return this.widgetState === WidgetState.ACTIVE;
    }

    private handleUpdateEvent(event: UpdateSagaWidgetEvent): void {
        this.updateState(AssistantState.READY);
        this.data = event.getData();
        this.sessionContextElement.update(this.data);
        this.updatePlaceholder();

        if (this.activeEditorId !== this.data.editor.getEditorId()) {
            this.activeInteractionContainer?.remove();
            this.activeEditorId = this.data.editor.getEditorId();

            const interactionContainer = this.interactionHistory.get(this.activeEditorId) || new DivEl('chat-interaction-container');
            this.activeInteractionContainer = interactionContainer;
            this.interactionHistory.set(this.activeEditorId, interactionContainer);

            if (interactionContainer.getChildren().length === 0) {
                interactionContainer.hide();
            }

            interactionContainer.insertAfterEl(this.sessionContextElement);
        }
    }

    private updateState(state: AssistantState): void {
        if (this.assistantState === state) {
            return;
        }

        if (state === AssistantState.LOADING) {
            this.toggleLoadLock(true);
        } else if (this.assistantState === AssistantState.LOADING) {
            this.toggleLoadLock(false);
        }

        this.removeClass(this.assistantState);
        this.assistantState = state;
        this.addClass(this.assistantState);
    }

    private toggleLoadLock(lock: boolean): void {
        this.chatInput.setEnabled(!lock);
    }

    private askAssistant(command?: string): void {
        if (this.assistantState !== AssistantState.READY) {
            return;
        }

        this.updateState(AssistantState.LOADING);
        this.activeInteractionContainer.show();
        const interaction = new InteractionEl(this.user);
        this.activeInteractionContainer.appendChild(interaction);
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
                this.updateState(AssistantState.READY);
                this.chatInput.setValue('');
            });
    }

    private applyAssistantMessage(message: string): void {
        this.data.editor.insertData(message);
    }
}
