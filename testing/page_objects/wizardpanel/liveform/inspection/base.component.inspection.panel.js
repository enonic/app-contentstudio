/**
 * Created on 19.02.2020.  updated on 16.06.2026
 */
const Page = require('../../../page');
const appConst = require('../../../../libs/app_const');

// Context Window, Base Inspect tab for all components
class BaseComponentInspectionPanel extends Page {

    get applyButton() {
        return "//button[@data-component='InspectApplyButton']";
    }

    async getDropdownSelectedOption() {
        let locator = this.container + "//button[@data-component='Combobox.Value']//span[contains(@class,'truncate')]";
        await this.waitForElementDisplayed(locator);
        return await this.getText(locator);
    }

    async clickOnApplyButton() {
        await this.waitForApplyButtonEnabled();
        await this.clickOnElement(this.applyButton);
        return await this.pause(2000);
    }

    waitForApplyButtonDisplayed() {
        return this.waitForElementDisplayed(this.applyButton);
    }

    waitForApplyButtonNotDisplayed() {
        return this.waitForElementNotDisplayed(this.applyButton);
    }

    async waitForApplyButtonEnabled() {
        try {
            await this.waitForElementEnabled(this.applyButton);
            await this.pause(400);
        } catch (err) {
            await this.handleError('Inspection Panel, Apply button should be enabled', 'err_apply_button', err);
        }
    }

    async waitForApplyButtonDisabled() {
        try {
            await this.waitForElementDisabled(this.applyButton);
        } catch (err) {
            await this.handleError('Inspection Panel, Apply button should be disabled', 'err_apply_button', err)
        }
    }
}

module.exports = BaseComponentInspectionPanel;
