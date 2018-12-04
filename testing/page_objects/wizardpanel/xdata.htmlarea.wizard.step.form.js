/**
 * Created on 04.12.2018.
 */

const page = require('../page');
const elements = require('../../libs/elements');
const appConst = require('../../libs/app_const');

const formXpath = {
    container: `//div[contains(@id,'XDataWizardStepForm')]`,
    typeText: function (id, text) {
        return `CKEDITOR.instances['${id}'].setData('${text}')`
    },
    getText: function (id) {
        return `return CKEDITOR.instances['${id}'].getData()`
    }
};
const xDataTImageSelector = Object.create(page, {

    ckeTextArea: {
        get: function () {
            return `${formXpath.container}` + `//div[contains(@id,'cke_api.ui.text.TextArea')]`;
        }
    },
    getIdOfHtmlAreas: {
        value: function (text) {
            let selector = formXpath.container + elements.TEXT_AREA;
            return this.getAttribute(selector, 'id');
        }
    },

    typeTextInHtmlArea: {
        value: function (texts) {
            return this.waitForVisible(this.ckeTextArea, appConst.TIMEOUT_3).pause(300).then(() => {
                return this.getIdOfHtmlAreas();
            }).then(ids => {
                const promises = [].concat(texts).map((text, index) => {
                    return this.execute(formXpath.typeText([].concat(ids)[index], text));
                });
                return Promise.all(promises);
            });
        }
    },
    getTextFromHtmlArea: {
        value: function () {
            let strings = [];
            return this.waitForVisible(this.ckeTextArea, appConst.TIMEOUT_3).then(() => {
                return this.getIdOfHtmlAreas();
            }).then(ids => {
                [].concat(ids).forEach(id => {
                    strings.push(this.execute(formXpath.getText(id)));
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
});
module.exports = xDataTImageSelector;
