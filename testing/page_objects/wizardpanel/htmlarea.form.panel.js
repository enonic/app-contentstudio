/**
 * Created on 26.04.2018.
 */

const page = require('../page');
const elements = require('../../libs/elements');
const appConst = require('../../libs/app_const');
const insertLinkDialog = require('./insert.link.modal.dialog.cke');

const form = {
    validationRecording: `//div[contains(@id,'ValidationRecordingViewer')]//li`,
    ckeTextArea: `//div[contains(@id,'cke_api.ui.text.TextArea')]`,
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
    sourceButton: `//a[contains(@class,'cke_button') and contains(@title,'Source')]`,
    tableButton: `//a[contains(@class,'cke_button') and contains(@title,'Table')]`,
    strikethroughButton: `//a[contains(@class,'cke_button') and contains(@title,'Strikethrough')]`,
    increaseIndentButton: `//a[contains(@class,'cke_button') and contains(@title,'Increase Indent')]`,
    decreaseIndentButton: `//a[contains(@class,'cke_button') and contains(@title,'Decrease Indent')]`,
    insertMacroButton: `//a[contains(@class,'cke_button') and contains(@title,'Insert macro')]`,

    maximizeButton: `//a[contains(@class,'cke_button') and contains(@class,'maximize')]`,
    typeText: function (id, text) {
        return `CKEDITOR.instances['${id}'].setData('${text}')`
    },
    getText: function (id) {
        return `return CKEDITOR.instances['${id}'].getData()`
    }
};
const htmlAreaForm = Object.create(page, {

    validationRecord: {
        get: function () {
            return `${elements.FORM_VIEW}` + `${form.validationRecording}`;
        }
    },

    type: {
        value: function (data) {
            return this.typeTextInHtmlArea(data.texts);
        }
    },

    getIdOfHtmlAreas: {
        value: function (text) {
            let selector = elements.FORM_VIEW + elements.TEXT_AREA;
            return this.getAttribute(selector, 'id');
        }
    },
    typeTextInHtmlArea: {
        value: function (texts) {
            return this.waitForVisible(form.ckeTextArea, appConst.TIMEOUT_3).then(() => {
                return this.getIdOfHtmlAreas();
            }).then(ids => {
                const promises = [].concat(texts).map((text, index) => {
                    return this.execute(form.typeText([].concat(ids)[index], text));
                });
                return Promise.all(promises);
            });
        }
    },
    clearHtmlArea: {
        value: function (index) {
            return this.waitForVisible(form.ckeTextArea, appConst.TIMEOUT_3).then(() => {
                return this.getIdOfHtmlAreas();
            }).then(ids => {
                return this.execute(form.typeText(ids[index], ''));
            }).pause(500);
        }
    },
    getTextFromHtmlArea: {
        value: function () {
            let strings = [];
            return this.waitForVisible(form.ckeTextArea, appConst.TIMEOUT_3).then(() => {
                return this.getIdOfHtmlAreas();
            }).then(ids => {
                [].concat(ids).forEach(id => {
                    strings.push(this.execute(form.getText(id)));
                });
                return Promise.all(strings);
            }).then(response => {
                let res = [];
                response.forEach((str) => {
                    return res.push(str.value.trim());
                })
                return res;
            })
        }
    },
    showToolbar: {
        value: function () {
            return this.doClick(form.ckeTextArea).then(() => {
                return this.waitForVisible(`//a[contains(@class,'cke_button')]`, appConst.TIMEOUT_3).catch(err => {
                    throw new Error('CKE toolbar was not shown in ' + appConst.TIMEOUT_3 + ' ' + err);
                })
            });
        }
    },
    showToolbarAndClickOnInsertImageButton: {
        value: function () {
            return this.waitForVisible(form.ckeTextArea, appConst.TIMEOUT_3).then(() => {
                return this.doClick(form.ckeTextArea);
            }).then(() => {
                return this.waitForVisible(form.insertImageButton, appConst.TIMEOUT_3);
            }).then(result => {
                return this.doClick(form.insertImageButton);
            })
        }
    },
    showToolbarAndClickOnInsertAnchorButton: {
        value: function () {
            return this.doClick(form.ckeTextArea).then(() => {
                return this.waitForVisible(form.insertAnchorButton, appConst.TIMEOUT_3);
            }).then(result => {
                return this.doClick(form.insertAnchorButton);
            })
        }
    },
    showToolbarAndClickOnInsertSpecialCharactersButton: {
        value: function () {
            return this.doClick(form.ckeTextArea).then(() => {
                return this.waitForVisible(`//a[contains(@class,'cke_button') and @title='Insert Special Character']`, appConst.TIMEOUT_3);
            }).then(result => {
                return this.doClick(`//a[contains(@class,'cke_button') and @title='Insert Special Character']`)
            })
        }
    },
    showToolbarAndClickOnInsertMacroButton: {
        value: function () {
            return this.doClick(form.ckeTextArea).then(() => {
                return this.waitForVisible(form.insertMacroButton, appConst.TIMEOUT_3);
            }).then(result => {
                return this.doClick(form.insertMacroButton);
            })
        }
    },
    showToolbarAndClickOnInsertLinkButton: {
        value: function () {
            return this.doClick(form.ckeTextArea).then(() => {
                return this.waitForVisible(form.insertLinkButton, appConst.TIMEOUT_3);
            }).then(result => {
                return this.doClick(form.insertLinkButton);
            }).then(() => {
                return insertLinkDialog.waitForDialogLoaded();
            })
        }
    },
    clickOnSourceButton: {
        value: function () {
            return this.waitForVisible(form.sourceButton, appConst.TIMEOUT_3).then(result => {
                return this.doClick(form.sourceButton);
            })
        }
    },
    clickOnMaximizeButton: {
        value: function () {
            return this.waitForVisible(form.sourceButton, appConst.TIMEOUT_3, appConst.TIMEOUT_3).then(result => {
                return this.doClick(form.sourceButton);
            })
        }
    },
    isBoldButtonDisplayed: {
        value: function () {
            return this.waitForVisible(form.boldButton, appConst.TIMEOUT_3).catch(err => {
                console.log('Bold button is not visible! ' + err);
                return false;
            })
        }
    },
    isItalicButtonDisplayed: {
        value: function () {
            return this.waitForVisible(form.italicButton, appConst.TIMEOUT_3).catch(err => {
                console.log('Italic button is not visible! ' + err);
                return false;
            })
        }
    },
    isUnderlineButtonDisplayed: {
        value: function () {
            return this.waitForVisible(form.underlineButton, appConst.TIMEOUT_3).catch(err => {
                console.log('Underline button is not visible! ' + err);
                return false;
            })
        }
    },
    isSuperscriptButtonDisplayed: {
        value: function () {
            return this.waitForVisible(form.superScriptButton, appConst.TIMEOUT_3).catch(err => {
                console.log('Superscript button is not visible! ' + err);
                return false;
            })
        }
    },
    isSubscriptButtonDisplayed: {
        value: function () {
            return this.waitForVisible(form.subscriptButton, appConst.TIMEOUT_3).catch(err => {
                console.log('Subscript button is not visible! ' + err);
                return false;
            })
        }
    },
    isBulletedListButtonDisplayed: {
        value: function () {
            return this.waitForVisible(form.bulletedButton, appConst.TIMEOUT_3).catch(err => {
                console.log('Bulleted List button is not visible! ' + err);
                return false;
            })
        }
    },
    isNumberedListButtonDisplayed: {
        value: function () {
            return this.waitForVisible(form.numberedButton, appConst.TIMEOUT_3).catch(err => {
                console.log('Numbered List button is not visible! ' + err);
                return false;
            })
        }
    },
    isAlignLeftButtonDisplayed: {
        value: function () {
            return this.waitForVisible(form.alignLeftButton, appConst.TIMEOUT_2).catch(err => {
                console.log('Align Left  button is not visible! ' + err);
                return false;
            })
        }
    },
    isAlignRightButtonDisplayed: {
        value: function () {
            return this.waitForVisible(form.alignRightButton, appConst.TIMEOUT_2).catch(err => {
                console.log('Align Right  button is not visible! ' + err);
                return false;
            })
        }
    },
    isCenterButtonDisplayed: {
        value: function () {
            return this.waitForVisible(form.centerButton, appConst.TIMEOUT_2).catch(err => {
                console.log('Center  button is not visible! ' + err);
                return false;
            })
        }
    },
    isIncreaseIndentDisplayed: {
        value: function () {
            return this.waitForVisible(form.increaseIndentButton).catch(err => {
                console.log('Increase Indent  button is not visible! ' + err);
                return false;
            })
        }
    },
    isDecreaseIndentDisplayed: {
        value: function () {
            return this.waitForVisible(form.decreaseIndentButton, appConst.TIMEOUT_3).catch(err => {
                console.log('Increase Indent  button is not visible! ' + err);
                return false;
            })
        }
    },
    isBlockQuoteButtonDisplayed: {
        value: function () {
            return this.waitForVisible(form.blockQuoteButton, appConst.TIMEOUT_3).catch(err => {
                console.log('Block Quote  button is not visible! ' + err);
                return false;
            })
        }
    },
    isTableButtonDisplayed: {
        value: function () {
            return this.waitForVisible(form.tableButton, appConst.TIMEOUT_3).catch(err => {
                console.log('Table  button is not visible! ' + err);
                return false;
            })
        }
    },
    isIncreaseIndentButtonDisplayed: {
        value: function () {
            return this.waitForVisible(form.increaseIndentButton, appConst.TIMEOUT_3).catch(err => {
                console.log('Increase Indent  button is not visible! ' + err);
                return false;
            })
        }
    },
    waitForValidationRecording: {
        value: function () {
            return this.waitForVisible(this.validationRecord, appConst.TIMEOUT_2);
        }
    },
    isValidationRecordingVisible: {
        value: function () {
            return this.isVisible(this.validationRecord);
        }
    },
    getValidationRecord: {
        value: function () {
            return this.getText(this.validationRecord).catch(err => {
                this.saveScreenshot('err_textarea_validation_record');
                throw new Error('getting Validation text: ' + err);
            })
        }
    }
});
module.exports = htmlAreaForm;
