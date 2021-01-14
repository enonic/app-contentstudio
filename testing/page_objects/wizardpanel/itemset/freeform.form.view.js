/**
 * Created on 12.04.2019.
 */
const Page = require('../../page');
const appConst = require('../../../libs/app_const');
const lib = require('../../../libs/elements');

const xpath = {
    itemSet: "//div[contains(@id,'FormItemSetView')]",
    elementTypeSetView: "//div[contains(@id,'FormOptionSetView') and descendant::h5[text()='element type']]",
    inputTypeSetView: "//div[contains(@id,'FormOptionSetOptionView') and descendant::h5[text()='input type']]",
    elementTypeDropdown: "//div[contains(@id,'FormOptionSetView') and descendant::h5[text()='element type']]//div[contains(@id,'Dropdown')]",
    inputTypeDropdown: "//div[contains(@id,'FormOptionSetView') and descendant::h5[text()='input type']]//div[contains(@id,'Dropdown')]",
    addInputButton: "//button[contains(@id,'Button') and child::span[text()='Add Input']]"
};

class FreeFormView extends Page {

    //element type options filter
    get elementTypeOptionFilterInput() {
        return xpath.itemSet + xpath.elementTypeSetView + lib.DROPDOWN_OPTION_FILTER_INPUT;
    }

    get elementTypeDropDownHandle() {
        return xpath.itemSet + xpath.elementTypeSetView + "//div[contains(@id,'Dropdown')]" + lib.DROP_DOWN_HANDLE;
    }

    get inputTypeOptionFilterInput() {
        return xpath.itemSet + xpath.inputTypeSetView + lib.DROPDOWN_OPTION_FILTER_INPUT;
    }

    get inputTypeDropDownHandle() {
        return xpath.itemSet + xpath.inputTypeSetView + "//div[contains(@id,'Dropdown')]" + lib.DROP_DOWN_HANDLE;
    }

    get addInputButton() {
        return xpath.itemSet + xpath.addInputButton;
    }

    async selectInputType(inputType) {
        await this.waitForElementDisplayed(xpath.itemSet + xpath.inputTypeDropdown, appConst.mediumTimeout);
        await this.scrollPanel(800);
        await this.clickOnElement(this.inputTypeDropDownHandle);
        await this.pause(300);
        await this.typeTextInInput(this.inputTypeOptionFilterInput, inputType);

        let optionLocator = lib.slickRowByDisplayName(xpath.inputTypeSetView, inputType);
        await this.waitForElementDisplayed(optionLocator, appConst.mediumTimeout);
        let elements = await this.getDisplayedElements(optionLocator);
        await elements[0].click();
        return await this.pause(200);
    }

    async expandOptionsAndSelectInputType(option) {
        await this.scrollPanel(600);
        await this.waitForElementDisplayed(this.inputTypeDropDownHandle, appConst.mediumTimeout);
        await this.clickOnElement(this.inputTypeDropDownHandle);
        await this.pause(1000);
        await this.typeTextInInput(this.inputTypeOptionFilterInput, "");
        let optionLocator = xpath.inputTypeSetView + lib.itemByDisplayName(option);
        await this.waitForElementDisplayed(optionLocator, appConst.mediumTimeout);
        await this.clickOnElement(optionLocator);
        return await this.pause(200);
    }

    //Expands options and clicks on the option
    async expandOptionsAndSelectElementType(option) {
        await this.scrollPanel(600);
        await this.waitForElementDisplayed(this.elementTypeDropDownHandle, appConst.mediumTimeout);
        await this.clickOnElement(this.elementTypeDropDownHandle);
        let optionLocator = xpath.elementTypeSetView + lib.itemByDisplayName(option);
        await this.waitForElementDisplayed(optionLocator, appConst.mediumTimeout);
        return await this.clickOnElement(optionLocator);
    }

    //Types a text in the option filter input and select the option:
    async selectElementType(option) {
        await this.waitForElementDisplayed(xpath.itemSet + xpath.elementTypeDropdown, appConst.mediumTimeout);
        await this.clickOnElement(xpath.itemSet + xpath.elementTypeDropdown);
        await this.typeTextInInput(this.elementTypeOptionFilterInput, option);

        let optionLocator = "//div[contains(@id,'FormOptionSetView') and descendant::h5[text()='element type']]" +
                            lib.slickRowByDisplayName(option);
        await this.waitForElementDisplayed(optionLocator, appConst.mediumTimeout);
        let element = await this.getDisplayedElements(optionLocator);
        await element.moveTo();
        await element.click();
        return await this.pause(200);
    }
}

module.exports = FreeFormView;
