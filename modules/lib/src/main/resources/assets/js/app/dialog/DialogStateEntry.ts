import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {SpanEl} from '@enonic/lib-admin-ui/dom/SpanEl';
import {Action} from '@enonic/lib-admin-ui/ui/Action';
import {ActionButton} from '@enonic/lib-admin-ui/ui/button/ActionButton';
import Q from 'q';

export enum ButtonType {
    BUTTON = 'button',
    LINK = 'link',
}

export interface StateEntryConfig {
    className?: string;
    icon?: string;
    text: string;
    actionButtons?: {
        label: string;
        className?: string;
        handler?: () => void;
        markIgnored?: boolean;
        type?: ButtonType;
    }[];
}

enum Modifiers {
    RESOLVED = 'resolved',
    IGNORED = 'ignored',
    NON_INTERACTIVE = 'non-interactive',
}

export type ActiveStateChangeHandler = (active: boolean) => void;

export type CheckingStateChangeHandler = (checking: boolean) => void;

export class DialogStateEntry
    extends DivEl {

    private icon: SpanEl | undefined;

    private text: SpanEl;

    private actionButtons: ActionButton[];

    private active: boolean;

    private checking: boolean;

    private readonly activeStateChangeHandlers: ActiveStateChangeHandler[];

    private readonly checkingStateChangeHandlers: CheckingStateChangeHandler[];

    private readonly config: StateEntryConfig;

    constructor(config: StateEntryConfig) {
        super(`dialog-state-entry ${config.className ?? ''}`);

        this.active = false;
        this.checking = false;

        this.actionButtons = [];

        this.activeStateChangeHandlers = [];
        this.checkingStateChangeHandlers = [];

        this.config = config;

        this.initElements();
        this.initListeners();
    }

    private static wrapButtons(actionButtons: ActionButton[] = []): SpanEl[] {
        return actionButtons.map(button => {
            const wrapper = new SpanEl('entry-button-wrapper');
            const separator = new SpanEl('entry-button-separator');
            separator.setHtml('|');
            wrapper.appendChildren(button, separator);
            return wrapper;
        });
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            if (this.icon) {
                this.appendChild(this.icon);
            }
            this.appendChild(this.text);
            const isLinksOnly = this.config.actionButtons?.every(({type}) => type === ButtonType.LINK || type == null);
            this.appendChildren(...isLinksOnly ? DialogStateEntry.wrapButtons(this.actionButtons) : this.actionButtons);

            return rendered;
        });
    }

    updateCount(count: number): void {
        this.text.getEl().setAttribute('data-count', `(${count})`);

        const isResolved = count === 0;
        this.toggleClass(Modifiers.RESOLVED, isResolved);
        this.refreshActive();
    }

    setActionsEnabled(enabled: boolean): void {
        this.actionButtons.forEach(a => a.setEnabled(enabled));
    }

    reset(): void {
        this.setActionsEnabled(true);
        this.removeClass(Modifiers.IGNORED);
        this.removeClass(Modifiers.NON_INTERACTIVE);
        this.updateCount(0);
    }

    isActive(): boolean {
        return this.active;
    }

    isChecking(): boolean {
        return this.checking;
    }

    markChecking(checking: boolean): void {
        if (this.checking !== checking) {
            this.checking = checking;
            this.notifyCheckingStateChanged();
        }
    }

    markNonInteractive(nonInteractive: boolean, index?: number): void {
        if (index != null) {
            this.actionButtons[index]?.toggleClass(Modifiers.NON_INTERACTIVE, nonInteractive);
        } else {
            this.actionButtons.forEach(a => a.toggleClass(Modifiers.NON_INTERACTIVE, nonInteractive));
        }
    }

    onActiveStateChange(handler: ActiveStateChangeHandler): void {
        this.activeStateChangeHandlers.push(handler);
    }

    onCheckingStateChange(handler: CheckingStateChangeHandler): void {
        this.checkingStateChangeHandlers.push(handler);
    }

    protected initElements(): void {
        const {icon, text, actionButtons = []} = this.config;
        if (icon != null) {
            this.icon = new SpanEl(`entry-icon ${icon}`);
        }

        this.text = new SpanEl('entry-text');
        this.text.setHtml(text);

        this.actionButtons = actionButtons.map(({label, type = ButtonType.LINK, className = ''}) => {
            const action = new Action(label);
            const actionButton = new ActionButton(action);
            const typeClass = type !== ButtonType.BUTTON ? type : '';
            actionButton.addClass(`entry-button ${className} ${typeClass}`);
            return actionButton;
        });
    }

    protected initListeners(): void {
        const {actionButtons = []} = this.config;
        actionButtons.forEach(({handler, markIgnored}, index) => {
            this.actionButtons[index].getAction().onExecuted(() => {
                handler?.();
                if (markIgnored) {
                    this.addClass(Modifiers.IGNORED);
                }

                this.refreshActive();
            });
        });
    }

    private notifyActiveStateChanged(): void {
        this.activeStateChangeHandlers.forEach(handler => handler(this.active));
    }

    private notifyCheckingStateChanged(): void {
        this.checkingStateChangeHandlers.forEach(handler => handler(this.checking));
    }

    private refreshActive(): void {
        const isActive = !this.hasClass(Modifiers.RESOLVED) && !this.hasClass(Modifiers.IGNORED);
        if (this.active !== isActive) {
            this.active = isActive;
            this.notifyActiveStateChanged();
        }
    }
}
