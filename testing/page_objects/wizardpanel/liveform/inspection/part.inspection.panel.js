/**
 * Created on 02.05.2024
 */
const Page = require('../../../page');
const lib = require('../../../../libs/elements');
const appConst = require('../../../../libs/app_const');

const xpath = {
    container: "//div[contains(@id,'PartInspectionPanel')]",
    componentDescriptorsDropdownDiv: "//div[contains(@id,'ComponentDescriptorsDropdown')]",
};

// Context Window, Part Inspect tab
class PartInspectionPanel extends Page {

    get partDropdownOptionsFilterInput() {
        return xpath.container + lib.DROPDOWN_OPTION_FILTER_INPUT;
    }

    async getDropdownSelectedOption() {
        let locator = xpath.container + "//div[contains(@id,'SelectedOptionView')]" + lib.H6_DISPLAY_NAME;
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        return await this.getText(locator);
    }

    waitForOpened() {
        return this.waitForElementDisplayed(xpath.container);
    }

    async getTextFomTextInputConfig(){
        let locatorTextLine = xpath.container + "//div[contains(@id,'TextLine')]"+ lib.TEXT_INPUT;
        await this.waitForElementDisplayed(locatorTextLine,appConst.mediumTimeout);
        return await this.getTextInInput(locatorTextLine + lib.TEXT_INPUT);
    }

    async typeTexInTextInputConfig(text){
        let locatorTextLine = xpath.container + "//div[contains(@id,'TextLine')]"+ lib.TEXT_INPUT;
        await this.waitForElementDisplayed(locatorTextLine,appConst.mediumTimeout);
        return await this.typeTextInInput(locatorTextLine, text);
    }
}

module.exports = PartInspectionPanel;
