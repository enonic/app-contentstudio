import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {InteractionUnitEl} from './InteractionUnitEl';

export class InteractionContainer extends DivEl {

    private lastInteraction: InteractionUnitEl;

    constructor() {
        super('chat-interaction-container');
    }

    addInteraction(interaction: InteractionUnitEl): this {
        this.lastInteraction = interaction;
        this.appendChild(interaction);
        return this;
    }

    isEmpty(): boolean {
        return this.getChildren().length === 0;
    }

    getLastSagaResponseHtml(): string {
        return this.lastInteraction?.getSagaMessage();
    }
}
