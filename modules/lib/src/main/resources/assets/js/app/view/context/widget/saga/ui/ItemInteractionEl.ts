import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {InteractionUnitEl} from './InteractionUnitEl';
import {SagaCommandProcessor} from '../SagaCommandProcessor';
import {SagaCommands} from '../../../../../saga/SagaCommands';
import {SagaGetRequestResult} from '../../../../../saga/SagaGetRequest';
import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';
import {Principal} from '@enonic/lib-admin-ui/security/Principal';

export class ItemInteractionEl
    extends DivEl {

    private lastInteraction?: InteractionUnitEl;

    private chatId?: string;

    private readonly user: Principal;

    constructor(user: Principal) {
        super('chat-interaction-container');

        this.user = user;
    }

    private addInteraction(interaction: InteractionUnitEl): this {
        this.appendChild(interaction);
        return this;
    }

    isEmpty(): boolean {
        return this.getChildren().length === 0;
    }

    getLastSagaResponseHtml(): string {
        return this.lastInteraction?.getSagaMessage();
    }

    askAssistant(userInput: string, html: string): Q.Promise<void> {
        this.show();
        this.lastInteraction = new InteractionUnitEl(this.user);
        this.addInteraction(this.lastInteraction);
        this.lastInteraction.addUserMessage(userInput).startWaiting();
        this.lastInteraction.scrollIntoView();

        const messageToAssistant = SagaCommandProcessor.convertToAssistantMessage(userInput, html);

        return SagaCommands.expandText(messageToAssistant, this.chatId)
            .then((chatId: string) => {
                this.chatId = chatId;

                return SagaCommands.waitForSagaToFinish(chatId).then((result: SagaGetRequestResult) => {
                    this.handleSagaResponse(result);
                });
            })
            .catch((e) => {
                this.lastInteraction.addError('Oops! Something went wrong!');
                throw e;
            })
            .finally(() => {
                this.lastInteraction.stopWaiting();
                this.lastInteraction.scrollIntoView({block: 'start', behavior: 'smooth'});
            });
    }

    private handleSagaResponse(result: SagaGetRequestResult): void {
        const sagaResponse = SagaCommandProcessor.extractResponse(result.messages.pop());

        if (sagaResponse.status === 'OK') {
            this.lastInteraction.addAssistantSuccessMessage(sagaResponse.message);
        } else {
            this.lastInteraction.addAssistantFailMessage(sagaResponse.message);
        }
    }
}
