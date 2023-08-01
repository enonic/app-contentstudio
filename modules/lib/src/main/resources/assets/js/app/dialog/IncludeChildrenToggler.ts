import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {Tooltip} from '@enonic/lib-admin-ui/ui/Tooltip';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';

export class IncludeChildrenToggler
    extends DivEl {

    private stateChangedListeners: ((enabled: boolean) => void)[] = [];

    private tooltip: Tooltip;

    private readOnly: boolean;

    constructor() {
        super('icon icon-tree include-children-toggler');

        this.tooltip = new Tooltip(this, i18n('dialog.includeChildren'), 1000);

        this.onClicked(() => {
            this.toggle();
        });
    }

    toggle(condition?: boolean, silent?: boolean): boolean {
        if (!this.readOnly && this.isEnabled() !== condition) {
            this.toggleClass('on', condition);

            this.tooltip.setText(this.isEnabled() ? i18n('dialog.excludeChildren') : i18n('dialog.includeChildren'));

            if (!silent) {
                this.notifyStateChanged(this.isEnabled());
            }
            return true;
        }
        return false;
    }

    setReadOnly(value: boolean) {
        this.readOnly = value;
        this.tooltip.setActive(!value);

        this.toggleClass('readonly', this.readOnly);
    }

    isEnabled(): boolean {
        return this.hasClass('on');
    }

    public onStateChanged(listener: (enabled: boolean) => void) {
        this.stateChangedListeners.push(listener);
    }

    public unStateChanged(listener: (enabled: boolean) => void) {
        this.stateChangedListeners = this.stateChangedListeners.filter((current) => {
            return current !== listener;
        });
    }

    private notifyStateChanged(enabled: boolean) {
        this.stateChangedListeners.forEach((listener) => {
            listener(enabled);
        });
    }
}
