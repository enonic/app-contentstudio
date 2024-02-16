/**
 * Created on 15.02.2024
 */
const BasDropdown = require('./base.dropdown');
const appConst = require('../../libs/app_const');
const XPATH = {
    container: "//div[contains(@id,'ComboBox')]",
    comboBoxListInput: "//div[contains(@id,'ComboBoxListInput')]",
    listItemViewer: "//div[contains(@id,'ComboBoxDisplayValueViewer')]",
    comboboxList: "//ul[contains(@id,'ComboBoxList))",
    comoboxListItem: "//li[contains(@class,'item-view-wrapper')]",
    optionByText: text => {
        return `//div[contains(@id,'ComboBoxDisplayValueViewer') and text()='${text}']`
    },
};

class ComboBoxListInput extends BasDropdown {

    get container() {
        return XPATH.container;
    }

    async selectFilteredOptionAndClickOnOk(option) {
        try {
            await this.filterItem(option, this.container);
            // 2. Wait for the required option is displayed then click on it:
            await this.clickOnOptionByDisplayName(option, this.container);
            // 3. Click on 'OK' button:
            return await this.clickOnApplySelectionButton(this.container);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_dropdown');
            throw new Error('Error occurred in ComboBoxListInput, screenshot: ' + screenshot + ' ' + err);
        }
    }

    async clickOnOptionByDisplayName(option) {
        let optionLocator = XPATH.optionByText(option);
        //  Wait for the required option is displayed:
        await this.waitForElementDisplayed(optionLocator, appConst.mediumTimeout);
        // Click on the item:
        await this.clickOnElement(optionLocator);
    }
}

module.exports = ComboBoxListInput;
