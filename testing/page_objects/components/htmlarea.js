/**
 * Created on 04.12.2018.
 */
const page = require('../page');
const elements = require('../../libs/elements');
const appConst = require('../../libs/app_const');


const component = {
    typeText: function (id, text) {
        return `CKEDITOR.instances['${id}'].setData('${text}')`
    },
    getText: function (id) {
        return `return CKEDITOR.instances['${id}'].getData()`
    }
};
const htmlArea = Object.create(page, {
    typeTextInHtmlArea: {
        value: function (selector, text) {
            return this.waitForVisible(selector, appConst.TIMEOUT_3).then(() => {
                return this.getIdOfHtmlArea(selector + elements.TEXT_AREA);
            }).then(id => {
                this.execute(component.typeText(id, text));
            });
        }
    },
    getIdOfHtmlArea: {
        value: function (selector) {
            return this.getAttribute(selector, 'id');
        }
    },
    getTextFromHtmlArea: {
        value: function (container) {

            return this.waitForVisible(container + `//div[contains(@id,'cke_api.ui.text.TextArea')]`,
                appConst.TIMEOUT_3).then(() => {
                return this.getIdOfHtmlArea(container + elements.TEXT_AREA);
            }).then(id => {
                return this.execute(component.getText(id));
            }).then(response => {
                let res = [];
                res.push(response.value.trim());
                return res;
            })
        }
    },
});
module.exports = htmlArea;