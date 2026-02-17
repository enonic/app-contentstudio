import {CreateHtmlAreaDialogEvent, CreateHtmlAreaDialogEventBuilder} from './CreateHtmlAreaDialogEvent';
import {type ContentSummary} from '../../../content/ContentSummary';

export class CreateHtmlAreaContentDialogEvent extends CreateHtmlAreaDialogEvent {

    private readonly content?: ContentSummary;

    constructor(builder: CreateHtmlAreaContentDialogEventBuilder) {
        super(builder);

        this.content = builder.content;
    }

    getContent(): ContentSummary {
        return this.content;
    }

    static create(): CreateHtmlAreaContentDialogEventBuilder {
        return new CreateHtmlAreaContentDialogEventBuilder();
    }
}

export class CreateHtmlAreaContentDialogEventBuilder extends CreateHtmlAreaDialogEventBuilder {

    content?: ContentSummary;

    setContent(content: ContentSummary): this {
        this.content = content;
        return this;
    }

    build(): CreateHtmlAreaContentDialogEvent {
        return new CreateHtmlAreaContentDialogEvent(this);
    }
}
