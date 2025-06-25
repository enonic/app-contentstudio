/**
 * Created on 26.02.2026
 */
const BasDropdown = require('./base.dropdown');
const {DROPDOWN} = require('../../../libs/elements');
const appConst = require('../../../libs/app_const');

const xpath = {
    dataComponent: "//div[@data-component='OwnerSelector']",
};

class OwnerSelectorDropdown extends BasDropdown {

    constructor(parentElementXpath) {
        super();
        this._parentContainer = parentElementXpath;
    }

    get container() {
        return this._parentContainer;
    }

    optionsFilterInput() {
        return this.container + xpath.dataComponent + DROPDOWN.OPTION_FILTER_INPUT;
    }

    async clickOnFilteredOwner(language) {
        try {
            await this.doFilterItem(language);
            await this.clickOnOptionByDisplayName(language);
        } catch (err) {
            await this.handleError(`Language selector - Tried to click on filtered option: ${language}`, 'err_click_lang_option', err);
        }
    }
    //overridden
    async clickOnOptionByDisplayName(language){
        let optionLocator = this.container + DROPDOWN.languageTreeItemByDisplayName(language);
        await this.waitForElementDisplayed(optionLocator, appConst.mediumTimeout);
        await this.clickOnElement(optionLocator);
    }
}

module.exports = OwnerSelectorDropdown;
