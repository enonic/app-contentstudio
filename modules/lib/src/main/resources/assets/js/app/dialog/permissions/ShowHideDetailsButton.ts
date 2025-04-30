import {Button} from '@enonic/lib-admin-ui/ui/button/Button';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';

export class ShowHideDetailsButton extends Button {

    private active: boolean;

    private total: number;

    private reset: boolean;

    private onActiveChange?: (isActive: boolean) => void;

    constructor() {
        super(i18n('dialog.permissions.details.hide'));

        this.active = true;
        this.total = 0;
    }

    setActive(active: boolean): void {
        if (this.active === active) {
            return;
        }

        this.active = active;
        this.updateLabel();
        this.onActiveChange(active);
    }

    setTotal(total: number): void {
        this.total = total;
        this.updateLabel();
    }

    setReset(reset: boolean): void {
        this.reset = reset;
        this.updateLabel();
    }

    setActiveChangeListener(onActiveChange: (isActive: boolean) => void): void {
        this.onActiveChange = onActiveChange;
    }

    toggle(): void {
        this.setActive(!this.active);
    }

    private updateLabel(): void {
        this.setLabel(this.getLabelText());
    }

    private getLabelText(): string {
        if (this.active) {
            return this.reset ? i18n('dialog.permissions.details.permissions.hide') : i18n('dialog.permissions.details.changes.hide',
                this.total);
        }
        return this.reset ? i18n('dialog.permissions.details.permissions.show') : i18n('dialog.permissions.details.changes.show',
            this.total);
    }

}
