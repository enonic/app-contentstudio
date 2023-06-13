/**
 * Created on 02.06.2023
 */
const Page = require('../../page');
const appConst = require('../../../libs/app_const');
const lib = require('../../../libs/elements');
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
            let screenshot = appConst.generateRandomName('err_wizard_step_component_view');
            await this.saveScreenshot(screenshot);
            throw new Error(`Page Component View -  is not displayed in the wizard step, screenshot: ${screenshot}  ` + err);
        }
    }

    async waitForNotDisplayed() {
        try {
            return await this.waitForElementNotDisplayed(this.container, appConst.mediumTimeout);
        } catch (err) {
            let screenshot = appConst.generateRandomName('err_wizard_step_component_view');
            await this.saveScreenshot(screenshot);
            throw new Error(`Page Component View -  is displayed in the wizard step, screenshot: ${screenshot}  ` + err);
        }
    }
}

module.exports = PageComponentsWizardStepForm;
