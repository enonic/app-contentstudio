import {type ApplicationKey} from '@enonic/lib-admin-ui/application/ApplicationKey';
import {CreateHtmlAreaContentDialogEvent, CreateHtmlAreaContentDialogEventBuilder} from './CreateHtmlAreaContentDialogEvent';

export class CreateHtmlAreaMacroDialogEvent extends CreateHtmlAreaContentDialogEvent {

    private readonly applicationKeys: ApplicationKey[];

    constructor(builder: CreateHtmlAreaMacroDialogEventBuilder) {
        super(builder);

        this.applicationKeys = builder.applicationKeys;
    }

    getApplicationKeys(): ApplicationKey[] {
        return this.applicationKeys;
    }

    static create(): CreateHtmlAreaMacroDialogEventBuilder {
        return new CreateHtmlAreaMacroDialogEventBuilder();
    }
}

export class CreateHtmlAreaMacroDialogEventBuilder extends CreateHtmlAreaContentDialogEventBuilder {

    applicationKeys: ApplicationKey[];


    setApplicationKeys(applicationKeys: ApplicationKey[]): this {
        this.applicationKeys = applicationKeys;
        return this;
    }

    build(): CreateHtmlAreaMacroDialogEvent {
        return new CreateHtmlAreaMacroDialogEvent(this);
    }
}
