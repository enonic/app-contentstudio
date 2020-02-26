import {ButtonEl} from 'lib-admin-ui/dom/ButtonEl';

export class NonMobileContextPanelToggleButton
    extends ButtonEl {

    constructor() {
        super();
        this.addClass('icon-cog non-mobile-details-panel-toggle-button');
    }
}
