import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {SpanEl} from '@enonic/lib-admin-ui/dom/SpanEl';
import {Action} from '@enonic/lib-admin-ui/ui/Action';
import {ActionButton} from '@enonic/lib-admin-ui/ui/button/ActionButton';
import * as Q from 'q';

export interface ErrorStateEntryConfig {
    className?: string;
    iconClass?: string;
    text: string;
    actionButtons?: {
        label: string;
        handler?: () => void;
        markIgnored?: boolean;
    }[];
}

enum Modifiers {
    RESOLVED = 'resolved',
    IGNORED = 'ignored',
    NON_INTERACTIVE = 'non-interactive',
}

export type ActiveStateChangeHandler = (active: boolean) => void;

export type CheckingStateChangeHandler = (checking: boolean) => void;

export class DialogErrorStateEntry
    extends DivEl {

    private icon: SpanEl;

    private text: SpanEl;

    private actionButtons: ActionButton[];

    private active: boolean;

    private checking: boolean;

    private readonly activeStateChangeHandlers: ActiveStateChangeHandler[];

    private readonly checkingStateChangeHandlers: CheckingStateChangeHandler[];

    private readonly config: ErrorStateEntryConfig;

    constructor(config: ErrorStateEntryConfig) {
        super(`dialog-error-state-entry ${config.className ?? ''}`);

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
            this.appendChildren(this.icon, this.text);
            this.appendChildren(...DialogErrorStateEntry.wrapButtons(this.actionButtons));

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
        const {iconClass, text, actionButtons = []} = this.config;
        this.icon = new SpanEl(`entry-icon ${iconClass || 'icon-big-plus'}`);

        this.text = new SpanEl('entry-text');
        this.text.setHtml(text);

        this.actionButtons = actionButtons.map(({label}) => {
            const action = new Action(label);
            const actionButton = new ActionButton(action);
            actionButton.addClass('entry-button');
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
