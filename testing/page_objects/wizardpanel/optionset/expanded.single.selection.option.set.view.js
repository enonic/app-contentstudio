/**
 * Created on 31.10.2022
 */
const Page = require('../../page');
const lib = require('../../../libs/elements');
const appConst = require('../../../libs/app_const');
const xpath = {
    container: "//div[contains(@id,'FormOptionSetOccurrenceViewSingleOption')]",
    dropDownDiv: "//div[contains(@id,'Dropdown')]",
    selectionMenuButton: "//button[contains(@id,'MoreButton')]",
    option1_NameTextInput: "//div[contains(@id,'InputView') and descendant::div[text()='option-1-name']]" + lib.TEXT_INPUT,
    option2_OptionsFilterInput: "//div[contains(@id,'InputView') and descendant::div[text()='option-2-image-selector']]" +
                                lib.COMBO_BOX_OPTION_FILTER_INPUT,
    option1_NameTextInputLabel: "//div[contains(@id,'InputView')]//div[text()='option-1-name']]",
    option2_ImageSelectorLabel: "//div[contains(@id,'InputView')]//div[text()='option-2-image-selector']]",
    resetMenuItem: "//div[contains(@id,'FormOptionSetOccurrenceView')]//li[contains(@id,'MenuItem') and text()='Reset']",
};

/**
 * Page Object for content with single-select option-sets with <expanded>true</expanded>
 */
class ExpandedSingleSelectionOptionSet extends Page {

    //Option 1, name input:
    get option1TextInput() {
        return xpath.container + xpath.option1_NameTextInput;
    }

    get option2OptionsFilterInput() {
        return xpath.container + xpath.option2_OptionsFilterInput;
    }

    waitForOption1TextInputDisplayed() {
        return this.waitForElementDisplayed(this.option1TextInput, appConst.mediumTimeout);
    }

    waitForOption1TextInputNotDisplayed() {
        return this.waitForElementNotDisplayed(this.option1TextInput, appConst.mediumTimeout);
    }

    waitForOption2FilterInputDisplayed() {
        return this.waitForElementDisplayed(this.option2OptionsFilterInput, appConst.mediumTimeout);
    }

    waitForOption2FilterInputNotDisplayed() {
        return this.waitForElementNotDisplayed(this.option2OptionsFilterInput, appConst.mediumTimeout);
    }

    //Dropdown handle in options-selector:
    get dropDownHandle() {
        return xpath.container + xpath.dropDownDiv + lib.DROP_DOWN_HANDLE;
    }

    //More button (menu button) appears when an option is selected
    get selectionMenuButton() {
        return xpath.container + xpath.selectionMenuButton;
    }

    //Expands the menu button:
    async expandOptionSetMenu() {
        await this.waitForElementDisplayed(this.selectionMenuButton, appConst.mediumTimeout);
        await this.clickOnElement(this.selectionMenuButton);
        return await this.pause(500);
    }

    //Clicks on Reset menu button
    async clickOnResetMenuItem() {
        let resetMenuItems = await this.getDisplayedElements(xpath.resetMenuItem);
        await resetMenuItems[0].click();
        return await this.pause(400);
    }

    async selectOption(option) {
        try {
            await this.waitForElementDisplayed(this.dropDownHandle, appConst.mediumTimeout);
            await this.clickOnElement(this.dropDownHandle);
            let optionLocator = xpath.container + xpath.dropDownDiv + lib.itemByDisplayName(option);
            await this.waitForElementDisplayed(optionLocator, appConst.mediumTimeout);
            await this.clickOnElement(optionLocator);
            return await this.pause(500);
        } catch (err) {
            let screenshot = appConst.generateRandomName("err_optionset");
            await this.saveScreenshot(screenshot);
            throw new Error("Error,after selecting the option in single selection, screenshot:" + screenshot + "  " + err);
        }
    }
}

module.exports = ExpandedSingleSelectionOptionSet;
