/**
 * Created on 1.12.2017.
 */
const Page = require('../page');
const lib = require('../../libs/elements');
const appConst = require('../../libs/app_const');
const ContentMoveComboBox = require('../components/selectors/content.move.combobox');

const XPATH = {
    container: `//div[contains(@id,'MoveContentDialog')]`,
    header: `//div[contains(@class,'modal-dialog-header')]/h2`,
    path: `//div[contains(@class,'modal-dialog-header')]/h6`,
    contentMoveComboBox: "//div[contains(@id,'ContentMoveComboBox')]"
};

class MoveContentDialog extends Page {

    get header() {
        return XPATH.container + XPATH.header;
    }

    get optionFilterInput() {
        return XPATH.container + XPATH.contentMoveComboBox + lib.OPTION_FILTER_INPUT;
    }

    get dropDownHandle() {
        return XPATH.container + XPATH.contentMoveComboBox + lib.DROP_DOWN_HANDLE;
    }

    get moveButton() {
        return XPATH.container + lib.dialogButton('Move');
    }

    get cancelButton() {
        return XPATH.container + lib.dialogButton('Cancel');
    }

    get cancelButtonTop() {
        return XPATH.container + lib.CANCEL_BUTTON_TOP;
    }

    clickOnCancelButton() {
        return this.clickOnElement(this.cancelButton).catch(err => {
            this.saveScreenshot('err_move_dialog_cancel');
            throw new Error('Error when try click on Cancel button ' + err);
        })
    }

    clickOnCancelTopButton() {
        return this.clickOnElement(this.cancelButtonTop);
    }

    async clickOnDropdownHandle() {
        try {
            await this.clickOnElement(this.dropDownHandle);
            await this.pause(300);
            await this.waitForSpinnerNotVisible(appConst.mediumTimeout);
            await this.pause(500);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_move_dialog_dropdown');
            throw new Error("Error occurred in Move Dialog, screenshot: " + screenshot + "  " + err);
        }
    }

    waitForOpened() {
        return this.waitForElementDisplayed(this.moveButton, appConst.mediumTimeout).catch(err => {
            this.saveScreenshot('err_move_content_dialog_load');
            throw new Error('Move Content dialog was not loaded! ' + err);
        });
    }

    waitForClosed() {
        return this.waitForElementNotDisplayed(XPATH.container, appConst.mediumTimeout).catch(error => {
            this.saveScreenshot('err_move_content_dialog_close');
            throw new Error('Error occurred in Move Content Dialog was not closed');
        });
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
            let contentMoveComboBox = new ContentMoveComboBox();
            return await contentMoveComboBox.selectFilteredContentAndClickOnOk(displayName, XPATH.container);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_move_dialog');
            throw new Error("Error occurred in Move Dialog - after selecting an option, screenshot: " + screenshot + "  " + err);
        }
    }

    async clickOnOptionInDropdown(displayName) {
        try {
            let contentMoveComboBox = new ContentMoveComboBox();
            let optionLocator = contentMoveComboBox.buildLocatorForOptionByDisplayName(displayName, XPATH.container);
            return await contentMoveComboBox.clickOnElement(optionLocator);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_click_on_option');
            throw new Error("Error occurred in Move Dialog after clicking on the option, screenshot: " + screenshot + "  " + err);
        }
    }


    async clickOnApplySelectionButton() {
        let contentMoveComboBox = new ContentMoveComboBox();
        await contentMoveComboBox.clickOnApplySelectionButton(XPATH.container);
    }

    async clickOnRemoveOptionIcon() {
        let locator = XPATH.container + "//div[contains(@id,'ContentSelectedOptionView')]" + lib.REMOVE_ICON;
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        await this.clickOnElement(locator);
        await this.pause(200);
    }

    async typeTextInOptionFilterInput(text) {
        await this.typeTextInInput(this.optionFilterInput, text);
        return await this.pause(1000);
    }

    async isDestinationDisabled(name) {
        let optionLocator = lib.DROPDOWN_SELECTOR.contentListElementByName(XPATH.container, name);
        let attr = await this.getAttribute(optionLocator, 'class')
        return attr.includes('readonly');
    }

    async isDestinationByDisplayNameDisabled(displayName) {
        let optionLocator = lib.DROPDOWN_SELECTOR.contentListElementByDisplayName(XPATH.container, displayName);
        await this.waitForElementDisplayed(optionLocator, appConst.mediumTimeout);
        let attr = await this.getAttribute(optionLocator, 'class')
        return attr.includes('readonly');
    }

    async getOptionsName() {
        let locator = XPATH.container + lib.DROPDOWN_SELECTOR.OPTIONS_LI_ELEMENT + lib.H6_DISPLAY_NAME;
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        return await this.getTextInDisplayedElements(locator);
    }

    async waitForMoveButtonDisabled() {
        try {
            return await this.waitForElementDisabled(this.moveButton, appConst.mediumTimeout);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_move_dialog');
            throw new Error("Move Dialog - Move button should be disabled, screenshot: " + screenshot + "  " + err);
        }
    }

    async waitForMoveButtonEnabled() {
        try {
            return await this.waitForElementEnabled(this.moveButton, appConst.mediumTimeout);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_move_btn_dialog');
            throw new Error("Move Dialog - Move button should be enabled, screenshot: " + screenshot + "  " + err);
        }
    }
}

module.exports = MoveContentDialog;
