import {Button} from '@enonic/lib-admin-ui/ui/button/Button';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {ToggleContextPanelEvent} from '../ToggleContextPanelEvent';
import {ContextPanelStateEvent} from '../ContextPanelStateEvent';
import {ContextPanelState} from '../ContextPanelState';
import {KeyHelper} from '@enonic/lib-admin-ui/ui/KeyHelper';

export class NonMobileContextPanelToggleButton
    extends Button {

    constructor() {
        super();

        this.addClass('icon-list non-mobile-details-panel-toggle-button');
        this.initListeners();
    }

    private initListeners() {
        const toggleAction = () => {
            new ToggleContextPanelEvent().fire();
        };
        this.onClicked(toggleAction);

        this.onKeyDown((event: KeyboardEvent) => KeyHelper.isEnterKey(event) && toggleAction());

        this.onFocus(() => {
            console.log('Toggle button got focus');
        });

        this.onBlur(() => {
            console.log('Toggle button lost focus');
        });

        ContextPanelStateEvent.on((event: ContextPanelStateEvent) => {
            const expanded: boolean = event.getState() !== ContextPanelState.COLLAPSED;
            this.toggleClass('expanded', expanded);
            this.setTitle(expanded ? i18n('tooltip.contextPanel.hide') : i18n('tooltip.contextPanel.show'), false);
        });
    }
}
