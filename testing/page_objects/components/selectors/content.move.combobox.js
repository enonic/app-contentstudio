/**
 * Created on 08.01.2024 updated on 26.02.2026
 */
const BaseDropdown = require('./base.dropdown');
const {DROPDOWN} = require('../../../libs/elements');
const appConst = require('../../../libs/app_const');

const xpath = {
    pathSelector: "//div[@data-component='PathSelector']"
};

class ContentMoveComboBox extends BaseDropdown {

    constructor(parentElementXpath) {
        super();
        this._container = parentElementXpath;
    }

    get container() {
        return this._container
    }

    optionsFilterInput() {
        return this.container + xpath.pathSelector + DROPDOWN.OPTION_FILTER_INPUT;
    }

    async clickOnOptionByDisplayName(optionDisplayName) {
        try {
            let optionLocator;
            if (optionDisplayName === 'Project root') {
                optionLocator = DROPDOWN.COMBOBOX_POPUP + "//div[contains(@data-component,'PathSelectorRootLabel')]/ancestor::div[1]";

            } else {
                optionLocator = DROPDOWN.COMBOBOX_POPUP + DROPDOWN.treeItemByDisplayName(optionDisplayName) + "/ancestor::div[1]";
            }
            await this.waitForElementDisplayed(optionLocator, appConst.mediumTimeout);
            await this.clickOnElement(optionLocator);
        } catch (err) {
            await this.handleError(`Dropdown Selector, tried to click on option: ${optionDisplayName}`,
                'err_click_option', err);
        }
    }

    async clickOnFilteredContent(displayName) {
        try {
            await this.doFilterItem(displayName);
            await this.clickOnOptionByDisplayName(displayName);
        } catch (err) {
            await this.handleError(`Dropdown Selector, tried to click on filtered option: ${displayName}`, 'err_click_option', err);
        }
    }

    async getOptionsDisplayName() {
        let locator = DROPDOWN.COMBOBOX_POPUP + DROPDOWN.CONTENT_LABEL_OPTIONS_NAME;
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        let elements = await this.findElements(locator);
        let optionsNames = [];
        for (const el of elements) {
            optionsNames.push(await el.getText());
        }
        return optionsNames;
    }
}

module.exports = ContentMoveComboBox;
