/**
 * Created on 04.12.2018.
 */
const Page = require('../page');
const HtmlArea = require('../../page_objects/components/htmlarea');

const XPATH = {
    container: `//div[contains(@id,'XDataWizardStepForm')]`,
};

class XDataHtmlArea extends Page {

    typeTextInHtmlArea(text) {
        let htmlArea = new HtmlArea();
        return htmlArea.typeTextInHtmlArea(XPATH.container, text);
    }

    getTextInHtmlArea() {
        let htmlArea = new HtmlArea();
        return htmlArea.getTextFromHtmlArea(XPATH.container);
    }

    waitForHtmlAreaVisible() {
        return this.waitForElementDisplayed(XPATH.container + `//div[contains(@id,'cke_TextArea')]`);
    }
};
module.exports = XDataHtmlArea;
