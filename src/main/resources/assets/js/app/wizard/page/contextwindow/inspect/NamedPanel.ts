import Panel = api.ui.panel.Panel;

export abstract class NamedPanel
    extends Panel {

    constructor(className?: string) {
        super(className);
    }

    public abstract getName(): string;
}
