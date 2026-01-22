import {TextEditModeChangedEvent} from './event/outgoing/navigation/TextEditModeChangedEvent';

/**
 * Acts as a controller for PageView state
 * Should not contain references to PageView to be used it ItemView
 */
export class PageViewController {

    private nextClickDisabled: boolean;
    private highlightingDisabled: boolean;
    private contextMenuDisabled: boolean;
    private pageLocked: boolean;
    private textEditMode: boolean = false;

    private textEditModeListeners: ((flag: boolean) => void)[] = [];

    private static INSTANCE: PageViewController;

    public static get(): PageViewController {
        if (!this.INSTANCE) {
            this.INSTANCE = new PageViewController();
        }
        return this.INSTANCE;
    }

    setTextEditMode(value: boolean) {
        const isToBeChanged = !!this.textEditMode !== !!value;
        this.textEditMode = value;

        if (isToBeChanged) {
            this.notifyTextEditModeChanged(value);
            new TextEditModeChangedEvent(value).fire();
        }
    }

    private notifyTextEditModeChanged(value: boolean) {
        this.textEditModeListeners.forEach(listener => listener(value));
    }

    public onTextEditModeChanged(listener: (value: boolean) => void) {
        this.textEditModeListeners.push(listener);
    }

    public unTextEditModeChanged(listener: (value: boolean) => void) {
        this.textEditModeListeners = this.textEditModeListeners.filter(curr => curr !== listener);
    }

    isTextEditMode() {
        return this.textEditMode;
    }

    setLocked(value: boolean) {
        this.pageLocked = value;
        this.setHighlightingDisabled(value);
    }

    isLocked() {
        return this.pageLocked;
    }

    setContextMenuDisabled(value: boolean) {
        this.contextMenuDisabled = value;
    }

    isContextMenuDisabled(): boolean {
        return this.contextMenuDisabled;
    }

    setHighlightingDisabled(value: boolean) {
        this.highlightingDisabled = value;
    }

    isHighlightingDisabled(): boolean {
        return this.highlightingDisabled;
    }

    setNextClickDisabled(value: boolean) {
        this.nextClickDisabled = value;
    }

    isNextClickDisabled(): boolean {
        return this.nextClickDisabled;
    }
}
