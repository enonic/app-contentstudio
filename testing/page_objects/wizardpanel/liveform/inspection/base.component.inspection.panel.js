/**
 * Created on 19.02.2020.
 */
const Page = require('../../../page');
const lib = require('../../../../libs/elements');
const appConst = require('../../../../libs/app_const');

// Context Window, Base Inspect tab for all components
class BaseComponentInspectionPanel extends Page {

    get applyButton() {
        return "//div[contains(@id,'InspectionsPanel')]" + lib.actionButton('Apply');
    }

    async clickOnApplyButton() {
        await this.waitForApplyButtonEnabled();
        await this.clickOnElement(this.applyButton);
        return await this.pause(2000);
    }

    waitForApplyButtonDisplayed() {
        return this.waitForElementDisplayed(this.applyButton, appConst.mediumTimeout);
    }

    async waitForApplyButtonEnabled() {
        try {
            await this.waitForElementEnabled(this.applyButton, appConst.mediumTimeout);
            await this.pause(400);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_apply_button');
            throw new Error(`Inspection Panel - Apply button is not enabled , screenshot: ${screenshot} ` + err);
        }
    }

    async waitForApplyButtonDisabled() {
        try {
            await this.waitForElementDisabled(this.applyButton, appConst.mediumTimeout);
            await this.pause(400);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_apply_button');
            throw new Error(`Inspection Panel - Apply button should be disabled , screenshot: ${screenshot} ` + err);
        }
    }
}

module.exports = BaseComponentInspectionPanel;
