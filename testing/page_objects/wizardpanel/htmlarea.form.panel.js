/**
 * Created on 26.04.2018.
 */

const page = require('../page');
const elements = require('../../libs/elements');
const appConst = require('../../libs/app_const');

const form = {
    validationRecording: `//div[contains(@id,'ValidationRecordingViewer')]//li`,
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
            return this.waitForVisible(`//div[contains(@id,'cke_api.ui.text.TextArea')]`, appConst.TIMEOUT_3).then(()=> {
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
            return this.waitForVisible(`//div[contains(@id,'cke_api.ui.text.TextArea')]`).then(()=> {
                return this.getIdOfHtmlAreas();
            }).then(ids => {
                return this.execute(form.typeText(ids[index], ''));
            }).pause(500);
        }
    },
    getTextFromHtmlArea: {
        value: function () {
            let strings = [];
            return this.getIdOfHtmlAreas().then(ids => {
                [].concat(ids).forEach(id => {
                    strings.push(this.execute(form.getText(id)));
                });
                return Promise.all(strings);
            }).then(response=> {
                let res = [];
                response.forEach((str)=> {
                    return res.push(str.value.trim());
                })
                return res;
            })
        }
    },
    showToolbarAndClickOnInsertImageButton: {
        value: function () {
            return this.doClick(`//div[contains(@id,'cke_api.ui.text.TextArea')]`).then(()=> {
                return this.waitForVisible(`//a[contains(@class,'cke_button') and @title='Image']`);
            }).then(result=> {
                return this.doClick(`//a[contains(@class,'cke_button') and @title='Image']`)
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
            return this.getText(this.validationRecord).catch(err=> {
                this.saveScreenshot('err_textarea_validation_record');
                throw new Error('getting Validation text: ' + err);
            })
        }
    }
});
module.exports = htmlAreaForm;
