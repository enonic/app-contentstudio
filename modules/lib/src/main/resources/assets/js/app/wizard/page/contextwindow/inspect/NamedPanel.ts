import {Panel} from '@enonic/lib-admin-ui/ui/panel/Panel';

export abstract class NamedPanel
    extends Panel {

    constructor(className?: string) {
        super(className);
    }

    public abstract getName(): string;
}
