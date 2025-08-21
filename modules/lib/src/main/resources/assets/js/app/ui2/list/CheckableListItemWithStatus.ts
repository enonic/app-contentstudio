import * as UI from '@enonic/ui';
import type {ComponentProps} from 'react';

// Legacy host (renders React inside lib-admin-ui’s DOM system)
import {LegacyElement} from '@enonic/lib-admin-ui/ui2/LegacyElement';
import {SelectableListItem} from '@enonic/ui';

///Users/msk/Documents/EnonicReps/npm-enonic-ui/src/components/selectable-list-item/selectable-list-item.tsx
// ⚠️ Import the React row from @enonic/ui (adjust path if your package exposes a subpath)

export type CheckboxControllerProps = Pick<UI.CheckboxProps, 'checked' | 'label' | 'align'>
    & Partial<Pick<UI.CheckboxProps, 'onCheckedChange' | 'name'>>;

//
// Very small “item-like” surface so we can derive texts & status from ContentSummaryAndCompareStatus,
// but also let callers pass static strings if needed.
//
interface ItemLike {
    getDisplayName?: () => string;
    getName?: () => string;
    getOwnerName?: () => string;
    getSizeString?: () => string;
    getStatusText?: () => string;
    getStatusClass?: () => string;
}

export interface CheckableListItemWithStatusConfig {
    item?: ItemLike;

    // Optional explicit content props (overrides values derived from item)
    label?: string;
    description?: string;
    metadata?: string;

    // Optional explicit status (overrides values derived from item)
    statusText?: string;
    statusClass?: string;

    // Selection & enablement
    checkbox?: {
        readOnly?: boolean;
        checked?: boolean | (() => boolean);
        enabled?: boolean | (() => boolean);
    };

    // Hide + disable row when true
    hidden?: boolean | (() => boolean);

    className?: string;

    // Selection callback (parity with older APIs)
    onSelected?: (selected: boolean) => void;
}

// Props we pass to @enonic/ui SelectableListItem
type RowProps = ComponentProps<typeof SelectableListItem>;

const CLS = {
    READONLY: 'readonly',
    SELECTED: 'selected',
    HIDDEN: 'hidden',
} as const;

/**
 * CheckableListItemWithStatus
 * - Pre-JSX wrapper around @enonic/ui SelectableListItem via LegacyElement.
 * - No Tooltip (explicitly dropped).
 * - Controlled checkbox so programmatic setSelected() always syncs UI.
 * - Puts a tiny status text on the Right slot for now (replace with StatusBadge later).
 */
export class CheckableListItemWithStatus extends LegacyElement<typeof SelectableListItem, RowProps> {
    private listeners: ((selected: boolean) => void)[] = [];
    private cfg: CheckableListItemWithStatusConfig;
    private selected = false;
    private enabled = true;

    constructor(cfg: CheckableListItemWithStatusConfig) {
        super(
            {
                className: UI.cn('checkable-list-item-with-status', cfg.className),
                selected: false,

                // Content (derive from item unless explicitly provided)
                label: resolveLabel(cfg),
                description: resolveDescription(cfg),
                metadata: resolveMetadata(cfg),

                // Checkbox (controlled)
                checked: evalBool(cfg.checkbox?.checked, false),
                readOnly: evalBool(cfg.checkbox?.readOnly, !evalEnabled(cfg)),

                onCheckedChange: (next) => this.onCheckedChange(next),

                // Right slot (temporary text; replace with StatusBadge later)
                children: resolveStatusText(cfg),
            },
            SelectableListItem
        );

        this.cfg = cfg;
        this.selected = evalBool(cfg.checkbox?.checked, false);

        const isHidden = evalBool(cfg.hidden, false);
        this.enabled = evalEnabled(cfg) && !isHidden;

        this.toggleClass(CLS.HIDDEN, isHidden);
        this.toggleClass(CLS.READONLY, !this.enabled);
        this.toggleClass(CLS.SELECTED, this.selected);

        // Keep props in sync
        this.setProps({
            selected: this.selected,
            checked: this.selected,
            readOnly: !this.enabled,
        });
    }

    // ---- Public API (what CS callers need) ----

    setSelected(selected: boolean, force?: boolean, silent?: boolean): void {
        if (force || this.isSelectable()) {
            this.selected = !!selected;
            this.toggleClass(CLS.SELECTED, this.selected);
            this.setProps({selected: this.selected, checked: this.selected});

            if (!silent) {
                this.cfg.onSelected?.(this.selected);
                this.listeners.forEach((fn) => fn(this.selected));
            }
        }
    }

    isSelected(): boolean {
        return this.selected;
    }

    isSelectable(): boolean {
        return this.enabled;
    }

    onSelected(listener: (selected: boolean) => void): void {
        this.listeners.push(listener);
    }

    unSelected(listener: (selected: boolean) => void): void {
        this.listeners = this.listeners.filter((l) => l !== listener);
    }

    /** Re-evaluate enabled/hidden flags and refresh UI */
    refreshSelectable(): void {
        const isHidden = evalBool(this.cfg.hidden, false);
        const enabled = evalEnabled(this.cfg) && !isHidden;
        this.enabled = enabled;

        this.toggleClass(CLS.HIDDEN, isHidden);
        this.toggleClass(CLS.READONLY, !enabled);

        this.setProps({readOnly: !enabled});
    }

    /** Update texts/status from a new "item" (like ContentSummaryAndCompareStatus) */
    setObject(item: ItemLike): void {
        this.cfg = {...this.cfg, item};
        this.setProps({
            label: resolveLabel(this.cfg),
            description: resolveDescription(this.cfg),
            metadata: resolveMetadata(this.cfg),
            children: resolveStatusText(this.cfg),
        });
    }

    // ---- Internals ----

    private onCheckedChange(next: boolean | 'indeterminate'): void {
        const nextSel = next === true; // force boolean (old class parity)
        this.selected = nextSel;

        this.toggleClass(CLS.SELECTED, nextSel);
        this.setProps({selected: nextSel, checked: nextSel});

        this.cfg.onSelected?.(nextSel);
        this.listeners.forEach((fn) => fn(nextSel));
    }
}

// ---------- helpers ----------

function evalBool(v: boolean | (() => boolean) | undefined, fallback: boolean): boolean {
    try {
        return typeof v === 'function' ? !!v() : v ?? fallback;
    } catch {
        return fallback;
    }
}
function evalEnabled(cfg: CheckableListItemWithStatusConfig): boolean {
    return evalBool(cfg.checkbox?.enabled, true);
}

function resolveLabel(cfg: CheckableListItemWithStatusConfig): string {
    return cfg.label ?? cfg.item?.getDisplayName?.() ?? cfg.item?.getName?.() ?? '';
}
function resolveDescription(cfg: CheckableListItemWithStatusConfig): string | undefined {
    return cfg.description ?? cfg.item?.getOwnerName?.() ?? undefined;
}
function resolveMetadata(cfg: CheckableListItemWithStatusConfig): string | undefined {
    return cfg.metadata ?? cfg.item?.getSizeString?.() ?? undefined;
}
function resolveStatusText(cfg: CheckableListItemWithStatusConfig): string | undefined {
    return cfg.statusText ?? cfg.item?.getStatusText?.() ?? undefined;
}
