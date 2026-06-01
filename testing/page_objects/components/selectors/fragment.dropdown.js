/**
 * Created on 01.03.2024
 */
const BaseDropdown = require('./base.dropdown');
const lib = require('../../../libs/elements-old');
const appConst = require('../../../libs/app_const');

const XPATH = {
    dataComponentDiv: "//div[contains(@data-component='FragmentContentSelector']",
}

class FragmentDropdown extends BaseDropdown {



    constructor(parentElementXpath) {
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
            await this.clickOnOptionByName(optionName);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_dropdown');
            throw new Error('CustomSelectorComboBox - Error during selecting the option, screenshot: ' + screenshot + ' ' + err);
        }
    }

    async getOptionsDisplayName() {
        let locator = XPATH.container + XPATH.fragmentDropdownListUL + lib.DROPDOWN_SELECTOR.DROPDOWN_LIST_ITEM + lib.H6_DISPLAY_NAME;
        await this.waitUntilDisplayed(locator, appConst.mediumTimeout);
        await this.pause(300);
        return await this.getTextInDisplayedElements(locator);
    }

    async getSelectedOptionPath(optionName) {
        let locator = XPATH.container + lib.P_SUB_NAME;
        return await this.getText(locator);
    }
}

module.exports = FragmentDropdown;
