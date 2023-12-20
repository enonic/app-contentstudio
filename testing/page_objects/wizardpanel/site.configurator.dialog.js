const Page = require('../page');
const lib = require('../../libs/elements');
const appConst = require('../../libs/app_const');
const XPATH = {
    container: `//div[contains(@id,'SiteConfiguratorDialog')]`,
    applyButton: `//button[contains(@id,'DialogButton') and child::span[text()='Apply']]`,
    cancelButton: `//button[contains(@id,'DialogButton') and child::span[text()='Cancel']]`,
    imageContentCombobox: "//div[contains(@id,'ImageContentComboBox')]",
    imageSelectorOptionFilterInput: "//input[contains(@id,'ComboBoxOptionFilterInput')]",
    getTextInHtmlArea: id => {
        return `return CKEDITOR.instances['${id}'].getData()`
    },
    typeText: (id, text) => {
        return `CKEDITOR.instances['${id}'].setData('${text}')`;
    },
};

class SiteConfiguratorDialog extends Page {

    get cancelButton() {
        return XPATH.container + `${XPATH.cancelButton}`;
    }

    get imageSelectorUploadButton() {
        return XPATH.container + `${XPATH.imageContentCombobox}` + lib.UPLOAD_BUTTON;
    }

    get cancelButtonTop() {
        return XPATH.container + lib.CANCEL_BUTTON_TOP;
    }

    get applyButton() {
        return XPATH.container + XPATH.applyButton;
    }

    get numPostsTextInput() {
        return XPATH.container + "//input[contains(@name,'numPosts')]";
    }

    get textInput() {
        return XPATH.container + lib.TEXT_INPUT;
    }

    async waitForImageUploadButtonDisplayed() {
        try {
            return await this.waitForElementDisplayed(this.imageSelectorUploadButton, appConst.mediumTimeout);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_upload');
            throw new Error(`Site Config, upload button, screenshot: '${screenshot}' ` + err);
        }
    }

    async typeTextInNumPostsInput(number) {
        try {
            await this.waitForElementDisplayed(this.numPostsTextInput, appConst.shortTimeout);
            return await this.typeTextInInput(this.numPostsTextInput, number);
        } catch (err) {
            await this.saveScreenshot('site_conf_err_num_posts');
            throw new Error('Site Configurator Dialog - ' + err);
        }
    }

    async getTextInNumPostsInput() {
        try {
            await this.waitForElementDisplayed(this.numPostsTextInput, appConst.shortTimeout);
            return await this.getTextInInput(this.numPostsTextInput,);
        } catch (err) {
            await this.saveScreenshot('site_conf_err_num_posts');
            throw new Error('Site Configurator Dialog - ' + err);
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
            await this.waitForElementDisplayed(this.applyButton, appConst.mediumTimeout);
            await this.clickOnElement(this.applyButton);
            return await this.waitForDialogClosed();
        } catch (err) {
            let screenshot = appConst.generateRandomName('err_dialog_apply_btn');
            await this.saveScreenshot(screenshot);
            throw new Error(`Site Configurator Dialog, error during clicking on Apply button, screenshot: ${screenshot}  ` + err);
        }
    }

    waitForApplyButtonDisabled() {
        return this.waitForElementDisabled(this.applyButton, appConst.mediumTimeout);
    }

    async waitForDialogOpened() {
        await this.waitForElementDisplayed(this.applyButton, appConst.mediumTimeout);
        await this.pause(500);
    }

    waitForDialogClosed() {
        return this.waitForElementNotDisplayed(XPATH.container, appConst.shortTimeout);
    }

    async getIdOfHtmlAreas() {
        let selector = XPATH.container + lib.FORM_VIEW + lib.TEXT_AREA;
        let elems = await this.findElements(selector);
        let ids = [];
        for (const item of elems) {
            ids.push(await item.getAttribute('id'));
        }
        return ids;
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

    async clickOnCancelTopButton() {
        await this.waitForElementDisplayed(this.cancelButtonTop, appConst.mediumTimeout);
        return await this.clickOnElement(this.cancelButtonTop);
    }

    // Click on Add New button in the content selector:
    async clickOnAddNewButton() {
        let locator = XPATH.container + lib.CONTENT_SELECTOR.DIV + lib.NEW_CONTENT_BUTTON;
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        await this.clickOnElement(locator);
    }
}

module.exports = SiteConfiguratorDialog;
