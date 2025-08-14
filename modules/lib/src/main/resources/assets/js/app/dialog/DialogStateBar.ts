import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import Q from 'q';
import {ButtonType, DialogStateEntry, StateEntryConfig} from './DialogStateEntry';

export interface DialogStateBarConfig {
    hideIfResolved?: boolean;
    failText?: string;
    resolvedText?: string;
    edit?: {
        applyHandler: () => void;
        cancelHandler: () => void;
    }
}

enum Modifiers {
    FAILED = 'failed',
    CHECKING = 'checking',
    RESOLVED = 'resolved',
    EDITING = 'editing',
    HIDDEN = 'hidden',
}

export type ResolvedStateChangeHandler = (checking: boolean) => void;

export class DialogStateBar
    extends DivEl {

    private failEntry: DialogStateEntry;

    private checkEntry: DialogStateEntry;

    private editEntry: DialogStateEntry;

    private errorsEntries: DialogStateEntry[];

    private resolvedEntry: DialogStateEntry | undefined;

    private hideIfResolved: boolean;

    private readonly resolvedStateChangeHandlers: ResolvedStateChangeHandler[];

    private readonly config: DialogStateBarConfig;

    constructor(config?: DialogStateBarConfig) {
        super('dialog-state-bar');

        this.config = config ?? {};

        this.hideIfResolved = config?.hideIfResolved ?? false;

        this.resolvedStateChangeHandlers = [];

        this.initElements();

        this.updateChecking();
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            this.appendChildren(this.failEntry, this.checkEntry, this.editEntry, this.resolvedEntry, ...this.errorsEntries);
            return rendered;
        });
    }

    protected initElements(): void {
        const {
            failText = i18n('dialog.state.fail'),
            resolvedText = i18n('dialog.state.resolved'),
        } = this.config;

        this.failEntry = new DialogStateEntry({
            className: 'fail-entry',
            text: failText,
            icon: 'icon-big-plus',
        });

        this.checkEntry = new DialogStateEntry({
            className: 'check-entry',
            text: i18n('dialog.state.checking'),
            icon: 'icon-spinner',
        });

        this.editEntry = new DialogStateEntry({
            className: 'edit-entry',
            text: i18n('dialog.state.editing'),
            actionButtons: [{
                type: ButtonType.BUTTON,
                label: i18n('action.apply'),
                className: 'blue',
                handler: () => {
                    this.config.edit?.applyHandler();
                    this.markEditing(false);
                },
            }, {
                type: ButtonType.BUTTON,
                label: i18n('action.cancel'),
                handler: () => {
                    this.config.edit?.cancelHandler();
                    this.markEditing(false);
                },
            }],
        });

        this.errorsEntries = [];

        this.resolvedEntry = new DialogStateEntry({
            className: 'resolved-entry',
            text: resolvedText,
            icon: 'icon-checkmark',
        });

        this.updateResolvedState();
    }

    protected updateResolvedState(): void {
        const isResolved: boolean = this.isResolved();
        this.toggleClass(Modifiers.RESOLVED, isResolved);
        this.toggleClass(Modifiers.HIDDEN, isResolved && this.hideIfResolved);
        this.notifyResolvedStateChanged(isResolved);
    }

    addErrorEntry(config: StateEntryConfig): DialogStateEntry {
        const entry = new DialogStateEntry({
            ...config,
            className: `error-entry ${config.className ?? ''}`,
        });

        this.errorsEntries.push(entry);
        this.whenRendered(() => void this.appendChild(entry));

        entry.onActiveStateChange(() => this.updateResolvedState());
        this.updateResolvedState();

        entry.onCheckingStateChange(() => this.updateChecking());

        return entry;
    }

    setEnabled(enabled: boolean): void {
        this.errorsEntries.forEach((entry: DialogStateEntry) => entry.setActionsEnabled(enabled));
    }

    markErrored(): void {
        this.markChecking(false);
        this.addClass(Modifiers.FAILED);
    }

    reset(): void {
        this.errorsEntries.forEach(entry => entry.reset());
        this.removeClass(Modifiers.FAILED);
        this.markEditing(false);
    }

    markChecking(checking: boolean): void {
        this.errorsEntries.forEach((entry: DialogStateEntry) => entry.markChecking(checking));
    }

    toggleHideIfResolved(hideIfResolved: boolean): void {
        if (this.hideIfResolved !== hideIfResolved) {
            this.hideIfResolved = hideIfResolved;
            this.toggleClass(Modifiers.HIDDEN, this.isResolved() && this.hideIfResolved);
        }
    }

    private isResolved(): boolean {
        return !this.errorsEntries.some((entry: DialogStateEntry) => entry.isActive());
    }

    private isChecking(): boolean {
        return this.errorsEntries.some(entry => entry.isChecking());
    }

    private updateChecking(): void {
        this.toggleClass(Modifiers.CHECKING, this.isChecking());
    }

    markEditing(editing: boolean): void {
        this.toggleClass(Modifiers.EDITING, editing);
    }

    onResolvedStateChange(handler: ResolvedStateChangeHandler): void {
        this.resolvedStateChangeHandlers.push(handler);
    }

    private notifyResolvedStateChanged(resolved: boolean): void {
        this.resolvedStateChangeHandlers.forEach(handler => handler(resolved));
    }
}
