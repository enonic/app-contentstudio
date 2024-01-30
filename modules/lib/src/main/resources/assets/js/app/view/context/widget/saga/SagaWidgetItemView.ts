import {ButtonEl} from '@enonic/lib-admin-ui/dom/ButtonEl';
import {HtmlEditor, SagaHtmlEditorEventData} from '../../../../inputtype/ui/text/HtmlEditor';
import {SagaCommands} from '../../../../saga/SagaCommands';
import {WidgetItemView} from '../../WidgetItemView';
import {UpdateSagaWidgetEvent} from './event/UpdateSagaWidgetEvent';
import {Element} from '@enonic/lib-admin-ui/dom/Element';
import {SagaGetRequestResult} from '../../../../saga/SagaGetRequest';
import {ItemContextEl} from './ui/ItemContextEl';
import {InteractionUnitEl} from './ui/InteractionUnitEl';
import {Principal} from '@enonic/lib-admin-ui/security/Principal';
import {IsAuthenticatedRequest} from '@enonic/lib-admin-ui/security/auth/IsAuthenticatedRequest';
import {LoginResult} from '@enonic/lib-admin-ui/security/auth/LoginResult';
import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';
import {StringHelper} from '@enonic/lib-admin-ui/util/StringHelper';
import {SagaCommandProcessor} from './SagaCommandProcessor';
import {ContentSummary} from '../../../../content/ContentSummary';
import {PlaceholderGenerator} from './PlaceholderGenerator';
import {InteractionContainer} from './ui/InteractionContainer';
import {ChatInputEl} from './ui/ChatInputEl';

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

export interface ItemInteraction {
    chatId?: string;
    container: InteractionContainer;
}

export type ItemID = string;

export type ItemInteractions = Map<ItemID, ItemInteraction>;

export class SagaWidgetItemView
    extends WidgetItemView {

    private widgetState: WidgetState = WidgetState.INACTIVE;

    private assistantState: AssistantState = AssistantState.INITIAL;

    private data: SagaWidgetItemViewData;

    private sessionContextElement: ItemContextEl;

    private chatInputContainer: ChatInputEl;

    private activeItemInteraction: ItemInteraction;

    private activeItemId: ItemID;

    private applyButton: ButtonEl;

    private user: Principal;

    private itemsInteractions: ItemInteractions = new Map<ItemID, ItemInteraction>();

    constructor() {
        super('saga-widget-item-view');

        this.initElements();
        this.initEventListeners();
    }

    setActive(): void {
        this.widgetState = WidgetState.ACTIVE;
    }

    reset(): void {
        super.reset();
        this.widgetState = WidgetState.INACTIVE;
    }

    protected initElements(): void {
        this.chatInputContainer = new ChatInputEl();
        this.applyButton = this.createApplyButton();
        this.sessionContextElement = new ItemContextEl();

        new IsAuthenticatedRequest().sendAndParse().then((result: LoginResult) => {
            this.user = result.getUser();
        }).catch(DefaultErrorHandler.handle);

        this.appendChildren(this.sessionContextElement, this.applyButton as Element, this.chatInputContainer);
    }

    private createApplyButton(): ButtonEl {
        const button = new ButtonEl();
        button.setHtml('Apply').addClass('apply-button');
        button.setEnabled(false).hide();

        button.onClicked(() => {
            this.applyAssistantMessage();
        });

        return button;
    }

    protected initEventListeners(): void {
        this.chatInputContainer.onSendClicked(() => {
            this.askAssistant();
        });

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
        this.data = event.getData();
        this.updateState(AssistantState.READY);
        this.sessionContextElement.update(this.data);
        this.updateApplyButtonText();
        this.chatInputContainer.updatePlaceholder(PlaceholderGenerator.generate(this.data));

        if (this.activeItemId !== this.data.editor.getEditorId()) {
            this.updateActiveChatContainer();
        }
    }

    private updateApplyButtonText(): void {
        if (this.isEditorWithSelection()) {
            this.applyButton.setHtml('Replace selection');
        } else {
            this.applyButton.setHtml('Insert at cursor');
        }
    }

    private updateActiveChatContainer(): void {
        this.activeItemInteraction?.container.remove();
        this.activeItemId = this.data.editor.getEditorId();
        this.activeItemInteraction = this.getOrCreateItemInteraction(this.activeItemId);
        this.activeItemInteraction.container.insertAfterEl(this.sessionContextElement);
        this.applyButton.setVisible(!this.activeItemInteraction.container.isEmpty());
    }

    private getOrCreateItemInteraction(itemId: ItemID): ItemInteraction {
        if (this.itemsInteractions.has(this.activeItemId)) {
            return this.itemsInteractions.get(this.activeItemId);
        }

        const container = new InteractionContainer().setVisible(false) as InteractionContainer;
        const itemInteraction = {container};
        this.itemsInteractions.set(itemId, itemInteraction);

        return itemInteraction;
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
        this.chatInputContainer.setEnabled(!lock);
        this.applyButton.setEnabled(!lock);
    }

    private askAssistant(): void {
        if (this.assistantState !== AssistantState.READY) {
            return;
        }

        this.updateState(AssistantState.LOADING);
        this.activeItemInteraction.container.show();
        const interaction = new InteractionUnitEl(this.user);
        this.activeItemInteraction.container.addInteraction(interaction);
        const userInput = this.chatInputContainer.getValue();
        this.chatInputContainer.setValue('');
        interaction.addUserMessage(userInput).startWaiting();
        interaction.scrollIntoView();

        const textToSend = this.isEditorWithSelection() ? this.data.selection.html : this.data.html;
        const messageToAssistant = SagaCommandProcessor.convertToAssistantMessage(userInput, textToSend);

        SagaCommands.expandText(messageToAssistant, this.activeItemInteraction.chatId)
            .then((chatId: string) => {
                this.itemsInteractions.get(this.activeItemId).chatId = chatId;

                return SagaCommands.waitForSagaToFinish(chatId).then((result: SagaGetRequestResult) => {
                    this.handleSagaResponse(result, interaction);
                });
            })
            .catch((e) => {
                interaction.addError('Oops! Something went wrong!');
                DefaultErrorHandler.handle(e);
            })
            .finally(() => {
                interaction.stopWaiting();
                interaction.scrollIntoView({block: 'start', behavior: 'smooth'});
                this.updateState(AssistantState.READY);
                this.applyButton.show();
            });
    }

    private applyAssistantMessage(): void {
        const message = this.activeItemInteraction.container.getLastSagaResponseHtml();
        this.data.editor.insertData(message);
    }

    private isEditorWithSelection(): boolean {
        return !StringHelper.isBlank(this.data.selection?.text);
    }

    private handleSagaResponse(result: SagaGetRequestResult, interaction: InteractionUnitEl): void {
        const sagaResponse = SagaCommandProcessor.extractResponse(result.messages.pop());

        if (sagaResponse.status === 'OK') {
            interaction.addAssistantSuccessMessage(sagaResponse.message);
        } else {
            interaction.addAssistantFailMessage(sagaResponse.message);
        }
    }
}
