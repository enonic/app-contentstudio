import * as Q from 'q';
import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {SpanEl} from '@enonic/lib-admin-ui/dom/SpanEl';
import {ActionButton} from '@enonic/lib-admin-ui/ui/button/ActionButton';
import {Action} from '@enonic/lib-admin-ui/ui/Action';

export interface ErrorStateEntryConfig {
    className?: string;
    iconClass?: string;
    text: string;
    actionButton?: {
        label: string;
        handler?: () => void;
        markIgnored?: boolean;
    }
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

    private actionButton: ActionButton | undefined;

    private active: boolean;

    private checking: boolean;

    private readonly activeStateChangeHandlers: ActiveStateChangeHandler[];

    private readonly checkingStateChangeHandlers: CheckingStateChangeHandler[];

    private readonly config: ErrorStateEntryConfig;

    constructor(config: ErrorStateEntryConfig) {
        super(`dialog-error-state-entry ${config.className ?? ''}`);

        this.active = false;
        this.checking = false;

        this.activeStateChangeHandlers = [];
        this.checkingStateChangeHandlers = [];

        this.config = config;

        this.initElements();
        this.initListeners();
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            this.appendChildren(this.icon, this.text);
            if (this.actionButton) {
                this.appendChildren(this.actionButton);
            }

            return rendered;
        });
    }

    protected initElements(): void {
        const {iconClass, text, actionButton} = this.config;
        this.icon = new SpanEl(`entry-icon ${iconClass || 'icon-big-plus'}`);

        this.text = new SpanEl('entry-text');
        this.text.setHtml(text);

        if (actionButton) {
            const action = new Action(actionButton.label);
            this.actionButton = new ActionButton(action);
            this.actionButton.addClass('entry-button');
        }
    }

    protected initListeners(): void {
        const {actionButton} = this.config;
        if (actionButton) {
            const {handler, markIgnored} = actionButton;
            this.actionButton.getAction().onExecuted(() => {
                handler?.();
                if (markIgnored) {
                    this.addClass(Modifiers.IGNORED);
                }

                this.refreshActive();
            });
        }
    }

    updateCount(count: number): void {
        this.text.getEl().setAttribute('data-count', `(${count})`);

        const isResolved = count === 0;
        this.toggleClass(Modifiers.RESOLVED, isResolved);
        this.refreshActive();
    }

    setActionEnabled(enabled: boolean): void {
        this.actionButton.setEnabled(enabled);
    }

    reset(): void {
        this.setActionEnabled(true);
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

    markNonInteractive(nonInteractive: boolean): void {
        this.toggleClass(Modifiers.NON_INTERACTIVE, nonInteractive);
    }

    onActiveStateChange(handler: ActiveStateChangeHandler): void {
        this.activeStateChangeHandlers.push(handler);
    }

    onCheckingStateChange(handler: CheckingStateChangeHandler): void {
        this.checkingStateChangeHandlers.push(handler);
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
