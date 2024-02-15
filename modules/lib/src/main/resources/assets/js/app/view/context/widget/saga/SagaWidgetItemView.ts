import {ButtonEl} from '@enonic/lib-admin-ui/dom/ButtonEl';
import {HtmlEditor, SagaHtmlEditorEventData} from '../../../../inputtype/ui/text/HtmlEditor';
import {WidgetItemView} from '../../WidgetItemView';
import {UpdateSagaWidgetEvent} from './event/UpdateSagaWidgetEvent';
import {Element} from '@enonic/lib-admin-ui/dom/Element';
import {ItemContextEl} from './ui/ItemContextEl';
import {Principal} from '@enonic/lib-admin-ui/security/Principal';
import {IsAuthenticatedRequest} from '@enonic/lib-admin-ui/security/auth/IsAuthenticatedRequest';
import {LoginResult} from '@enonic/lib-admin-ui/security/auth/LoginResult';
import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';
import {StringHelper} from '@enonic/lib-admin-ui/util/StringHelper';
import {ContentSummary} from '../../../../content/ContentSummary';
import {PlaceholderGenerator} from './PlaceholderGenerator';
import {ItemInteractionEl} from './ui/ItemInteractionEl';
import {ChatInputEl} from './ui/ChatInputEl';
import * as Q from 'q';
import {AssistantCommandParams} from '../../../../saga/event/data/AssistantCommandParams';

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

export type ItemID = string;

export type ItemInteractions = Map<ItemID, ItemInteractionEl>;

export class SagaWidgetItemView
    extends WidgetItemView {

    private widgetState: WidgetState = WidgetState.INACTIVE;

    private assistantState: AssistantState = AssistantState.INITIAL;

    private data: SagaWidgetItemViewData;

    private itemContextElement: ItemContextEl;

    private chatInputContainer: ChatInputEl;

    private activeItemInteraction: ItemInteractionEl;

    private activeItemId: ItemID;

    private applyButton: ButtonEl;

    private user: Principal;

    private itemsInteractions: ItemInteractions = new Map<ItemID, ItemInteractionEl>();

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
        this.itemContextElement = new ItemContextEl();

        new IsAuthenticatedRequest().sendAndParse().then((result: LoginResult) => {
            this.user = result.getUser();
        }).catch(DefaultErrorHandler.handle);

        this.appendChildren(this.itemContextElement, this.applyButton as Element, this.chatInputContainer);
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
        this.itemContextElement.update(this.data);
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
        this.activeItemInteraction?.remove();
        this.activeItemId = this.data.editor.getEditorId();
        this.activeItemInteraction = this.getOrCreateItemInteraction(this.activeItemId);
        this.activeItemInteraction.insertAfterEl(this.itemContextElement);
        this.applyButton.setVisible(!this.activeItemInteraction.isEmpty());
    }

    private getOrCreateItemInteraction(itemId: ItemID): ItemInteractionEl {
        if (this.itemsInteractions.has(this.activeItemId)) {
            return this.itemsInteractions.get(this.activeItemId);
        }

        const itemInteraction = new ItemInteractionEl(this.user).setVisible(false) as ItemInteractionEl;
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

        this.doAskAssistant()
            .then(() => {
                this.applyButton.show(); // it was hidden by default
            })
            .catch((e) => {
                DefaultErrorHandler.handle(e);
            })
            .finally(() => {
                this.updateState(AssistantState.READY);
            });
    }

    private applyAssistantMessage(): void {
        this.data.editor.insertData(this.activeItemInteraction.getLastSagaResponseHtml());
    }

    private isEditorWithSelection(): boolean {
        return !StringHelper.isBlank(this.data.selection?.text);
    }

    private doAskAssistant(): Q.Promise<void> {
        const assistantParams = this.makeAssistantParams();
        this.chatInputContainer.setValue('');

        return this.activeItemInteraction.askAssistant(assistantParams);
    }

    private makeAssistantParams(): AssistantCommandParams {
        return {
            command: this.chatInputContainer.getValue(),
            context: {
              topic: this.data.content.getDisplayName(),
              type: this.data.content.getType().toString(),
              language: this.data.content.getLanguage()?.toString(),
            },
            source: {
                label: this.data.label,
                type: 'html',
                data: {
                    selection: this.data.selection?.html,
                    content: this.data.html,
                }
            }
        };
    }
}
