import {ClassHelper} from '@enonic/lib-admin-ui/ClassHelper';
import {Event} from '@enonic/lib-admin-ui/event/Event';
import {AssistantCommandParams} from '../../../../../saga/event/data/AssistantCommandParams';

export class AskAssistantEvent
    extends Event {

    private readonly data: AssistantCommandParams;

    constructor(data: AssistantCommandParams) {
        super();
        this.data = data;
    }

    getData(): AssistantCommandParams {
        return this.data;
    }

    static on(handler: (event: AskAssistantEvent) => void) {
        Event.bind(ClassHelper.getFullName(this), handler);
    }

    static un(handler?: (event: AskAssistantEvent) => void) {
        Event.unbind(ClassHelper.getFullName(this), handler);
    }

}
