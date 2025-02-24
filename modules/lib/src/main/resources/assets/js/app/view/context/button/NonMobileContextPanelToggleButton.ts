import {Button} from '@enonic/lib-admin-ui/ui/button/Button';

export class NonMobileContextPanelToggleButton
    extends Button {

    constructor() {
        super();

        this.addClass('icon-list non-mobile-details-panel-toggle-button');
    }
}
