/**
 * Created on 01.03.2024
 */
const BaseDropdown = require('./base.dropdown');
const {DROPDOWN} = require('../../../libs/elements');
const appConst = require('../../../libs/app_const');

const XPATH = {
    dataComponentDiv: "//div[@data-component='FragmentContentSelector']",
}

class FragmentDropdown extends BaseDropdown {

    constructor(parentElementXpath = '') {
        super();
        this._container = parentElementXpath;
    }

    get container() {
        return this._container;
    }

    get dataComponentDiv() {
        return XPATH.dataComponentDiv;
    }

    async selectFilteredFragment(optionName) {
        try {
            await this.doFilterItem(optionName);
            await this.clickOnOptionByDisplayName(optionName);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_fragment_dropdown');
            throw new Error('FragmentDropdown - Error during selecting the option, screenshot: ' + screenshot + ' ' + err);
        }
    }

    async selectFilteredFragmentByPath(fragmentName) {
        try {
            await this.doFilterItem(fragmentName);
            await this.clickOnOptionByName(fragmentName);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_fragment_dropdown');
            throw new Error('FragmentDropdown - Error during selecting the option, screenshot: ' + screenshot + ' ' + err);
        }
    }

    async getOptionsDisplayName() {
        let locator = DROPDOWN.COMBOBOX_POPUP + "//div[@role='option']//span[contains(@class,'font-semibold')]";
        await this.waitUntilDisplayed(locator, appConst.mediumTimeout);
        await this.pause(300);
        return await this.getTextInDisplayedElements(locator);
    }

    // returns the display name of the selected option in the collapsed combobox('Combobox.Value' button):
    async getSelectedOption() {
        let locator = this.container + XPATH.dataComponentDiv + DROPDOWN.COMBOBOX_VALUE;
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        return await this.getText(locator);
    }
}

module.exports = FragmentDropdown;
