import {LegacyElement} from '../../../shared/LegacyElement';
import {DISPLAY_NAME_INPUT_SELECTOR} from './DisplayNameInput';
import {ContentWizardTabsToolbar} from './ContentWizardTabsToolbar';

export class ContentWizardTabsToolbarElement extends LegacyElement<typeof ContentWizardTabsToolbar> {
    constructor() {
        super({}, ContentWizardTabsToolbar);
    }

    focusDisplayNameInput(): boolean {
        const input = this.getHTMLElement().querySelector<HTMLInputElement>(DISPLAY_NAME_INPUT_SELECTOR);

        if (!input || input.disabled || input.offsetParent === null) {
            return false;
        }

        input.focus();
        return document.activeElement === input;
    }
}
