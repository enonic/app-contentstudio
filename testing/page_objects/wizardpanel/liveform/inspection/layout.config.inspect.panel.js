/**
 * Created on 24.01.2023 updated on 16.06.2026
 */
const LayoutInspectionPanel = require('./layout.inspection.panel');
const appConst = require('../../../../libs/app_const');
const SingleSelectionOptionSet = require('../../optionset/single.selection.option.set.view');

const xpath = {
    container: `//div[@data-component= 'ComponentInspectionPanel']`,
    header: "//div[@data-component='SetHeader']//span[text()='Single selection']",
    option1NameInput: "//input[@aria-label='Name1']",
    option2NameInput: "//input[@aria-label='Name2']",
};

//Context Window, Inspect tab for Layout Component with cfg file
class LayoutConfigInspectPanel extends LayoutInspectionPanel {

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
            await this.waitForElementDisplayed(xpath.header, appConst.mediumTimeout);
        } catch (err) {
            await this.handleError("Layout config inspect panel:", 'err_layout_config_inspect', err);
        }
    }

    async selectRadioOption(option) {
        let locator = xpath.container + `//button[@data-component='RadioGroup.Item' and .//span[text()='${option}']]`;
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        await this.clickOnElement(locator);
    }

}

module.exports = LayoutConfigInspectPanel;

