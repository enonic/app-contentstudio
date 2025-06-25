/**
 * Created on 04.12.2018.
 */
const Page = require('../page');
const lib = require('../../libs/elements-old');
const appConst = require('../../libs/app_const');

const component = {
    typeText(id, text) {
        return `CKEDITOR.instances['${id}'].setData('${text}')`;
    },
    getText(id) {
        return `return CKEDITOR.instances['${id}'].getData()`;
    }
};

class HtmlArea extends Page {

    async typeTextInHtmlArea(selector, text) {
        await this.waitForElementDisplayed(selector, appConst.mediumTimeout);
        let id = await this.getIdOfHtmlArea(selector + lib.TEXT_AREA);
        return await this.execute(component.typeText(id, text));
    }

    getIdOfHtmlArea(selector) {
        return this.getAttribute(selector, 'id');
    }

    async getTextFromHtmlArea(container) {
        await this.waitForElementDisplayed(container + lib.CKE.TEXTAREA_DIV, appConst.mediumTimeout);
        let id = await this.getIdOfHtmlArea(container + lib.TEXT_AREA);
        let response = await this.execute(component.getText(id));
        return [].concat(response.trim());
    }
}

module.exports = HtmlArea;
