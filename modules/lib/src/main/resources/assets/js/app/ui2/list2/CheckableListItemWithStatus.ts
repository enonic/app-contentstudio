// app-contentstudio/modules/lib/src/main/resources/assets/app/ui2/list/CheckableListItemWithStatus.ts
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
        readOnly?: boolean | (() => boolean);
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

    // CHANGED: track both flags explicitly
    private selectable = true;    // user may toggle?
    private readOnly  = false;    // hard lock (never toggle), supersedes selectable

    private selected = false;
    private listeners: Array<(s: boolean) => void> = [];
    private readonly checkboxId = `cli-${nanoid(8)}`;

    constructor(cfg: CheckableListItemWithStatusConfig) {
        // derive initial flags
        const initial   = evalBool(cfg.checkbox?.checked,  false);
        const isHidden  = evalBool(cfg.hidden,             false);
        const isRO      = evalBool(cfg.checkbox?.readOnly, false);            // NEW
        const isEnabled = evalBool(cfg.checkbox?.enabled,  true);

        // selectable = enabled AND not hidden AND not readOnly
        const selectable = isEnabled && !isHidden && !isRO;                    // NEW

        super(
            {
                className: UI.cn('checkable-list-item-with-status', cfg.className),

                // checkbox view state
                checked: initial,
                readOnly: isRO || !selectable,                                    // NEW (lock UI when readOnly)
                onCheckedChange: (next) => this.handleToggle(next),

                // content
                label: cfg.label ?? cfg.item?.getDisplayName?.() ?? cfg.item?.getName?.() ?? '',
                description: cfg.description,
                metadata: cfg.metadata,
                children: cfg.statusText ?? cfg.item?.getStatusText?.(),
            },
            SelectableListItem
        );

        this.cfg = cfg;
        this.readOnly  = isRO;                                                // NEW
        this.selectable = selectable;                                         // NEW
        this.selected   = initial;

        this.toggleClass(CLS.HIDDEN, isHidden);
        this.toggleClass(CLS.READONLY, !this.selectable || this.readOnly);    // cosmetic class
    }

    getItem(): ItemLike | undefined { return this.cfg.item; }

    override doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered) => {
            this.attachCheckboxId();
            // keep controller in sync (counts & indeterminate)
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

    /* ---------- Legacy selection API (used by “All (N)” control) ---------- */

    setSelected(next: boolean, force?: boolean, silent?: boolean): void {
        // HARD LOCK: read-only items must never change, even with force
        if (this.readOnly) return;                                           // NEW

        // normal gating: only allow when selectable OR when caller forces it
        if (!this.selectable && !force) return;

        const val = !!next;
        if (val === this.selected) return;

        this.selected = val;
        this.setProps({ checked: val });

        if (!silent) this.notifySelected(val);
    }

    isSelected(): boolean { return this.selected; }
    isSelectable(): boolean { return this.selectable && !this.readOnly; }  // NEW (clarify)

    onSelected(fn: (s: boolean) => void): void { this.listeners.push(fn); }
    unSelected(fn: (s: boolean) => void): void {
        this.listeners = this.listeners.filter((l) => l !== fn);
    }

    private notifySelected(val: boolean): void {
        this.cfg.onSelected?.(val);
        this.listeners.forEach((fn) => fn(val));
    }

    /* ---------- Enable/hidden/readOnly recompute + content updates ---------- */

    refreshSelectable(): void {
        const isHidden  = evalBool(this.cfg.hidden,             false);
        const isRO      = evalBool(this.cfg.checkbox?.readOnly, false);      // NEW
        const isEnabled = evalBool(this.cfg.checkbox?.enabled,  true);

        this.readOnly   = isRO;                                              // NEW
        this.selectable = isEnabled && !isHidden && !isRO;                   // NEW

        this.toggleClass(CLS.HIDDEN, isHidden);
        this.toggleClass(CLS.READONLY, !this.selectable || this.readOnly);

        // lock input whenever not selectable or read-only
        this.setProps({ readOnly: this.readOnly || !this.selectable });      // NEW

        // tell controller to recompute its tri-state
        this.notifySelected(this.selected);
    }

    setObject(item: ItemLike): void {
        this.cfg = { ...this.cfg, item };
        this.setProps({
            label: this.cfg.label ?? item?.getDisplayName?.() ?? item?.getName?.() ?? '',
            children: this.cfg.statusText ?? item?.getStatusText?.(),
        });
        this.refreshSelectable(); // item may affect enabled/hidden/readOnly
    }

    /* ---------- Bridge checkbox → selection ---------- */
    private handleToggle(next: boolean | 'indeterminate'): void {
        // HARD LOCK at the interaction point too (safety)
        if (this.readOnly || !this.selectable) return;                       // NEW

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
