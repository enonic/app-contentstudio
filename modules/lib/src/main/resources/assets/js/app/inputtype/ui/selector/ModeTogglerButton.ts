import {TogglerButton} from '@enonic/lib-admin-ui/ui/button/TogglerButton';
import {Tooltip} from '@enonic/lib-admin-ui/ui/Tooltip';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';

export class ModeTogglerButton
    extends TogglerButton {

    private tooltip: Tooltip;

    constructor() {
        super('mode-toggler-button');

        this.setEnabled(true);

        this.tooltip = new Tooltip(this, '', 1000);
        this.tooltip.setMode(Tooltip.MODE_GLOBAL_STATIC);

        this.onActiveChanged((isActive: boolean) => {
            this.toggleClass('icon-folder-open', isActive);
            this.toggleClass('icon-folder-closed', !isActive);

            const isVisible: boolean = this.tooltip.isVisible();

            if (isVisible) {
                this.tooltip.hide();
            }

            this.tooltip.setText(isActive ? i18n('tooltip.combobox.treemode.disable') : i18n('tooltip.combobox.treemode.enable'));

            if (isVisible) {
                this.tooltip.show();
            }
        });
    }
}
