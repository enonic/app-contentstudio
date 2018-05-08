/**
 * Created on 26.04.2018.
 */

const page = require('../page');
const elements = require('../../libs/elements');
const appConst = require('../../libs/app_const');

const form = {
    validationRecording: `//div[contains(@id,'ValidationRecordingViewer')]//li`,
    ckeTextArea: `//div[contains(@id,'cke_api.ui.text.TextArea')]`,
    insertTableButton: `//a[contains(@class,'cke_button') and contains(@title,'Table')]`,
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
    increaseIndentButton: `//a[contains(@class,'cke_button') and contains(@title,'Increase Indent')]`,
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
                return this.waitForVisible(`//a[contains(@class,'cke_button') and @title='Image']`);
            });
        }
    },
    showToolbarAndClickOnInsertImageButton: {
        value: function () {
            return this.doClick(form.ckeTextArea).then(() => {
                return this.waitForVisible(`//a[contains(@class,'cke_button') and @title='Image']`);
            }).then(result => {
                return this.doClick(`//a[contains(@class,'cke_button') and @title='Image']`)
            })
        }
    },
    showToolbarAndClickOnInsertAnchorButton: {
        value: function () {
            return this.doClick(form.ckeTextArea).then(() => {
                return this.waitForVisible(`//a[contains(@class,'cke_button') and @title='Anchor']`);
            }).then(result => {
                return this.doClick(`//a[contains(@class,'cke_button') and @title='Anchor']`)
            })
        }
    },
    showToolbarAndClickOnInsertSpecialCharactersButton: {
        value: function () {
            return this.doClick(form.ckeTextArea).then(() => {
                return this.waitForVisible(`//a[contains(@class,'cke_button') and @title='Insert Special Character']`);
            }).then(result => {
                return this.doClick(`//a[contains(@class,'cke_button') and @title='Insert Special Character']`)
            })
        }
    },
    showToolbarAndClickOnInsertMacroButton: {
        value: function () {
            return this.doClick(form.ckeTextArea).then(() => {
                return this.waitForVisible(`//a[contains(@class,'cke_button') and @title='Insert macro']`);
            }).then(result => {
                return this.doClick(`//a[contains(@class,'cke_button') and @title='Insert macro']`)
            })
        }
    },
    showToolbarAndClickOnInsertLinkButton: {
        value: function () {
            return this.doClick(form.ckeTextArea).then(() => {
                return this.waitForVisible(`//a[contains(@class,'cke_button') and contains(@title,'Link')]`);
            }).then(result => {
                return this.doClick(`//a[contains(@class,'cke_button') and contains(@title,'Link')]`)
            })
        }
    },
    clickOnSourceButton: {
        value: function () {
            return this.waitForVisible(form.sourceButton).then(result => {
                return this.doClick(form.sourceButton);
            })
        }
    },
    clickOnMaximizeButton: {
        value: function () {
            return this.waitForVisible(form.sourceButton).then(result => {
                return this.doClick(form.sourceButton);
            })
        }
    },
    isBoldButtonDisplayed: {
        value: function () {
            return this.waitForVisible(form.boldButton).catch(err => {
                throw new Error('Bold button is not visible! ' + err);
            })
        }
    },
    isItalicButtonDisplayed: {
        value: function () {
            return this.waitForVisible(form.italicButton).catch(err => {
                throw new Error('Italic button is not visible! ' + err);
            })
        }
    },
    isUnderlineButtonDisplayed: {
        value: function () {
            return this.waitForVisible(form.underlineButton).catch(err => {
                throw new Error('Underline button is not visible! ' + err);
            })
        }
    },
    isSuperscriptButtonDisplayed: {
        value: function () {
            return this.waitForVisible(form.superScriptButton).catch(err => {
                throw new Error('Superscript button is not visible! ' + err);
            })
        }
    },
    isSubscriptButtonDisplayed: {
        value: function () {
            return this.waitForVisible(form.subscriptButton).catch(err => {
                throw new Error('Subscript button is not visible! ' + err);
            })
        }
    },
    isBulletedListButtonDisplayed: {
        value: function () {
            return this.waitForVisible(form.bulletedButton).catch(err => {
                throw new Error('Bulleted List button is not visible! ' + err);
            })
        }
    },
    isNumberedListButtonDisplayed: {
        value: function () {
            return this.waitForVisible(form.numberedButton).catch(err => {
                throw new Error('Numbered List button is not visible! ' + err);
            })
        }
    },
    isAlignLeftButtonDisplayed: {
        value: function () {
            return this.waitForVisible(form.alignLeftButton).catch(err => {
                throw new Error('Align Left  button is not visible! ' + err);
            })
        }
    },
    isAlignRightButtonDisplayed: {
        value: function () {
            return this.waitForVisible(form.alignRightButton).catch(err => {
                throw new Error('Align Right  button is not visible! ' + err);
            })
        }
    },
    isCenterButtonDisplayed: {
        value: function () {
            return this.waitForVisible(form.centerButton).catch(err => {
                throw new Error('Center  button is not visible! ' + err);
            })
        }
    },
    isWrapCodeButtonDisplayed: {
        value: function () {
            return this.waitForVisible(form.wrapCodeButton).catch(err => {
                throw new Error('Wrap Code  button is not visible! ' + err);
            })
        }
    },
    isBlockQuoteButtonDisplayed: {
        value: function () {
            return this.waitForVisible(form.blockQuoteButton).catch(err => {
                throw new Error('Block Quote  button is not visible! ' + err);
            })
        }
    },
    isTableButtonDisplayed: {
        value: function () {
            return this.waitForVisible(form.tableButton).catch(err => {
                throw new Error('Table  button is not visible! ' + err);
            })
        }
    },
    isIncreaseIndentButtonDisplayed: {
        value: function () {
            return this.waitForVisible(form.increaseIndentButton).catch(err => {
                throw new Error('Increase Indent  button is not visible! ' + err);
            })
        }
    },
    waitForValidationRecording: {
        value: function (ms) {
            return this.waitForVisible(this.validationRecord, ms);
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
