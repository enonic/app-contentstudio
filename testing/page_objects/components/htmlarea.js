/**
 * Created on 04.12.2018.
 */
const Page = require('../page');
const lib = require('../../libs/elements');
const appConst = require('../../libs/app_const');

const component = {
    typeText: function (id, text) {
        return `CKEDITOR.instances['${id}'].setData('${text}')`;
    },
    getText: function (id) {
        return `return CKEDITOR.instances['${id}'].getData()`;
    }
};

class HtmlArea extends Page {
    typeTextInHtmlArea(selector, text) {
        return this.waitForElementDisplayed(selector, appConst.mediumTimeout).then(() => {
            return this.getIdOfHtmlArea(selector + lib.TEXT_AREA);
        }).then(id => {
            this.execute(component.typeText(id, text));
        });
    }

    getIdOfHtmlArea(selector) {
        return this.getAttribute(selector, 'id');
    }

    getTextFromHtmlArea(container) {
        return this.waitForElementDisplayed(container + "//div[contains(@id,'cke_TextArea')]",
            appConst.mediumTimeout).then(() => {
            return this.getIdOfHtmlArea(container + lib.TEXT_AREA);
        }).then(id => {
            return this.execute(component.getText(id));
        }).then(response => {
            let res = [];
            res.push(response.trim());
            return res;
        })
    }
}

module.exports = HtmlArea;
