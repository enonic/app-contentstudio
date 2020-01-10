/**
 * Created on 26.04.2018.
 */
const Page = require('../page');
const lib = require('../../libs/elements');
const appConst = require('../../libs/app_const');
const InsertLinkDialog = require('./insert.link.modal.dialog.cke');

const XPATH = {
    validationRecording: `//div[contains(@id,'ValidationRecordingViewer')]//li`,
    ckeTextArea: `//div[contains(@id,'cke_TextArea')]`,
    insertImageButton: `//a[contains(@class,'cke_button') and contains(@title,'Image')]`,
    insertAnchorButton: `//a[contains(@class,'cke_button') and @title='Anchor']`,
    insertLinkButton: `//a[contains(@class,'cke_button') and contains(@title,'Link')]`,
    insertTableButton: `//a[contains(@class,'cke_button') and contains(@title,'Table')]`,
    insertMacroButton: `//a[contains(@class,'cke_button') and @title='Insert macro']`,
    boldButton: `//a[contains(@class,'cke_button') and contains(@title,'Bold')]`,
    italicButton: `//a[contains(@class,'cke_button') and contains(@title,'Italic')]`,
    underlineButton: `//a[contains(@class,'cke_button') and contains(@title,'Underline')]`,
    subscriptButton: `//a[contains(@class,'cke_button') and contains(@title,'Subscript')]`,
    superScriptButton: `//a[contains(@class,'cke_button') and contains(@title,'Superscript')]`,
    wrapCodeButton: `//a[contains(@class,'cke_button') and contains(@title,'Wrap code')]`,
    blockQuoteButton: `//a[contains(@class,'cke_button') and contains(@title,'Block Quote')]`,
    alignLeftButton: `//a[contains(@class,'cke_button') and contains(@title,'Align Left')]`,
    alignRightButton: `//a[contains(@class,'cke_button') and contains(@title,'Align Right')]`,
    centerButton: `//a[contains(@class,'cke_button') and contains(@title,'Center')]`,
    justifyButton: `//a[contains(@class,'cke_button') and contains(@title,'Justify')]`,
    bulletedButton: `//a[contains(@class,'cke_button') and contains(@title,'Bulleted List')]`,
    numberedButton: `//a[contains(@class,'cke_button') and contains(@title,'Numbered List')]`,
    sourceButton: `//a[contains(@class,'cke_button__sourcedialog') and contains(@href,'Source')]`,
    fullScreen: `//a[contains(@class,'cke_button__fullscreen')  and contains(@href,'Fullscreen')]`,
    tableButton: `//a[contains(@class,'cke_button') and contains(@title,'Table')]`,
    strikethroughButton: `//a[contains(@class,'cke_button') and contains(@title,'Strikethrough')]`,
    increaseIndentButton: `//a[contains(@class,'cke_button') and contains(@title,'Increase Indent')]`,
    decreaseIndentButton: `//a[contains(@class,'cke_button') and contains(@title,'Decrease Indent')]`,
    insertMacroButton: `//a[contains(@class,'cke_button') and contains(@title,'Insert macro')]`,
    formatDropDownHandle: `//span[contains(@class,'cke_combo__format')]//span[@class='cke_combo_open']`,

    maximizeButton: `//a[contains(@class,'cke_button') and contains(@class,'maximize')]`,
    typeText: function (id, text) {
        return `CKEDITOR.instances['${id}'].setData('${text}')`;
    },
    getText: function (id) {
        return `return CKEDITOR.instances['${id}'].getData()`
    },
    formatOptionByName: function (optionName) {
        return `//div[@title='Paragraph Format']//li[@class='cke_panel_listItem']//a[@title='${optionName}']`
    }
};

class HtmlAreaForm extends Page {

    get fullScreenButton() {
        return lib.FORM_VIEW + XPATH.fullScreen;
    }

    get validationRecord() {
        return lib.FORM_VIEW + XPATH.validationRecording;
    }

    type(data) {
        return this.typeTextInHtmlArea(data.texts).then(() => {
            return this.pause(300);
        })
    }

    typeTextInHtmlArea(texts) {
        return this.waitForElementDisplayed(XPATH.ckeTextArea, appConst.TIMEOUT_3).then(() => {
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

    async getIdOfHtmlAreas() {
        let selector = lib.FORM_VIEW + lib.TEXT_AREA;
        let elems = await this.findElements(selector);
        let ids = [];
        elems.forEach(el => {
            ids.push(el.getAttribute("id"));
        });
        return Promise.all(ids);
    }

    clearHtmlArea(index) {
        return this.waitForElementDisplayed(XPATH.ckeTextArea, appConst.TIMEOUT_3).then(() => {
            return this.getIdOfHtmlAreas();
        }).then(ids => {
            const arr = [].concat(ids);
            return this.execute(XPATH.typeText(arr[index], ''));
        }).then(() => {
            return this.pause(300);
        });
    }

    getTextFromHtmlArea() {
        let strings = [];
        return this.waitForElementDisplayed(XPATH.ckeTextArea, appConst.TIMEOUT_3).then(() => {
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

    showToolbar() {
        return this.clickOnElement(XPATH.ckeTextArea).then(() => {
            return this.waitUntilDisplayed(`//span[contains(@class,'cke_toolbox')]`, appConst.TIMEOUT_3).catch(err => {
                throw new Error('CKE toolbar is not shown in ' + appConst.TIMEOUT_3 + ' ' + err);
            })
        });
    }

    async showToolbarAndClickOnInsertImageButton() {
        await this.waitForElementDisplayed(XPATH.ckeTextArea, appConst.TIMEOUT_3);
        await this.clickOnElement(XPATH.ckeTextArea);
        await this.waitForElementDisplayed(XPATH.insertImageButton, appConst.TIMEOUT_3);
        await this.clickOnElement(XPATH.insertImageButton);
        return this.pause(300);
    }

//double clicks on the html-area
    doubleClickOnHtmlArea() {
        return this.waitForElementDisplayed(XPATH.ckeTextArea, appConst.TIMEOUT_3).then(() => {
            return this.doDoubleClick(XPATH.ckeTextArea);
        }).then(() => {
            return this.pause(1000);
        })
    }

    //clicks on Format's dropdown handle and expands options
    showToolbarAndClickOnFormatDropDownHandle() {
        return this.clickOnElement(XPATH.ckeTextArea).then(() => {
            return this.waitForElementDisplayed(XPATH.formatDropDownHandle, appConst.TIMEOUT_3);
        }).then(result => {
            return this.clickOnElement(XPATH.formatDropDownHandle);
        })
    }

    async getFormatOptions() {
        let selector = `//div[@title='Paragraph Format']//li[@class='cke_panel_listItem']//a`;
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
        await this.waitForElementDisplayed(XPATH.ckeTextArea, appConst.TIMEOUT_3);
        await this.clickOnElement(XPATH.ckeTextArea)
        await this.waitForElementDisplayed(XPATH.insertAnchorButton, appConst.TIMEOUT_3);
        await this.clickOnElement(XPATH.insertAnchorButton);
        return this.pause(300);
    }

    showToolbarAndClickOnTableButton() {
        return this.waitForElementDisplayed(XPATH.ckeTextArea, appConst.TIMEOUT_3).then(() => {
            return this.clickOnElement(XPATH.ckeTextArea);
        }).then(() => {
            return this.waitForElementDisplayed(XPATH.tableButton, appConst.TIMEOUT_3);
        }).then(result => {
            return this.clickOnElement(XPATH.tableButton);
        }).then(() => {
            this.pause(400);
        })
    }

    async isTableDropDownMenuVisible() {
        let table = "//table";
        await this.switchToFrame("//iframe[@class='cke_panel_frame']");
        return await this.waitForElementDisplayed(table, appConst.TIMEOUT_2);
    }

    showToolbarAndClickOnInsertSpecialCharactersButton() {
        return this.clickOnElement(XPATH.ckeTextArea).then(() => {
            return this.waitForElementDisplayed(`//a[contains(@class,'cke_button') and @title='Insert Special Character']`,
                appConst.TIMEOUT_3);
        }).then(result => {
            return this.clickOnElement(`//a[contains(@class,'cke_button') and @title='Insert Special Character']`)
        })
    }

    showToolbarAndClickOnInsertMacroButton() {
        return this.clickOnElement(XPATH.ckeTextArea).then(() => {
            return this.waitForElementDisplayed(XPATH.insertMacroButton, appConst.TIMEOUT_3);
        }).then(result => {
            return this.clickOnElement(XPATH.insertMacroButton);
        })
    }

    showToolbarAndClickOnInsertLinkButton() {
        return this.waitForElementDisplayed(XPATH.ckeTextArea, appConst.TIMEOUT_3).then(() => {
            return this.clickOnElement(XPATH.ckeTextArea);
        }).then(() => {
            //click on `Insert Link` button and wait for modal dialog is loaded
            return this.clickOnInsertLinkButton();
        })
    }

    clickOnInsertLinkButton() {
        return this.waitForElementDisplayed(XPATH.insertLinkButton, appConst.TIMEOUT_3).then(result => {
            return this.clickOnElement(XPATH.insertLinkButton);
        }).then(() => {
            let insertLinkDialog = new InsertLinkDialog();
            return insertLinkDialog.waitForDialogLoaded();
        }).then(() => {
            return this.pause(300);
        })
    }

    clickOnSourceButton() {
        return this.clickOnElement(XPATH.ckeTextArea).then(() => {
            return this.waitForElementDisplayed(XPATH.sourceButton, appConst.TIMEOUT_3);
        }).then(result => {
            return this.clickOnElement(XPATH.sourceButton);
        })
    }

    clickOnFullScreenButton() {
        return this.clickOnElement(XPATH.ckeTextArea).then(() => {
            return this.waitForElementDisplayed(this.fullScreenButton, appConst.TIMEOUT_3, appConst.TIMEOUT_3);
        }).then(result => {
            return this.clickOnElement(this.fullScreenButton);
        })
    }

    isBoldButtonDisplayed() {
        return this.waitForElementDisplayed(XPATH.boldButton, appConst.TIMEOUT_3).catch(err => {
            console.log('Bold button is not visible! ' + err);
            return false;
        })
    }

    isItalicButtonDisplayed() {
        return this.waitForElementDisplayed(XPATH.italicButton, appConst.TIMEOUT_3).catch(err => {
            console.log('Italic button is not visible! ' + err);
            return false;
        })
    }

    isUnderlineButtonDisplayed() {
        return this.waitForElementDisplayed(XPATH.underlineButton, appConst.TIMEOUT_3).catch(err => {
            console.log('Underline button is not visible! ' + err);
            return false;
        })
    }

    isSuperscriptButtonDisplayed() {
        return this.waitForElementDisplayed(XPATH.superScriptButton, appConst.TIMEOUT_3).catch(err => {
            console.log('Superscript button is not visible! ' + err);
            return false;
        })
    }

    isSubscriptButtonDisplayed() {
        return this.waitForElementDisplayed(XPATH.subscriptButton, appConst.TIMEOUT_3).catch(err => {
            console.log('Subscript button is not visible! ' + err);
            return false;
        })
    }

    isBulletedListButtonDisplayed() {
        return this.waitForElementDisplayed(XPATH.bulletedButton, appConst.TIMEOUT_3).catch(err => {
            console.log('Bulleted List button is not visible! ' + err);
            return false;
        })
    }

    isNumberedListButtonDisplayed() {
        return this.waitForElementDisplayed(XPATH.numberedButton, appConst.TIMEOUT_3).catch(err => {
            console.log('Numbered List button is not visible! ' + err);
            return false;
        })
    }

    isAlignLeftButtonDisplayed() {
        return this.waitForElementDisplayed(XPATH.alignLeftButton, appConst.TIMEOUT_2).catch(err => {
            console.log('Align Left  button is not visible! ' + err);
            return false;
        })
    }

    isAlignRightButtonDisplayed() {
        return this.waitForElementDisplayed(XPATH.alignRightButton, appConst.TIMEOUT_2).catch(err => {
            console.log('Align Right  button is not visible! ' + err);
            return false;
        })
    }

    isCenterButtonDisplayed() {
        return this.waitForElementDisplayed(XPATH.centerButton, appConst.TIMEOUT_2).catch(err => {
            console.log('Center  button is not visible! ' + err);
            return false;
        })
    }

    isIncreaseIndentDisplayed() {
        return this.waitForElementDisplayed(XPATH.increaseIndentButton).catch(err => {
            console.log('Increase Indent  button is not visible! ' + err);
            return false;
        })
    }

    isDecreaseIndentDisplayed() {
        return this.waitForElementDisplayed(XPATH.decreaseIndentButton, appConst.TIMEOUT_3).catch(err => {
            console.log('Increase Indent  button is not visible! ' + err);
            return false;
        })
    }

    isBlockQuoteButtonDisplayed() {
        return this.waitForElementDisplayed(XPATH.blockQuoteButton, appConst.TIMEOUT_3).catch(err => {
            console.log('Block Quote  button is not visible! ' + err);
            return false;
        })
    }

    isTableButtonDisplayed() {
        return this.waitForElementDisplayed(XPATH.tableButton, appConst.TIMEOUT_3).catch(err => {
            console.log('Table  button is not visible! ' + err);
            return false;
        })
    }

    isIncreaseIndentButtonDisplayed() {
        return this.waitForElementDisplayed(XPATH.increaseIndentButton, appConst.TIMEOUT_3).catch(err => {
            console.log('Increase Indent  button is not visible! ' + err);
            return false;
        })
    }

    waitForValidationRecording() {
        return this.waitForElementDisplayed(this.validationRecord, appConst.TIMEOUT_3);
    }

    isValidationRecordingVisible() {
        return this.isElementDisplayed(this.validationRecord);
    }

    getValidationRecord() {
        return this.waitForValidationRecording().then(() => {
            return this.getText(this.validationRecord);
        }).catch(err => {
            this.saveScreenshot('err_textarea_validation_record');
            throw new Error('getting Validation text: ' + err);
        })
    }
};
module.exports = HtmlAreaForm;
