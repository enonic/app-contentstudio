/**
 * Created on 30/07/2018.
 */
const appConst = require('../../../libs/app_const');
const BaseContextWindowPanel = require('../../details_panel/base.context.window.panel');
const { DROPDOWN } = require('../../../libs/elements');

const xpath = {
    container: `//div[contains(@id,'ContentWizardPanel')]//div[@data-component='ContextPanelView']`,
    widgetItem: `//div[contains(@id,'ExtensionContentItemView')]`,
};

class WizardContextWindowPanel extends BaseContextWindowPanel {
    get container() {
        return xpath.container;
    }

    get widgetSelectorDropdown() {
        return xpath.container + DROPDOWN.WIDGET_COMBOBOX;
    }

    get widgetSelectorDropdownHandle() {
        return xpath.container + DROPDOWN.WIDGET_COMBOBOX + "//button[@aria-label='Toggle']";
    }

    async isContentInvalid() {
        let selector = xpath.container + xpath.widgetItem + lib.CONTENT_SUMMARY_AND_STATUS_VIEWER;
        let attr = await this.getAttribute(selector, 'class');
        return await attr.includes('invalid');
    }

    async waitForOpened() {
        try {
            await this.getBrowser().waitUntil(
                async () => {
                    let el = await this.findElement(xpath.container);
                    let widthValue = await this.getBrowser().getElementCSSValue(el.elementId, 'width');
                    return (await this.getPanelWidth(widthValue)) > 150;
                },
                {
                    timeout: appConst.mediumTimeout,
                    timeoutMsg: 'Context Window was not loaded in ' + appConst.mediumTimeout,
                },
            );
        } catch (err) {
            await this.handleError('Wizard:', 'err_context_window_loaded', err);
        }
    }

    async isOpened() {
        try {
            await this.getBrowser().waitUntil(
                async () => {
                    if (!(await this.isElementDisplayed(xpath.container))) {
                        return false;
                    }
                    let el = await this.findElement(xpath.container);
                    let width = await this.getBrowser().getElementCSSValue(el.elementId, 'width');
                    return this.getPanelWidth(width) > 0;
                },
                { timeout: appConst.shortTimeout },
            );
            return true;
        } catch (err) {
            console.log('Wizard Context Window is not loaded' + err);
            return false;
        }
    }

    async openDependenciesWidget() {
        try {
            await super.openDependenciesWidget();
            await this.pause(700);
        } catch (err) {
            await this.handleError('Wizard:', 'err_open_dependencies_widget', err);
        }
    }
}

module.exports = WizardContextWindowPanel;
