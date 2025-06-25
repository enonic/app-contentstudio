/**
 * Created on 26.04.2018.
 */
const OccurrencesFormView = require('./occurrences.form.view');
const lib = require('../../libs/elements-old');
const appConst = require('../../libs/app_const');
const InsertLinkDialog = require('./html-area/insert.link.modal.dialog.cke');

const XPATH = {
    ckeTextArea: "//div[contains(@id,'cke_TextArea')]",
    ckeToolbox: "//span[contains(@class,'cke_toolbox')]",
    formatDropDownHandle: `//span[contains(@class,'cke_combo__styles') and descendant::a[@class='cke_combo_button']]`,
    removeAreaButton: "//div[contains(@id,'HtmlArea')]//button[@class='remove-button']",
    getText(id) {
        return `return CKEDITOR.instances['${id}'].getData()`;
    },
    typeText(id, text) {
        return `
        if (window.CKEDITOR && CKEDITOR.instances['${id}']) {
            CKEDITOR.instances['${id}'].setData('${text}');
        } else {
            throw new Error('CKEDITOR instance с id ${id} не найден');
        }`;
    },
    formatOptionByName: optionName => {
        return `//div[@title='Formatting Styles']//li[@class='cke_panel_listItem']//a[@title='${optionName}']`;
    }
};

class HtmlAreaForm extends OccurrencesFormView {

    constructor(parentElementXpath = '') {
        super();
        this._container = parentElementXpath;
    }

    get container() {
        return this._container;
    }

    get fullScreenButton() {
        return lib.FORM_VIEW + lib.CKE.fullScreen;
    }

    get addButton() {
        return lib.FORM_VIEW + lib.BUTTONS.ADD_BUTTON;
    }

    waitForAddButtonDisplayed() {
        return this.waitForElementDisplayed(this.addButton, appConst.mediumTimeout);
    }

    async waitForAddButtonNotDisplayed() {
        return await this.waitForElementNotDisplayed(this.addButton, appConst.mediumTimeout);
    }

    async clickOnAddButton() {
        await this.waitForAddButtonDisplayed();
        await this.clickOnElement(this.addButton);
        return await this.pause(300);
    }

    async type(data) {
        await this.typeTextInHtmlArea(data.texts);
        return await this.pause(300);
    }

    async typeTextInHtmlArea(texts) {
        const inputTexts = [].concat(texts);
        try {
            await this.waitForElementDisplayed(XPATH.ckeTextArea, appConst.mediumTimeout);
            const ids = await this.getIdOfHtmlAreas();
            if (inputTexts.length > ids.length) {
                const errMsg = `Array of text (${inputTexts.length}) more, чем htmlAreas (${ids.length})`;
                throw new Error(errMsg);
            }

            for (let i = 0; i < inputTexts.length; i++) {
                await this.execute(XPATH.typeText(ids[i], inputTexts[i]));
            }
            await this.pause(300);
        } catch (err) {
            console.error('typeTextInHtmlArea: tried to insert the text:', err);
            throw err;
        }
    }

    async insertTextInHtmlArea(index, text) {
        let ids = await this.getIdOfHtmlAreas();
        await this.execute(XPATH.typeText(ids[index], text));
        return await this.pause(500);
    }

    async getIdOfHtmlAreas() {
        try {
            const textAreaSelector = this.container ? this.container + lib.TEXT_AREA : lib.FORM_VIEW + lib.TEXT_AREA;
            const elements = await this.findElements(textAreaSelector);
            if (!elements || elements.length === 0) {
                console.warn('getIdOfHtmlAreas: htmlArea elements not found with selector: ' + textAreaSelector);
                return [];
            }
            const ids = [];
            for (const el of elements) {
                const id = await el.getAttribute('id');
                if (id) {
                    ids.push(id);
                } else {
                    console.warn('getIdOfHtmlAreas: area element found but id attribute is missing:', el);
                }
            }
            return ids;
        } catch (err) {
            console.error('HtmlArea form panel getIdOfHtmlAreas: tried to get ID:', err);
            throw err;
        }
    }


    async isEditorToolbarVisible(index) {
        let elements = await this.findElements(this.container + XPATH.ckeToolbox);
        if (elements.length > 0) {
            return await elements[index].isDisplayed();
        }
    }

    async clearHtmlArea(index) {
        await this.waitForElementDisplayed(this.container + XPATH.ckeTextArea, appConst.mediumTimeout);
        let ids = await this.getIdOfHtmlAreas();
        const arr = [].concat(ids);
        await this.execute(XPATH.typeText(arr[index], ''));
        return await this.pause(300);
    }

    async getTextInHtmlArea(index) {
        let ids = await this.getIdOfHtmlAreas();
        let text = await this.execute(this.container + XPATH.getText(ids[index]));
        return text;
    }

    async doubleClickOnMacroTextInHtmlArea(text) {
        try {
            await this.clickInTextArea();
            await this.pause(500);
            let frameLocator = this.container + XPATH.ckeTextArea + "//iframe";
            await this.switchToFrame(frameLocator);
            await this.pause(500);
            await this.doDoubleClick(`//body//p[contains(.,'${text}')]`);
            await this.switchToParentFrame();
            return await this.pause(1000);
        } catch (err) {
            await this.switchToParentFrame();
            await this.handleError('HtmlArea Form - double click on macro text', 'err_macro_double_click', err);
        }
    }

    getTextFromHtmlArea() {
        let strings = [];
        return this.waitForElementDisplayed(this.container + XPATH.ckeTextArea, appConst.mediumTimeout).then(() => {
            return this.getIdOfHtmlAreas();
        }).then(ids => {
            [].concat(ids).forEach(id => {
                strings.push(this.execute(XPATH.getText(id)));
            });
            return Promise.all(strings);
        }).then(response => {
            let res = [];
            response.forEach((str) => {
                return res.push(str.trim());
            })
            return res;
        })
    }

    // This method for getting text from a specific html-area by index (occurrences start from 0)
    async getTextFromHtmlAreaByIndex(index) {
        try {
            await this.waitForElementDisplayed(XPATH.ckeTextArea, appConst.mediumTimeout);
            let ids = await this.getIdOfHtmlAreas();
            return await this.execute(XPATH.getText(ids[index]));
        } catch (err) {
            await this.handleError('HtmlArea Form - get text from html area', 'err_get_text_html_area', err);
        }
    }

    async showToolbar() {
        try {
            await this.clickInTextArea();
            return await this.waitUntilDisplayed(this.container + XPATH.ckeToolbox, appConst.mediumTimeout)
        } catch (err) {
            await this.handleError('HtmlArea Form - show toolbar', 'err_htmlarea_toolbar', err);
        }
    }

    async showToolbarAndClickOnInsertImageButton() {
        await this.clickInTextArea();
        await this.waitForElementDisplayed(lib.CKE.insertImageButton, appConst.mediumTimeout);
        await this.clickOnElement(lib.CKE.insertImageButton);
        return await this.pause(300);
    }

    async showToolbarAndClickOnInsertMacroButton() {
        await this.clickInTextArea();
        await this.waitForElementDisplayed(lib.CKE.insertMacroButton, appConst.mediumTimeout);
        await this.clickOnElement(lib.CKE.insertMacroButton);
        return await this.pause(300);
    }

    // do double-lick in the html-area
    async doubleClickOnHtmlArea() {
        await this.waitForElementDisplayed(XPATH.ckeTextArea, appConst.mediumTimeout);
        await this.doDoubleClick(XPATH.ckeTextArea);
        return await this.pause(1000);
    }

    // clicks on Format's dropdown handle and expands options
    async showToolbarAndClickOnFormatDropDownHandle() {
        await this.clickInTextArea();
        await this.waitForElementDisplayed(XPATH.formatDropDownHandle, appConst.mediumTimeout);
        return await this.clickOnElement(XPATH.formatDropDownHandle);
    }

    // Styles dropdown options: Normal, Heading 1, Heading 2, Heading 3, Heading 4, Heading 5, Heading 6, Preformatted Text, Address
    async getFormatOptions() {
        try {
            let selector = `//div[@title='Formatting Styles']//li[contains(@class,'cke_panel_listItem')]//a`;
            await this.switchToFrame("//iframe[@class='cke_panel_frame']");
            return await this.getTextInElements(selector);
        } catch (err) {
            await this.handleError('HtmlArea toolbar - Formatting Styles', 'err_format_options', err);
        }
    }

    //switches to cke-frame, click on 'Paragraph Format' option and then switches to the parent frame again
    async selectFormatOption(optionName) {
        try {
            let selector = XPATH.formatOptionByName(optionName);
            await this.switchToFrame("//iframe[@class='cke_panel_frame']");
            await this.clickOnElement(selector);
            await this.pause(700);
            // switches to the parent frame again
            return await this.getBrowser().switchToParentFrame();
        } catch (err) {
            await this.handleError('HtmlArea toolbar - select a Formatting Styles option', 'err_select_format_option', err);
        }
    }

    async showToolbarAndClickOnInsertAnchorButton() {
        await this.clickInTextArea();
        await this.waitForElementDisplayed(lib.CKE.insertAnchorButton, appConst.mediumTimeout);
        await this.clickOnElement(lib.CKE.insertAnchorButton);
        return await this.pause(300);
    }

    async showToolbarAndClickOnTableButton() {
        await this.clickInTextArea();
        await this.waitForElementDisplayed(lib.CKE.tableButton, appConst.mediumTimeout);
        await this.clickOnElement(lib.CKE.tableButton);
        return await this.pause(400);
    }

    async showToolbarAndClickOnFindAndReplaceButton() {
        await this.clickInTextArea();
        await this.waitForElementDisplayed(lib.CKE.findAndReplaceButton, appConst.mediumTimeout);
        await this.clickOnElement(lib.CKE.findAndReplaceButton);
        return await this.pause(400);
    }

    async isTableMenuItemVisible() {
        let table = '//table';
        await this.switchToFrame("//iframe[@class='cke_panel_frame']");
        return await this.waitForElementDisplayed(table, appConst.shortTimeout);
    }

    async waitForReplaceGroupVisible() {
        try {
            let locator = "//div[@title='Find and replace']";
            await this.switchToFrame("//iframe[@class='cke_panel_frame']");
            return await this.waitForElementDisplayed(locator, appConst.shortTimeout);
        } catch (err) {
            await this.handleError('HtmlArea toolbar - Replace group', 'err_replace_group', err);
        }
    }

    async showToolbarAndClickOnInsertSpecialCharactersButton() {
        await this.clickInTextArea();
        await this.waitForElementDisplayed(lib.CKE.insertSpecialCharacter, appConst.mediumTimeout);
        await this.clickOnElement(lib.CKE.insertSpecialCharacter);
        return await this.pause(300);
    }

    async clickInTextArea() {
        await this.waitForElementDisplayed(this.container + XPATH.ckeTextArea, appConst.mediumTimeout);
        await this.clickOnElement(this.container + XPATH.ckeTextArea);
        await this.pause(100);
    }

    async showToolbarAndClickOnInsertLinkButton() {
        await this.waitForElementDisplayed(XPATH.ckeTextArea, appConst.mediumTimeout);
        await this.clickInTextArea();
        // click on `Insert Link` button and wait for modal dialog is loaded
        return await this.clickOnInsertLinkButton();
    }

    async clickOnInsertLinkButton() {
        let results = await this.getDisplayedElements(lib.CKE.insertLinkButton);
        // await this.waitForElementDisplayed(XPATH.insertLinkButton, appConst.mediumTimeout);
        await this.clickOnElement(lib.CKE.insertLinkButton);
        let insertLinkDialog = new InsertLinkDialog();
        await insertLinkDialog.waitForDialogLoaded();
        await this.pause(300);
        return new InsertLinkDialog();
    }

    async clickOnSourceButton() {
        try {
            await this.clickOnElement(XPATH.ckeTextArea);
            await this.waitForElementDisplayed(lib.CKE.sourceButton, appConst.mediumTimeout);
            return await this.clickOnElement(lib.CKE.sourceButton);
        } catch (err) {
            await this.handleError('HtmlArea toolbar - Source button', 'err_source_button', err);
        }
    }

    async clickOnFullScreenButton() {
        try {
            await this.clickOnElement(XPATH.ckeTextArea);
            await this.waitForElementDisplayed(this.fullScreenButton, appConst.mediumTimeout);
            await this.clickOnElement(this.fullScreenButton);
            return await this.pause(200);
        } catch (err) {
            await this.handleError('HtmlArea toolbar - Full Screen button', 'err_full_screen_button', err);
        }
    }

    waitForBoldButtonNotDisplayed() {
        return this.waitForElementNotDisplayed(lib.CKE.boldButton, appConst.mediumTimeout);
    }

    waitForItalicButtonNotDisplayed() {
        return this.waitForElementNotDisplayed(lib.CKE.italicButton, appConst.mediumTimeout);
    }

    waitForUnderlineButtonNotDisplayed() {
        return this.waitForElementNotDisplayed(lib.CKE.underlineButton, appConst.mediumTimeout);
    }

    async waitForSuperscriptButtonDisplayed() {
        try {
            return await this.waitForElementDisplayed(lib.CKE.superScriptButton, appConst.shortTimeout)
        } catch (err) {
            await this.handleError('HtmlArea toolbar - superscript button should be displayed', 'err_superscript_btn', err);
        }
    }

    async waitForSubscriptButtonDisplayed() {
        try {
            return this.waitForElementDisplayed(lib.CKE.subscriptButton, appConst.shortTimeout)
        } catch (err) {
            await this.handleError('HtmlArea toolbar - subscript button should be displayed', 'err_subscript_btn', err);
        }
    }

    isBulletedListButtonDisplayed() {
        return this.waitForElementDisplayed(lib.CKE.bulletedButton, appConst.shortTimeout).catch(err => {
            console.log('Bulleted List button is not visible! ' + err);
            return false;
        })
    }

    isNumberedListButtonDisplayed() {
        return this.waitForElementDisplayed(lib.CKE.numberedButton, appConst.shortTimeout).catch(err => {
            console.log('Numbered List button is not visible! ' + err);
            return false;
        })
    }

    isAlignLeftButtonDisplayed() {
        return this.waitForElementDisplayed(lib.CKE.alignLeftButton, appConst.shortTimeout).catch(err => {
            console.log('Align Left  button is not visible! ' + err);
            return false;
        })
    }

    isAlignRightButtonDisplayed() {
        return this.waitForElementDisplayed(lib.CKE.alignRightButton, appConst.shortTimeout).catch(err => {
            console.log('Align Right  button is not visible! ' + err);
            return false;
        })
    }

    isCenterButtonDisplayed() {
        return this.waitForElementDisplayed(lib.CKE.centerButton, appConst.shortTimeout).catch(err => {
            console.log('Center  button is not visible! ' + err);
            return false;
        })
    }

    async waitForIncreaseIndentDisplayed() {
        try {
            return await this.waitForElementDisplayed(lib.CKE.increaseIndentButton);
        } catch (err) {
            await this.handleError('HtmlArea toolbar - increase indent button', 'err_increase_indent_btn', err);
        }
    }

    async waitForDecreaseIndentDisplayed() {
        try {
            return await this.waitForElementDisplayed(lib.CKE.decreaseIndentButton, appConst.mediumTimeout);
        } catch (err) {
            await this.handleError('HtmlArea toolbar - decrease indent button', 'err_decrease_indent_btn', err);
        }
    }

    isBlockQuoteButtonDisplayed() {
        return this.waitForElementDisplayed(lib.CKE.blockQuoteButton, appConst.mediumTimeout).catch(err => {
            console.log('Block Quote  button is not visible! ' + err);
            return false;
        })
    }

    isTableButtonDisplayed() {
        return this.waitForElementDisplayed(lib.CKE.tableButton, appConst.mediumTimeout).catch(err => {
            console.log('Table  button is not visible! ' + err);
            return false;
        })
    }

    isIncreaseIndentButtonDisplayed() {
        return this.waitForElementDisplayed(lib.CKE.increaseIndentButton, appConst.mediumTimeout).catch(err => {
            console.log('Increase Indent  button is not visible! ' + err);
            return false;
        })
    }

    async removeTextArea(index) {
        let elems = await this.findElements(XPATH.removeAreaButton);
        await elems[index].click();
    }

    async switchToHtmlAreaFrame() {
        return await this.switchToFrame(XPATH.ckeTextArea + "//iframe[contains(@class,'cke_wysiwyg_frame')]");
    }

    // returns the class attribute of the inserted image with a specific caption
    async getInsertedImageStyle(caption) {
        try {
            let locator = `//figure[child::figcaption[contains(.,'${caption}')]]`;
            await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
            return await this.getAttribute(locator, 'class');
        } catch (err) {
            await this.handleError('HtmlArea Form - get inserted image style', 'err_get_image_style', err);
        }
    }
}

module.exports = HtmlAreaForm;
