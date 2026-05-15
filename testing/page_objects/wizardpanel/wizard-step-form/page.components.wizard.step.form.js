/**
 * Created on 02.06.2023 updated on 15.05.2026
 */
const appConst = require('../../../libs/app_const');
const lib = require('../../../libs/elements');
const BasePageComponentView = require('../../wizardpanel/base.page.components.view');

const xpath = {
    container: `//div[@data-component='Tab.Content']//div[@data-component='PageComponentsView']`,
    pageComponentsView: "//div[contains(@id,'PageComponentsView')]",
};

class PageComponentsWizardStepForm extends BasePageComponentView {

    get container() {
        return xpath.container;
    }

    async waitForLoaded() {
        try {
            await this.waitForElementDisplayed(this.container);
            await this.pause(500);
        } catch (err) {
            await this.handleError('Page Component View is not displayed in the wizard step', 'err_wizard_step_component_view', err);
        }
    }

    async waitForNotDisplayed() {
        try {
            return await this.waitForElementNotDisplayed(this.container);
        } catch (err) {
            await this.handleError('Page Component View is still displayed in the wizard step', 'err_wizard_step_component_view_not_closed', err);
        }
    }

    async waitForNotLocked() {
        await this.getBrowser().waitUntil(async () => {
            let atr = await this.getAttribute(this.container, 'class');
            return !atr.includes('locked');
        }, {timeout: appConst.mediumTimeout, timeoutMsg: 'Content Wizard -  PCV should not be locked! '});
    }

    async waitForLocked() {
        await this.getBrowser().waitUntil(async () => {
            let atr = await this.getAttribute(this.container, 'class');
            return atr.includes('locked');
        }, {timeout: appConst.mediumTimeout, timeoutMsg: 'Content Wizard PCV should be locked! '});
    }
}

module.exports = PageComponentsWizardStepForm;
