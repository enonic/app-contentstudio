/**
 * Created on 1.12.2017.
 */
const Page = require('../page');
const {DROPDOWN, BUTTONS} = require('../../libs/elements');
const appConst = require('../../libs/app_const');
const ContentMoveComboBox = require('../components/selectors/content.move.combobox');

const XPATH = {
    container: `//div[@data-component='MoveDialogMainContent']`,
    header: `//div[contains(@class,'modal-dialog-header')]/h2`,
    path: `//div[contains(@class,'modal-dialog-header')]/h6`,
    pathSelector: "//div[@data-component='PathSelector']",
};

class MoveContentDialog extends Page {

    get header() {
        return XPATH.container + XPATH.header;
    }

    get optionFilterInput() {
        return XPATH.container + XPATH.pathSelector + DROPDOWN.OPTION_FILTER_INPUT;
    }

    get dropDownHandle() {
        return XPATH.container + XPATH.pathSelector + DROPDOWN.DROPDOWN_HANDLE;
    }

    get moveButton() {
        return XPATH.container + BUTTONS.buttonByLabel('Move');
    }

    get closeButton() {
        return XPATH.container + BUTTONS.buttonAriaLabel('Close');
    }

    async clickOnCloseButton() {
        try {
            await this.waitForElementDisplayed(this.closeButton);
            return await this.clickOnElement(this.closeButton);
        } catch (err) {
            await this.handleError('Move Dialog - Tried to click on Cancel button', 'err_move_dialog_close', err);
        }
    }

    async clickOnDropdownHandle() {
        try {
            await this.clickOnElement(this.dropDownHandle);
            await this.pause(300);
            await this.waitForSpinnerNotVisible(appConst.mediumTimeout);
            await this.pause(500);
        } catch (err) {
            await this.handleError('Move Dialog - Tried to click on dropdown handle', 'err_move_dialog_dropdown_handle', err);
        }
    }

    async waitForOpened() {
        try {
            return await this.waitForElementDisplayed(this.moveButton);
        } catch (err) {
            await this.handleError('Move Content dialog was not loaded!', 'err_move_content_dialog_load', err);
        }
    }

    async waitForClosed() {
        try {
            return await this.waitForElementNotDisplayed(XPATH.container);
        } catch (err) {
            await this.handleError('Move content dialog should be closed! ', 'err_close_move_dlg', err);
        }
    }

    async isOpened(){
        return await this.isElementDisplayed(XPATH.container);
    }

    getHeaderText() {
        return this.getText(this.header);
    }

    async clickOnMoveButton() {
        await this.clickOnElement(this.moveButton);
        return await this.pause(700);
    }

    async typeTextAndClickOnOption(displayName) {
        try {
            let contentMoveComboBox = new ContentMoveComboBox(XPATH.container);
            return await contentMoveComboBox.clickOnFilteredContent(displayName);
        } catch (err) {
            await this.handleError('Move Dialog - Tried to select the option in dropdown', 'err_move_dialog_select_option', err);
        }
    }

    async clickOnOptionInDropdown(displayName) {
        try {
            let contentMoveComboBox = new ContentMoveComboBox(XPATH.container);
            await contentMoveComboBox.clickOnOptionByDisplayName(displayName);
        } catch (err) {
            await this.handleError('Move Dialog - Tried to click on the option in dropdown', 'err_move_dialog_click_option', err);
        }
    }

    async clickOnRemoveOptionIcon() {
        try {
            let locator = XPATH.container + "//div[@data-component='PathSelector']" + BUTTONS.BUTTON_REMOVE_ICON;
            await this.waitForElementDisplayed(locator);
            await this.clickOnElement(locator);
            await this.pause(200);
        } catch (err) {
            await this.handleError('Move Dialog - Tried to click on remove option icon', 'err_move_dialog_remove_option', err);
        }
    }

    async typeTextInOptionFilterInput(text) {
        let contentMoveComboBox = new ContentMoveComboBox(XPATH.container);
        await contentMoveComboBox.doFilterItem(text);
        return await this.pause(1000);
    }

    async isOptionRowDisabled(displayName) {
        try {
            let optionLocator;
            if (displayName === 'Project root') {
                optionLocator = DROPDOWN.COMBOBOX_POPUP + "//div[contains(@data-component,'PathSelectorRootLabel')]/ancestor::div[1]";

            } else {
                optionLocator = DROPDOWN.COMBOBOX_POPUP + DROPDOWN.treeItemByDisplayName(displayName) + "/ancestor::div[1]";
            }
            let elementRow = await this.findElement(optionLocator);
            let attr = await this.getAttribute(elementRow, 'class')
            return attr.includes('pointer-events-none');
        } catch (err) {
            await this.handleError(`Move Dialog - Tried to check if the option is disabled: ${displayName}`, 'err_check_option', err);
        }
    }

    async getOptionsName() {
        let contentMoveComboBox = new ContentMoveComboBox(XPATH.container);
        return await contentMoveComboBox.getOptionsDisplayName();
    }

    async waitForMoveButtonDisabled() {
        try {
            return await this.waitForElementDisabled(this.moveButton);
        } catch (err) {
            await this.handleError("Move Dialog - Move button should be disabled", 'err_move_btn_disabled', err);
        }
    }

    async waitForMoveButtonEnabled() {
        try {
            return await this.waitForElementEnabled(this.moveButton);
        } catch (err) {
            await this.handleError("Move Dialog - Move button should be enabled", 'err_move_btn_enabled', err);
        }
    }
}

module.exports = MoveContentDialog;
