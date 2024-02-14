/**
 * Created on 04.04.2022
 */
const Page = require('../../page');
const lib = require('../../../libs/elements');
const appConst = require('../../../libs/app_const');
const ContentSelectorDropdown = require('../../components/content.selector.dropdown');

const XPATH = {
    container: `//div[contains(@id,'XDataWizardStepForm')]`,
    selectedOptionByName: option => {
        return `//div[contains(@id,'ContentSelectedOptionView') and descendant::h6[contains(@class,'main-name') and text()='${option}']]`
    },
};

class XDataContentSelector extends Page {

    get contentOptionsFilterInput() {
        return XPATH.container +  "//div[contains(@id,'ContentTreeSelectorDropdown')]" + lib.OPTION_FILTER_INPUT;
    }

    async filterOptionsAndSelectContent(displayName) {
        try {
            let contentSelectorDropdown = new ContentSelectorDropdown();
            await contentSelectorDropdown.selectFilteredContentAndClickOnOk(displayName);
            return await this.pause(500);
        } catch (err) {
            await this.saveScreenshot(appConst.generateRandomName("err_xdata_content_selector"));
            throw new Error("X-data, content selector - " + err);
        }
    }

    async waitForSelectedOptionDisplayed() {
        let selector = XPATH.container + "//div[contains (@id,'ContentSelectedOptionView')]";
        return await this.waitForElementDisplayed(selector, appConst.shortTimeout);
    }

    async removeSelectedOption(option) {
        let locator = XPATH.selectedOptionByName(option) + lib.REMOVE_ICON;
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        await this.clickOnElement(locator);
        return await this.pause(500);
    }

    waitForContentOptionsFilterInputDisplayed() {
        return this.waitForElementDisplayed(this.contentOptionsFilterInput, appConst.shortTimeout).catch(err => {
            throw new Error("x-data, Content Selector - options filter input is not visible! " + err);
        });
    }

    getSelectedOptions() {
        let locator = "//div[contains(@id,'ContentSelectedOptionView')]//h6[contains(@class,'main-name')]";
        return this.getTextInElements(locator);
    }
}

module.exports = XDataContentSelector;
