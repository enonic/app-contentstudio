import * as UI from '@enonic/ui';
import type {ComponentProps} from 'react';
import Q from 'q';
import {nanoid} from 'nanoid';
import {LegacyElement} from '@enonic/lib-admin-ui/ui2/LegacyElement';
import {SelectableListItem} from '@enonic/ui';

type Boolish = boolean | (() => boolean);

interface ItemLike {
    getDisplayName?(): string;

    getName?(): string;

    getStatusText?(): string;
}

export interface CheckableListItemWithStatusConfig {
    item?: ItemLike;
    label?: string;
    statusText?: string;
    checkbox?: {
        readOnly?: Boolish;
        checked?: Boolish;
        enabled?: Boolish;
    };
    hidden?: Boolish;
    className?: string;
    onSelected?: (selected: boolean) => void;
}

type RowProps = ComponentProps<typeof SelectableListItem>;
const CLS = {READONLY: 'readonly', HIDDEN: 'hidden'} as const;

const evalBool = (v: Boolish | undefined, fb = false) =>
    (typeof v === 'function' ? !!(v as () => unknown)() : v) ?? fb;

export class CheckableListItemWithStatus
    extends LegacyElement<typeof SelectableListItem, RowProps> {

    private cfg: CheckableListItemWithStatusConfig;
    private enabled = true;
    private selected = false;
    private listeners: ((s: boolean) => void)[] = [];
    private readonly checkboxId = `cli-${nanoid(8)}`;

    constructor(cfg: CheckableListItemWithStatusConfig) {
        const initial = evalBool(cfg.checkbox?.checked, false);
        const isHidden = evalBool(cfg.hidden, false);
        const isReadOnly = evalBool(cfg.checkbox?.readOnly, false);
        const isEnabled = evalBool(cfg.checkbox?.enabled, true) && !isHidden && !isReadOnly;

        super(
            {
                className: UI.cn('checkable-list-item-with-status', cfg.className),
                checked: initial,
                readOnly: !isEnabled,
                onCheckedChange: (next) => this.handleToggle(next),
                label: cfg.label ?? cfg.item?.getDisplayName?.() ?? cfg.item?.getName?.() ?? '',
                children: cfg.statusText ?? cfg.item?.getStatusText?.(),
            },
            SelectableListItem
        );

        this.cfg = cfg;
        this.enabled = isEnabled;
        this.selected = initial;

        this.toggleClass(CLS.HIDDEN, isHidden);
        this.toggleClass(CLS.READONLY, !isEnabled);
    }

    getItem(): ItemLike | undefined {
        return this.cfg.item;
    }

    override doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered) => {
            this.attachCheckboxId();

            this.notifySelected(this.selected);

            return rendered;
        });
    }


    private attachCheckboxId(): void {
        const root = this.getHTMLElement();
        if (!root) {
            return;
        }
        const input = root.querySelector<HTMLInputElement>('input[type="checkbox"]');
        const label =
            input?.closest<HTMLLabelElement>('label')
            ?? root.querySelector<HTMLLabelElement>('label');
        if (input) {
            input.id = this.checkboxId;
        }
        if (label) {
            label.htmlFor = this.checkboxId;
        }
    }

    setSelected(next: boolean, force?: boolean, silent?: boolean): void {
        if (!this.isSelectable() && !force) {
            return;
        }
        const val = !!next;
        if (val === this.selected) {
            return;
        }

        this.selected = val;
        this.setProps({checked: val});

        if (!silent) {
            this.notifySelected(val);
        }
    }

    isSelected(): boolean {
        return this.selected;
    }

    isSelectable(): boolean {
        return this.enabled;
    }

    onSelected(fn: (s: boolean) => void): void {
        this.listeners.push(fn);
    }

    unSelected(fn: (s: boolean) => void): void {
        this.listeners = this.listeners.filter((l) => l !== fn);
    }

    private notifySelected(val: boolean): void {
        this.cfg.onSelected?.(val);
        this.listeners.forEach((fn) => fn(val));
    }

    refreshSelectable(): void {
        const isHidden = evalBool(this.cfg.hidden, false);
        const isReadOnly = evalBool(this.cfg.checkbox?.readOnly, false);
        const isEnabled = evalBool(this.cfg.checkbox?.enabled, true) && !isHidden && !isReadOnly;

        this.enabled = isEnabled;
        this.toggleClass(CLS.HIDDEN, isHidden);
        this.toggleClass(CLS.READONLY, !isEnabled);
        this.setProps({readOnly: !isEnabled});
    }

    setObject(item: ItemLike): void {
        this.cfg = {...this.cfg, item};
        this.setProps({
            label: this.cfg.label ?? item?.getDisplayName?.() ?? item?.getName?.() ?? '',
            children: this.cfg.statusText ?? item?.getStatusText?.(),
        });

        this.refreshSelectable();
    }

    private handleToggle(next: boolean | 'indeterminate'): void {
        const val = next === true;
        if (val === this.selected) {
            return;
        }
        this.selected = val;
        this.setProps({checked: val});
        this.notifySelected(val);
    }
}
