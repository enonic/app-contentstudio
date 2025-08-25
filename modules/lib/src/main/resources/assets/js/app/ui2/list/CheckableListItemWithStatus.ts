import * as UI from '@enonic/ui';
import type { ComponentProps } from 'react';
import Q from 'q';
import { nanoid } from 'nanoid';
import { LegacyElement } from '@enonic/lib-admin-ui/ui2/LegacyElement';
import { SelectableListItem } from '@enonic/ui';

interface ItemLike {
    getDisplayName?(): string;
    getName?(): string;
    getStatusText?(): string;
}

export interface CheckableListItemWithStatusConfig {
    item?: ItemLike;
    label?: string;
    description?: string;
    metadata?: string;
    statusText?: string;
    checkbox?: {
        readOnly?: boolean;
        checked?: boolean | (() => boolean);
        enabled?: boolean | (() => boolean);
    };
    hidden?: boolean | (() => boolean);
    className?: string;
    onSelected?: (selected: boolean) => void;
}

type RowProps = ComponentProps<typeof SelectableListItem>;
const CLS = { READONLY: 'readonly', HIDDEN: 'hidden' } as const;

export class CheckableListItemWithStatus
    extends LegacyElement<typeof SelectableListItem, RowProps> {

    private cfg: CheckableListItemWithStatusConfig;
    private enabled = true;
    private selected = false;
    private listeners: Array<(s: boolean) => void> = [];
    private readonly checkboxId = `cli-${nanoid(8)}`;

    // NEW: emit once after first render so controller can compute indeterminate
    private didEmitInitial = false;

    constructor(cfg: CheckableListItemWithStatusConfig) {
        const initial = evalBool(cfg.checkbox?.checked, false);
        const isHidden = evalBool(cfg.hidden, false);
        const enabled  = evalBool(cfg.checkbox?.enabled, true) && !isHidden;

        super(
            {
                className: UI.cn('checkable-list-item-with-status', cfg.className),
                checked: initial,
                readOnly: !enabled,
                onCheckedChange: (next) => this.handleToggle(next),
                label: cfg.label ?? cfg.item?.getDisplayName?.() ?? cfg.item?.getName?.() ?? '',
                description: cfg.description,
                metadata: cfg.metadata,
                children: cfg.statusText ?? cfg.item?.getStatusText?.(),
            },
            SelectableListItem
        );

        this.cfg = cfg;
        this.enabled = enabled;
        this.selected = initial;

        this.toggleClass(CLS.HIDDEN, isHidden);
        this.toggleClass(CLS.READONLY, !enabled);
    }

    getItem(): ItemLike | undefined { return this.cfg.item; }

    override doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered) => {
            this.attachCheckboxId();

            this.notifySelected(this.selected);

            return rendered;
        });
    }

    private attachCheckboxId(): void {
        const root = this.getHTMLElement();
        if (!root) return;
        const input = root.querySelector('input[type="checkbox"]') as HTMLInputElement | null;
        const label = input?.closest('label') as HTMLLabelElement | null
                      ?? (root.querySelector('label') as HTMLLabelElement | null);
        if (input) input.id = this.checkboxId;
        if (label) label.htmlFor = this.checkboxId;
    }

    setSelected(next: boolean, force?: boolean, silent?: boolean): void {
        if (!this.isSelectable() && !force) return;
        const val = !!next;
        if (val === this.selected) return;

        this.selected = val;
        this.setProps({ checked: val });

        if (!silent) this.notifySelected(val);
    }

    isSelected(): boolean { return this.selected; }
    isSelectable(): boolean { return this.enabled; }

    onSelected(fn: (s: boolean) => void): void { this.listeners.push(fn); }
    unSelected(fn: (s: boolean) => void): void {
        this.listeners = this.listeners.filter((l) => l !== fn);
    }

    private notifySelected(val: boolean): void {
        this.cfg.onSelected?.(val);
        this.listeners.forEach((fn) => fn(val));
    }

    refreshSelectable(): void {
        const isHidden = evalBool(this.cfg.hidden, false);
        this.enabled = evalBool(this.cfg.checkbox?.enabled, true) && !isHidden;

        this.toggleClass(CLS.HIDDEN, isHidden);
        this.toggleClass(CLS.READONLY, !this.enabled);
        this.setProps({ readOnly: !this.enabled });

        this.notifySelected(this.selected);
    }

    setObject(item: ItemLike): void {
        this.cfg = { ...this.cfg, item };
        this.setProps({
            label: this.cfg.label ?? item?.getDisplayName?.() ?? item?.getName?.() ?? '',
            children: this.cfg.statusText ?? item?.getStatusText?.(),
        });

        // NEW: item change can alter enabled/hidden → recompute now
        this.refreshSelectable();
    }

    private handleToggle(next: boolean | 'indeterminate'): void {
        const val = next === true;
        if (val === this.selected) return;
        this.selected = val;
        this.setProps({ checked: val });
        this.notifySelected(val);
    }
}

/* utils */
function evalBool(v: boolean | (() => boolean) | undefined, fb: boolean): boolean {
    try { return typeof v === 'function' ? !!v() : v ?? fb; }
    catch { return fb; }
}
