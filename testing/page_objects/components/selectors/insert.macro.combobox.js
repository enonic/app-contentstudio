/**
 * Created on 16.02.2024
 */
const BaseDropdown = require('./base.dropdown');
const XPATH = {
    macroSelector: "//div[@data-component='MacroSelector']",
};

class MacroComboBox extends BaseDropdown {

    constructor(parentElementXpath) {
        super();
        this._container = parentElementXpath;
    }

    get container() {
        return this._container
    }

    get dataComponentDiv() {
        return XPATH.macroSelector;
    }

    async selectFilteredByDisplayNameItem(displayName) {
        try {
            await this.doFilterItem(displayName);
            await this.clickOnOptionByDisplayName(displayName);
        } catch (err) {
            await this.handleError('Macro Selector, Error during selecting the option', 'err_insert_macro', err);
        }
    }
}

module.exports = MacroComboBox;
