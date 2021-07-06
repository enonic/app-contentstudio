import {Button} from 'lib-admin-ui/ui/button/Button';
import {InspectEvent} from '../../../event/InspectEvent';
import {i18n} from 'lib-admin-ui/util/Messages';
import {ToggleContextPanelEvent} from '../ToggleContextPanelEvent';

export class NonMobileContextPanelToggleButton
    extends Button {

    constructor() {
        super();
        this.addClass('icon-list non-mobile-details-panel-toggle-button');
        this.onClicked(this.handleClick.bind(this));
    }

    private handleClick() {
        new ToggleContextPanelEvent().fire();

        // this.toggleClass('expanded', this.open);
        // this.setTitle(this.open ? i18n('tooltip.contextPanel.hide') : i18n('tooltip.contextPanel.show'), false);
    }
}
