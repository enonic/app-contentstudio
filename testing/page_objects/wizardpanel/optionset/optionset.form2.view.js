/**
 * Created on 10.04.2021. Updated on 17.06.2026
 */
const BaseOptionSetFormView = require('./base.option.set.form.view');
const {COMMON} = require('../../../libs/elements');
const appConst = require('../../../libs/app_const');

const xpath = {
    container: "//div[@data-component='OptionSetView' and child::div[@data-component='SetHeader']//span[text()='Single selection']]",
    optionSetMoreMenuButton: "//div[@data-component='OptionSetOccurrenceView']//button[@aria-label='More actions']",
    resetMenuItem: "//div[@data-component='ContextMenu.Content']//div[@data-component='ContextMenu.Item' and text()='Reset']",
    checkboxByLabel: label => `//div[@data-component='Checkbox' and descendant::span[text()='${label}']]//label`,
};

class OptionSetForm2View extends BaseOptionSetFormView {

    get container() {
        return xpath.container;
    }

    get optionSetMenuButton() {
        return xpath.container + xpath.optionSetMoreMenuButton;
    }

    async selectOption(optionDisplayName) {
        try {
            let locator = xpath.container + COMMON.INPUTS.dataComponentRadioByLabel(optionDisplayName);
            await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
            await this.clickOnElement(locator);
            return await this.pause(500);
        } catch (err) {
            await this.handleError('Option Set Form2 - select option:', 'err_optionset2', err);
        }
    }

    async clickOnCheckboxByLabel(label) {
        let locator = xpath.container + xpath.checkboxByLabel(label);
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        return await this.clickOnElement(locator);
    }

    async expandOptionSetMenu() {
        await this.waitForElementDisplayed(this.optionSetMenuButton, appConst.mediumTimeout);
        await this.clickOnElement(this.optionSetMenuButton);
        return await this.pause(400);
    }

    async clickOnResetMenuItem() {
        await this.expandOptionSetMenu();
        let resetMenuItems = await this.getDisplayedElements(xpath.resetMenuItem);
        await resetMenuItems[0].click();
        return await this.pause(400);
    }
}

module.exports = OptionSetForm2View;
