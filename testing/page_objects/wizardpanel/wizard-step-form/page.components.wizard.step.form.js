/**
 * Created on 02.06.2023
 */
const appConst = require('../../../libs/app_const');
const lib = require('../../../libs/elements-old');
const BasePageComponentView = require('../../wizardpanel/base.page.components.view');
const xpath = {
    container: `//div[contains(@id,'PageComponentsWizardStepForm')]`,
    pageComponentsView: "//div[contains(@id,'PageComponentsView')]",
};

class PageComponentsWizardStepForm extends BasePageComponentView {

    get container() {
        return xpath.container + xpath.pageComponentsView;
    }

    async waitForLoaded() {
        try {
            await this.waitForElementDisplayed(this.container, appConst.mediumTimeout);
            await this.pause(500);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_wizard_step_component_view');
            throw new Error(`Page Component View -  is not displayed in the wizard step, screenshot: ${screenshot}  ` + err);
        }
    }

    async waitForNotDisplayed() {
        try {
            return await this.waitForElementNotDisplayed(this.container, appConst.mediumTimeout);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_wizard_step_component_view');
            throw new Error(`Page Component View -  is displayed in the wizard step, screenshot: ${screenshot}  ` + err);
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
