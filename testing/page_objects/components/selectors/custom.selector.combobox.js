/**
 * Created on 20.02.2024
 */
const BaseDropdown = require('../base.dropdown');
const lib = require('../../../libs/elements');
const appConst = require('../../../libs/app_const');

const XPATH = {
    container: "//div[contains(@id,'CustomSelectorComboBox')]",
    selectorListBoxUL: "//ul[contains(@id,'CustomSelectorListBox')]",
    comoboxListItem: "//li[contains(@class,'item-view-wrapper')]",
    optionByText: text => {
        return `//div[contains(@id,'ComboBoxDisplayValueViewer') and text()='${text}']`
    },
};

class CustomSelectorComboBox extends BaseDropdown {

    get container() {
        return XPATH.container;
    }

    async selectFilteredOptionAndClickOnOk(optionName, parentElement) {
        try {
            await this.clickOnFilteredItemAndClickOnOk(optionName, parentElement);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_dropdown');
            throw new Error('CustomSelectorComboBox - Error during selecting the option, screenshot: ' + screenshot + ' ' + err);
        }
    }

    async getOptionsName(parentXpath) {
        if (parentXpath === undefined) {
            parentXpath = '';
        }
        let locator = parentXpath + XPATH.selectorListBoxUL + XPATH.comoboxListItem + lib.H6_DISPLAY_NAME;
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        await this.pause(500);
        return await this.getTextInDisplayedElements(locator);
    }

    // async clickOnOptionByDisplayName(option) {
    //     let optionLocator = XPATH.optionByText(option);
    //     //  Wait for the required option is displayed:
    //     await this.waitForElementDisplayed(optionLocator, appConst.mediumTimeout);
    //     // Click on the item:
    //     await this.clickOnElement(optionLocator);
    // }
}

module.exports = CustomSelectorComboBox;
