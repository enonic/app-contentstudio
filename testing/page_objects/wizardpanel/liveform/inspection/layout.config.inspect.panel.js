/**
 * Created on 24.01.2023
 */
const Page = require('../../../page');
const lib = require('../../../../libs/elements');
const appConst = require('../../../../libs/app_const');
const SingleSelectionOptionSet = require('../../optionset/single.selection.option.set.view');

const xpath = {
    container: `//div[contains(@id,'LayoutInspectionPanel')]`,
    header: "//h5[text()='Single selection']",
    option1NameInput: "//input[contains(@id,'TextInput') and contains(@name,'name1')]",
    option2NameInput: "//input[contains(@id,'TextInput') and contains(@name,'name2')]",
};

//Context Window, Inspect tab for Layout Component with cfg file
class LayoutConfigInspectPanel extends Page {

    get option1TextInput() {
        return xpath.container + xpath.option1NameInput;
    }

    get option2TextInput() {
        return xpath.container + xpath.option2NameInput;
    }

    async typeTextInOption1TextInput(text) {
        try {
            await this.waitForElementDisplayed(this.option1TextInput, appConst.mediumTimeout);
            await this.typeTextInInput(this.option1TextInput, text);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_layout_config');
            throw new Error(`Inspect Panel, Layout config - option1 text input, screenshot: ${screenshot} ` + err);
        }
    }

    async getTextInOption1TextInput() {
        return await this.getTextInInput(this.option1TextInput);
    }

    async typeTextInOption2TextInput(text) {
        await this.typeTextInInput(this.option2TextInput, text);
    }

    async getTextInOption2TextInput() {
        return await this.getTextInInput(this.option2TextInput);
    }

    async waitForOpened() {
        try {
            await this.waitForElementDisplayed(xpath.header, appConst.mediumTimeout)
        } catch (err) {
            await this.saveScreenshot('err_layout_cfg_inspect_panel');
            throw new Error('Live Edit, Inspection was not loaded' + err);
        }
    }

    async resetSelectedOption() {
        let singleSelectionOptionSet = new SingleSelectionOptionSet();
        await singleSelectionOptionSet.expandOptionSetMenuAndClickOnMenuItem(0, 'Reset');
    }

    async selectOption(option) {
        let singleSelectionOptionSet = new SingleSelectionOptionSet();
        await singleSelectionOptionSet.selectOption(option);
    }

    async clickOnApplyButton() {
        let locator = "//div[contains(@id,'ContextWindow')]" + lib.actionButton('Apply');
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        await this.clickOnElement(locator);
        return await this.pause(1000);
    }

}

module.exports = LayoutConfigInspectPanel;

