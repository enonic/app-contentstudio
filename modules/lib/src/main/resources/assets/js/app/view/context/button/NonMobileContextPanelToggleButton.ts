import {Button} from 'lib-admin-ui/ui/button/Button';
import {i18n} from 'lib-admin-ui/util/Messages';
import {ToggleContextPanelEvent} from '../ToggleContextPanelEvent';
import {ContextPanelStateEvent} from '../ContextPanelStateEvent';
import {ContextPanelState} from '../ContextPanelState';

export class NonMobileContextPanelToggleButton
    extends Button {

    constructor() {
        super();

        this.addClass('icon-list non-mobile-details-panel-toggle-button');
        this.initListeners();
    }

    private initListeners() {
        this.onClicked(() => {
            new ToggleContextPanelEvent().fire();
        });

        ContextPanelStateEvent.on((event: ContextPanelStateEvent) => {
            const expanded: boolean = event.getState() !== ContextPanelState.COLLAPSED;
            this.toggleClass('expanded', expanded);
            this.setTitle(expanded ? i18n('tooltip.contextPanel.hide') : i18n('tooltip.contextPanel.show'), false);
        });
    }
}
