import '../../../../api.ts';
import {MobileContextPanel} from '../MobileContextPanel';

export class MobileContextPanelToggleButton
    extends api.dom.DivEl {

    private detailsPanel: MobileContextPanel;

    public static EXPANDED_CLASS: string = 'expanded';

    constructor(detailsPanel: MobileContextPanel, slideInCallback?: () => void) {
        super('mobile-details-panel-toggle-button');

        this.detailsPanel = detailsPanel;

        this.detailsPanel.onSlidedIn(() => this.addClass(MobileContextPanelToggleButton.EXPANDED_CLASS));
        this.detailsPanel.onSlidedOut(() => this.removeClass(MobileContextPanelToggleButton.EXPANDED_CLASS));

        this.onClicked((event) => {
            if (!this.hasClass(MobileContextPanelToggleButton.EXPANDED_CLASS)) {
                this.detailsPanel.slideIn();
                if (!!slideInCallback) {
                    slideInCallback();
                }
            } else {
                this.detailsPanel.slideOut();
            }
            event.stopPropagation();
        });
    }
}
