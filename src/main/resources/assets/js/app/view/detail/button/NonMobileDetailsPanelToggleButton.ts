import '../../../../api.ts';

export class NonMobileDetailsPanelToggleButton extends api.dom.ButtonEl {

    constructor() {
        super();
        this.addClass('icon-cog non-mobile-details-panel-toggle-button');
    }
}
