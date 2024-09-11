import {Toolbar, ToolbarConfig} from '@enonic/lib-admin-ui/ui/toolbar/Toolbar';
import {Button} from '@enonic/lib-admin-ui/ui/button/Button';
import {Element} from '@enonic/lib-admin-ui/dom/Element';

export class ResponsiveToolbar extends Toolbar<ToolbarConfig> {

    protected readonly hideMobilePreviewButton: Button;

    constructor(config?: ToolbarConfig) {
        super(config);
        this.addClass('responsive-toolbar');

        this.hideMobilePreviewButton = new Button();
        this.hideMobilePreviewButton.addClass('hide-mobile-preview-button icon-arrow-left2');

        this.prependChild(this.hideMobilePreviewButton);
    }

    onFoldClicked(action: () => void) {
        this.hideMobilePreviewButton.onClicked(action);
    }

    enableMobileMode(): void {
        this.setLocked(true);
        this.processBeforeMobileModeOn();
        this.fold(true);
    }

    protected processBeforeMobileModeOn() {
    //
    }

    disableMobileMode(): void {
        this.setLocked(false);
        this.processBeforeMobileModeOff();
        this.expand();
    }

    protected processBeforeMobileModeOff() {
        //
    }

    protected isItemAllowedToFold(elem: Element): boolean {
        return super.isItemAllowedToFold(elem) && elem.getId() !== this.hideMobilePreviewButton.getId();
    }
}
