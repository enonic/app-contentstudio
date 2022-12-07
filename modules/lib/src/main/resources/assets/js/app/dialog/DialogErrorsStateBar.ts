import * as Q from 'q';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {DialogErrorStateEntry, ErrorStateEntryConfig} from './DialogErrorStateEntry';

export interface DialogErrorsStateBarConfig {
    hideIfResolved?: boolean;
    failText?: string;
    resolvedText?: string;
}

enum Modifiers {
    FAILED = 'failed',
    CHECKING = 'checking',
    RESOLVED = 'resolved',
    HIDDEN = 'hidden',
}

export type ResolvedStateChangeHandler = (checking: boolean) => void;

export class DialogErrorsStateBar
    extends DivEl {

    private failEntry: DialogErrorStateEntry;

    private checkEntry: DialogErrorStateEntry;

    private errorsEntries: DialogErrorStateEntry[];

    private resolvedEntry: DialogErrorStateEntry | undefined;

    private hideIfResolved: boolean;

    private readonly resolvedStateChangeHandlers: ResolvedStateChangeHandler[];

    private readonly config: DialogErrorsStateBarConfig;

    constructor(config?: DialogErrorsStateBarConfig) {
        super('dialog-errors-state-bar');

        this.config = config ?? {};

        this.hideIfResolved = config?.hideIfResolved ?? false;

        this.resolvedStateChangeHandlers = [];

        this.initElements();

        this.updateChecking();
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            this.appendChildren(this.failEntry, this.checkEntry, this.resolvedEntry, ...this.errorsEntries);
            return rendered;
        });
    }

    protected initElements(): void {
        const {
            failText = i18n('dialog.errors.fail'),
            resolvedText = i18n('dialog.errors.resolved'),
        } = this.config;

        this.failEntry = new DialogErrorStateEntry({
            className: 'fail-entry',
            text: failText,
        });

        this.checkEntry = new DialogErrorStateEntry({
            className: 'check-entry',
            text: i18n('dialog.errors.checking'),
            iconClass: 'icon-spinner',
        });

        this.errorsEntries = [];

        this.resolvedEntry = new DialogErrorStateEntry({
            className: 'resolved-entry',
            text: resolvedText,
            iconClass: 'icon-checkmark',
        });

        this.updateResolvedState();
    }

    protected updateResolvedState(): void {
        const isResolved = !this.errorsEntries.some(entry => entry.isActive());
        this.toggleClass(Modifiers.RESOLVED, isResolved);
        this.toggleClass(Modifiers.HIDDEN, isResolved && this.hideIfResolved);
        this.notifyResolvedStateChanged(isResolved);
    }

    addErrorEntry(config: ErrorStateEntryConfig): DialogErrorStateEntry {
        const entry = new DialogErrorStateEntry({
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
        this.errorsEntries.forEach(entry => entry.setActionEnabled(enabled));
    }

    markErrored(): void {
        this.markChecking(false);
        this.addClass(Modifiers.FAILED);
    }

    reset(): void {
        this.errorsEntries.forEach(entry => entry.reset());
        this.removeClass(Modifiers.FAILED);
    }

    markChecking(checking: boolean): void {
        this.errorsEntries.forEach(entry => entry.markChecking(checking));
    }

    toggleHideIfResolved(hideIfResolved: boolean): void {
        if (this.hideIfResolved !== hideIfResolved) {
            this.hideIfResolved = hideIfResolved;
            const isResolved = !this.errorsEntries.some(entry => entry.isActive());
            this.toggleClass(Modifiers.HIDDEN, isResolved && this.hideIfResolved);
        }
    }

    private isChecking(): boolean {
        return this.errorsEntries.some(entry => entry.isChecking());
    }

    private updateChecking(): void {
        this.toggleClass(Modifiers.CHECKING, this.isChecking());
    }

    onResolvedStateChange(handler: ResolvedStateChangeHandler): void {
        this.resolvedStateChangeHandlers.push(handler);
    }

    private notifyResolvedStateChanged(resolved: boolean): void {
        this.resolvedStateChangeHandlers.forEach(handler => handler(resolved));
    }
}
