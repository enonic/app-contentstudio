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

    async getDropdownSelectedOption() {
        let locator = this.container + lib.INSPECT_PANEL.DESCRIPTOR_VIEWER_DIV + lib.H6_DISPLAY_NAME;
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        return await this.getText(locator);
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
            await this.handleError('Inspection Panel, Apply button should be enabled', 'err_apply_button', err);
        }
    }

    async waitForApplyButtonDisabled() {
        try {
            await this.waitForElementDisabled(this.applyButton, appConst.mediumTimeout);
            await this.pause(400);
        } catch (err) {
            await this.handleError('Inspection Panel, Apply button should be disabled', 'err_apply_button', err)
        }
    }
}

module.exports = BaseComponentInspectionPanel;
