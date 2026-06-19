const Page = require('../page');
const {BUTTONS} = require('../../libs/elements');
const appConst = require('../../libs/app_const');
const HtmlAreaForm = require("./htmlarea.form.panel");
const XPATH = {
    container: `//div[@data-component='Dialog.Content']`,
    imageContentCombobox: "//div[contains(@id,'ImageContentComboBox')]",
    imageSelectorOptionFilterInput: "//input[contains(@id,'ComboBoxOptionFilterInput')]",
    htmlAreaInputView: `//div[contains(@id,'InputView') and descendant::div[contains(@id,'HtmlArea')]]`,
    getTextInHtmlArea: id => {
        return `return CKEDITOR.instances['${id}'].getData()`
    },
    typeText: (id, text) => {
        return `CKEDITOR.instances['${id}'].setData('${text}')`;
    },
};

class SiteConfiguratorDialog extends Page {

    get closeButton() {
        return XPATH.container + BUTTONS.buttonAriaLabel('Close');
    }

    get imageSelectorUploadButton() {
        return XPATH.container + `${XPATH.imageContentCombobox}` + lib.UPLOAD_BUTTON;
    }

    get applyButton() {
        return XPATH.container + BUTTONS.buttonByLabel('Apply');
    }

    get numPostsTextInput() {
        return XPATH.container + "//input[contains(@name,'numPosts')]";
    }

    async waitForImageUploadButtonDisplayed() {
        try {
            return await this.waitForElementDisplayed(this.imageSelectorUploadButton);
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
            return await this.getTextInInput(this.numPostsTextInput);
        } catch (err) {
            await this.saveScreenshot('site_conf_err_num_posts');
            throw new Error('Error in Site Configurator Dialog - ' + err);
        }
    }

    async clickInTextAreaShowToolbar() {
        try {
            let areaSelector = XPATH.container + `//div[contains(@id,'cke_TextArea')]`;
            await this.waitForElementDisplayed(areaSelector, appConst.mediumTimeout);
            await this.clickOnElement(areaSelector);
            return await this.pause(300);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_show_toolbar');
            throw new Error(`Site Configurator Dialog - error during clicking in the text area, screenshot: '${screenshot}' ` + err);
        }
    }

    async showToolbarAndClickOnInsertImageButton() {
        try {
            await this.clickInTextAreaShowToolbar();
            let insertImageButton = XPATH.container + `//a[contains(@class,'cke_button') and contains(@title,'Image')]`;
            await this.waitForElementDisplayed(insertImageButton, appConst.mediumTimeout);
            await this.clickOnElement(insertImageButton);
            return await this.pause(300);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_insert_image_button');
            throw new Error(`Site Config, insert image button, screenshot: '${screenshot}' ` + err);
        }
    }

    async showToolbarAndClickOnInsertLinkButton() {
        try {
            let htmlAreaForm = new HtmlAreaForm(XPATH.container);
            await htmlAreaForm.showToolbarAndClickOnInsertLinkButton();
            // let insertLinkButton = XPATH.container +  "//div[@data-name='CKEditorWrapper']";
            // await this.clickInTextAreaShowToolbar();
            // await this.waitForElementDisplayed(insertLinkButton, appConst.mediumTimeout);
            // await this.clickOnElement(insertLinkButton);
            return await this.pause(300);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_insert_link_button');
            throw new Error(`Site Config, insert link button, screenshot: '${screenshot}' ` + err);
        }
    }

    async clickOnCloseButton() {
        return await this.clickOnElement(this.closeButton);
    }

    async clickOnApplyButton() {
        try {
            await this.waitForElementDisplayed(this.applyButton, appConst.mediumTimeout);
            await this.clickOnElement(this.applyButton);
            return await this.waitForDialogClosed();
        } catch (err) {
            await this.handleError(`Error occurred after clicking on Apply button, dialog should be closed!`, 'site_conf_apply_button');
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
        let locator = XPATH.container + lib.CONTENT_SELECTOR.DIV + lib.BUTTONS.NEW_CONTENT_BUTTON;
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        await this.clickOnElement(locator);
    }
    //
    // async clickOnHtmlAreaHelpToggle() {
    //     await this.waitForHtmlAreaHelpToggleDisplayed();
    //     return await this.clickOnElement(this.htmlAreaHelpButton);
    // }

    async waitForHtmlAreaHelpToggleDisplayed() {
        try {
            return await this.waitForElementDisplayed(this.htmlAreaHelpButton, appConst.mediumTimeout);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_help_text_toggle');
            throw new Error(`Help texts toggle button for HtmlArea is not displayed in the modal dialog! screenshot:${screenshot} ` + err);
        }
    }

    // 'text for the footer' of the dialog:
    async getHelpTextForHtmlArea() {
        let locator = XPATH.container + XPATH.htmlAreaInputView + lib.HELP_TEXT.TEXT;
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        return await this.getTextInDisplayedElements(locator);
    }
}

module.exports = SiteConfiguratorDialog;
