/**
 * Created on 26.04.2018.
 */
const OccurrencesFormView = require('./occurrences.form.view');
const lib = require('../../libs/elements');
const appConst = require('../../libs/app_const');
const InsertLinkDialog = require('./insert.link.modal.dialog.cke');

const XPATH = {
    ckeTextArea: "//div[contains(@id,'cke_TextArea')]",
    ckeToolbox: "//span[contains(@class,'cke_toolbox')]",
    insertImageButton: `//a[contains(@class,'cke_button') and contains(@title,'Image')]`,
    formatDropDownHandle: `//span[contains(@class,'cke_combo__styles') and descendant::a[@class='cke_combo_button']]`,
    addButton: "//div[@class='bottom-button-row']//button[child::span[text()='Add']]",
    removeAreaButton: "//div[contains(@id,'HtmlArea')]//button[@class='remove-button']",

    typeText: function (id, text) {
        return `CKEDITOR.instances['${id}'].setData('${text}')`;
    },
    getText: function (id) {
        return `return CKEDITOR.instances['${id}'].getData()`
    },
    formatOptionByName: function (optionName) {
        return `//div[@title='Formatting Styles']//li[@class='cke_panel_listItem']//a[@title='${optionName}']`
    }
};

class HtmlAreaForm extends OccurrencesFormView {

    get fullScreenButton() {
        return lib.FORM_VIEW + lib.CKE.fullScreen;
    }

    get addButton() {
        return lib.FORM_VIEW + XPATH.addButton;
    }

    waitForAddButtonDisplayed() {
        return this.waitForElementDisplayed(this.addButton, appConst.mediumTimeout);
    }

    waitForAddButtonNotDisplayed() {
        return this.waitForElementNotDisplayed(this.addButton, appConst.mediumTimeout);
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

    typeTextInHtmlArea(texts) {
        return this.waitForElementDisplayed(XPATH.ckeTextArea, appConst.mediumTimeout).then(() => {
            return this.getIdOfHtmlAreas();
        }).then(ids => {
            const promises = [].concat(texts).map((text, index) => {
                return this.execute(XPATH.typeText([].concat(ids)[index], text));
            });
            return Promise.all(promises);
        }).then(() => {
            return this.pause(300);
        });
    }

    async insertTextInHtmlArea(index, text) {
        let ids = await this.getIdOfHtmlAreas();
        await this.execute(XPATH.typeText(ids[index], text));
        return await this.pause(300);
    }

    async getIdOfHtmlAreas() {
        let selector = lib.FORM_VIEW + lib.TEXT_AREA;
        let elems = await this.findElements(selector);
        let ids = [];
        elems.forEach(el => {
            ids.push(el.getAttribute("id"));
        });
        return Promise.all(ids);
    }

    async isEditorToolbarVisible(index) {
        let elements = await this.findElements(XPATH.ckeToolbox);
        if (elements.length > 0) {
            return await elements[index].isDisplayed();
        }
    }

    async clearHtmlArea(index) {
        await this.waitForElementDisplayed(XPATH.ckeTextArea, appConst.mediumTimeout);
        let ids = await this.getIdOfHtmlAreas();
        const arr = [].concat(ids);
        await this.execute(XPATH.typeText(arr[index], ''));
        return await this.pause(300);
    }

    getTextFromHtmlArea() {
        let strings = [];
        return this.waitForElementDisplayed(XPATH.ckeTextArea, appConst.mediumTimeout).then(() => {
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

    async showToolbar() {
        try {
            await this.clickOnElement(XPATH.ckeTextArea);
            return await this.waitUntilDisplayed(XPATH.ckeToolbox, appConst.mediumTimeout)
        } catch (err) {
            throw new Error('CKE toolbar is not shown in ' + appConst.mediumTimeout + ' ' + err);
        }
    }

    async showToolbarAndClickOnInsertImageButton() {
        await this.waitForElementDisplayed(XPATH.ckeTextArea, appConst.mediumTimeout);
        await this.clickOnElement(XPATH.ckeTextArea);
        await this.waitForElementDisplayed(XPATH.insertImageButton, appConst.mediumTimeout);
        await this.clickOnElement(XPATH.insertImageButton);
        return await this.pause(300);
    }

    //double clicks on the html-area
    async doubleClickOnHtmlArea() {
        await this.waitForElementDisplayed(XPATH.ckeTextArea, appConst.mediumTimeout);
        await this.doDoubleClick(XPATH.ckeTextArea);
        return await this.pause(1000);
    }

    //clicks on Format's dropdown handle and expands options
    async showToolbarAndClickOnFormatDropDownHandle() {
        await this.clickOnElement(XPATH.ckeTextArea);
        await this.waitForElementDisplayed(XPATH.formatDropDownHandle, appConst.mediumTimeout);
        return await this.clickOnElement(XPATH.formatDropDownHandle);
    }

    async getFormatOptions() {
        let selector = `//div[@title='Formatting Styles']//li[contains(@class,'cke_panel_listItem')]//a`;
        await this.switchToFrame("//iframe[@class='cke_panel_frame']");
        return await this.getTextInElements(selector);
    }

//switches to cke-frame, click on 'Paragraph Format' option and then switches to the parent frame again
    async selectFormatOption(optionName) {
        let selector = XPATH.formatOptionByName(optionName);
        await this.switchToFrame("//iframe[@class='cke_panel_frame']");
        await this.clickOnElement(selector);
        await this.pause(700);
        //switches to the parent frame again
        return await this.getBrowser().switchToParentFrame();
    }

    async showToolbarAndClickOnInsertAnchorButton() {
        await this.waitForElementDisplayed(XPATH.ckeTextArea, appConst.mediumTimeout);
        await this.clickOnElement(XPATH.ckeTextArea);
        await this.waitForElementDisplayed(lib.CKE.insertAnchorButton, appConst.mediumTimeout);
        await this.clickOnElement(lib.CKE.insertAnchorButton);
        return await this.pause(300);
    }

    async showToolbarAndClickOnTableButton() {
        await this.waitForElementDisplayed(XPATH.ckeTextArea, appConst.mediumTimeout);
        await this.clickOnElement(XPATH.ckeTextArea);
        await this.waitForElementDisplayed(lib.CKE.tableButton, appConst.mediumTimeout);
        await this.clickOnElement(lib.CKE.tableButton);
        return await this.pause(400);
    }

    async isTableMenuItemVisible() {
        let table = "//table";
        await this.switchToFrame("//iframe[@class='cke_panel_frame']");
        return await this.waitForElementDisplayed(table, appConst.shortTimeout);
    }

    async showToolbarAndClickOnInsertSpecialCharactersButton() {
        await this.clickOnElement(XPATH.ckeTextArea);
        await this.waitForElementDisplayed(lib.CKE.insertSpecialCharacter, appConst.mediumTimeout);
        await this.clickOnElement(lib.CKE.insertSpecialCharacter);
        return await this.pause(300);
    }

    async showToolbarAndClickOnInsertMacroButton() {
        await this.clickOnElement(XPATH.ckeTextArea);
        await this.waitForElementDisplayed(lib.CKE.insertMacroButton, appConst.mediumTimeout);
        return await this.clickOnElement(lib.CKE.insertMacroButton);
    }

    async showToolbarAndClickOnInsertLinkButton() {
        await this.waitForElementDisplayed(XPATH.ckeTextArea, appConst.mediumTimeout);
        await this.clickOnElement(XPATH.ckeTextArea);
        //click on `Insert Link` button and wait for modal dialog is loaded
        return await this.clickOnInsertLinkButton();
    }

    async clickOnInsertLinkButton() {
        let results = await this.getDisplayedElements(lib.CKE.insertLinkButton);
        //await this.waitForElementDisplayed(XPATH.insertLinkButton, appConst.mediumTimeout);
        await this.clickOnElement(lib.CKE.insertLinkButton);
        let insertLinkDialog = new InsertLinkDialog();
        await insertLinkDialog.waitForDialogLoaded();
        await this.pause(300);
        return new InsertLinkDialog();
    }

    async clickOnSourceButton() {
        await this.clickOnElement(XPATH.ckeTextArea);
        await this.waitForElementDisplayed(lib.CKE.sourceButton, appConst.mediumTimeout);
        return await this.clickOnElement(lib.CKE.sourceButton);
    }

    async clickOnFullScreenButton() {
        await this.clickOnElement(XPATH.ckeTextArea);
        await this.waitForElementDisplayed(this.fullScreenButton, appConst.mediumTimeout);
        await this.clickOnElement(this.fullScreenButton);
        return await this.pause(200);
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

    isSuperscriptButtonDisplayed() {
        return this.waitForElementDisplayed(lib.CKE.superScriptButton, appConst.shortTimeout).catch(err => {
            console.log('Superscript button is not visible! ' + err);
            return false;
        })
    }

    isSubscriptButtonDisplayed() {
        return this.waitForElementDisplayed(lib.CKE.subscriptButton, appConst.shortTimeout).catch(err => {
            console.log('Subscript button is not visible! ' + err);
            return false;
        })
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

    isIncreaseIndentDisplayed() {
        return this.waitForElementDisplayed(lib.CKE.increaseIndentButton).catch(err => {
            console.log('Increase Indent  button is not visible! ' + err);
            return false;
        })
    }

    isDecreaseIndentDisplayed() {
        return this.waitForElementDisplayed(lib.CKE.decreaseIndentButton, appConst.mediumTimeout).catch(err => {
            console.log('Increase Indent  button is not visible! ' + err);
            return false;
        })
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
}

module.exports = HtmlAreaForm;
