const Page = require('../page');
const lib = require('../../libs/elements');
const appConst = require('../../libs/app_const');
const XPATH = {
    container: `//div[contains(@id,'SiteConfiguratorDialog')]`,
    applyButton: `//button[contains(@id,'DialogButton') and child::span[text()='Apply']]`,
    cancelButton: `//button[contains(@id,'DialogButton') and child::span[text()='Cancel']]`,
    imageSelectorOptionFilterInput: `//div[contains(@id,'ImageContentComboBox')]//input[contains(@id,'ComboBoxOptionFilterInput')]`,
    trackingIdTextInput: "//input[contains(@name,'trackingId')]"
};

class SiteConfiguratorDialog extends Page {

    get cancelButton() {
        return XPATH.container + `${XPATH.cancelButton}`;
    }

    get cancelButtonTop() {
        return XPATH.container + XPATH.cancelButton;
    }

    get applyButton() {
        return XPATH.container + XPATH.applyButton;
    }

    get textInput() {
        return XPATH.container + lib.TEXT_INPUT;
    }

    typeInTextInput(text) {
        return this.typeTextInInput(this.textInput, text).catch(err => {
            this.saveScreenshot('site_conf_err');
            throw new Error("Site Configurator Dialog - " + err);
        })
    }

    async typeNumPosts(number) {
        let selector = XPATH.container + "//input[contains(@name,'numPosts')]";
        try {
            await this.waitForElementDisplayed(selector, appConst.shortTimeout);
            return await this.typeTextInInput(selector, number);
        } catch (err) {
            this.saveScreenshot('site_conf_err_num_posts');
            throw new Error("Site Configurator Dialog - " + err);
        }
    }

    showToolbarAndClickOnInsertImageButton() {
        let areaSelector = `//div[contains(@id,'cke_TextArea')]`;
        let insertImageButton = `//a[contains(@class,'cke_button') and contains(@title,'Image')]`;
        return this.waitForElementDisplayed(areaSelector, appConst.mediumTimeout).then(() => {
            return this.clickOnElement(areaSelector);
        }).then(() => {
            return this.waitForElementDisplayed(insertImageButton, appConst.mediumTimeout);
        }).then(() => {
            return this.clickOnElement(insertImageButton);
        })
    }

    clickOnCancelButton() {
        return this.clickOnElement(this.cancelButton);
    }

    async clickOnApplyButton() {
        try {
            await this.clickOnElement(this.applyButton);
            return await this.waitForDialogClosed();
        } catch (err) {
            await this.saveScreenshot('err_click_on_apply_dialog');
            throw new Error('Site Configurator Dialog, error when click on the Apply button  ' + err);
        }
    }

    waitForApplyButtonDisabled() {
        return this.waitForElementDisabled(this.applyButton, appConst.mediumTimeout);
    }

    waitForDialogOpened() {
        return this.waitForElementDisplayed(this.applyButton, appConst.mediumTimeout);
    }

    waitForDialogClosed() {
        return this.waitForElementNotDisplayed(XPATH.container, appConst.shortTimeout);
    }
}

module.exports = SiteConfiguratorDialog;
