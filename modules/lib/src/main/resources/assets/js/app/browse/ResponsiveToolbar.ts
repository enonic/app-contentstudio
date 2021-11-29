import {Toolbar} from 'lib-admin-ui/ui/toolbar/Toolbar';
import {Button} from 'lib-admin-ui/ui/button/Button';
import {Element} from 'lib-admin-ui/dom/Element';

export class ResponsiveToolbar extends Toolbar {

    protected readonly hideMobilePreviewButton: Button;

    constructor(className: string = '') {
        super('responsive-toolbar ' + className);

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
