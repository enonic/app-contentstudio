const Page = require('../page');
const lib = require('../../libs/elements');
const appConst = require('../../libs/app_const');
const XPATH = {
    container: `//div[contains(@id,'SiteConfiguratorDialog')]`,
    applyButton: `//button[contains(@id,'DialogButton') and child::span[text()='Apply']]`,
    cancelButton: `//button[contains(@id,'DialogButton') and child::span[text()='Cancel']]`,
    imageSelectorOptionFilterInput: `//div[contains(@id,'ImageContentComboBox')]//input[contains(@id,'ComboBoxOptionFilterInput')]`,
    trackingIdTextInput: "//input[contains(@name,'trackingId')]",
    getTextInHtmlArea: function (id) {
        return `return CKEDITOR.instances['${id}'].getData()`
    },
    typeText: function (id, text) {
        return `CKEDITOR.instances['${id}'].setData('${text}')`;
    },
};

class SiteConfiguratorDialog extends Page {

    get cancelButton() {
        return XPATH.container + `${XPATH.cancelButton}`;
    }

    get cancelButtonTop() {
        return XPATH.container + lib.CANCEL_BUTTON_TOP;
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

    async showToolbarAndClickOnInsertImageButton() {
        let areaSelector = `//div[contains(@id,'cke_TextArea')]`;
        let insertImageButton = `//a[contains(@class,'cke_button') and contains(@title,'Image')]`;
        await this.waitForElementDisplayed(areaSelector, appConst.mediumTimeout);
        await this.clickOnElement(areaSelector);
        await this.waitForElementDisplayed(insertImageButton, appConst.mediumTimeout);
        await this.clickOnElement(insertImageButton);
        return await this.pause(300);
    }

    async showToolbarAndClickOnInsertLinkButton() {
        let areaSelector = `//div[contains(@id,'cke_TextArea')]`;
        let insertLinkButton = "//a[contains(@class,'cke_button') and contains(@title,'Link')]";
        await this.waitForElementDisplayed(areaSelector, appConst.mediumTimeout);
        await this.clickOnElement(areaSelector);
        await this.waitForElementDisplayed(insertLinkButton, appConst.mediumTimeout);
        await this.clickOnElement(insertLinkButton);
        return await this.pause(300);
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

    async getIdOfHtmlAreas() {
        let locator = XPATH.container + lib.FORM_VIEW + lib.TEXT_AREA;
        let elements = await this.findElements(locator);
        let ids = [];
        elements.forEach(el => {
            ids.push(el.getAttribute("id"));
        });
        return Promise.all(ids);
    }

    async getTextInHtmlArea(index) {
        let ids = await this.getIdOfHtmlAreas();
        let text = await this.execute(XPATH.getTextInHtmlArea(ids[index]));
        return text;
    }

    async insertTextInHtmlArea(index, text) {
        let ids = await this.getIdOfHtmlAreas();
        await this.execute(XPATH.typeText(ids[index], text));
        return await this.pause(300);
    }

    clickOnCancelTopButton() {
        return this.clickOnElement(this.cancelButtonTop);
    }
}

module.exports = SiteConfiguratorDialog;
