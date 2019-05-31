/**
 * Created on 21.03.2019.
 */

const Page = require('../page');
const lib = require('../../libs/elements');
const appConst = require('../../libs/app_const');
const xpath = {
    captionTextArea: "//textarea[contains(@name,'caption')]",
    alternativeText: `//input[contains(@name,'altText')]`,
};

class ImageFormPanel extends Page {

    get captionTextArea() {
        return lib.FORM_VIEW + xpath.captionTextArea;
    }

    get alternativeText() {
        return lib.FORM_VIEW + xpath.alternativeText;
    }

    //TODO type all data
    type(imageData) {
        return this.typeCaption(imageData.caption);
    }

    typeCaption(caption) {
        return this.typeTextInInput(this.captionTextArea, caption);
    }

    waitForCaptionDisplayed() {
        return this.waitForElementDisplayed(this.captionTextArea, appConst.TIMEOUT_2);
    }

    getCaption() {
        return this.getTextInInput(this.captionTextArea).catch(err => {
            throw new Error('getting Caption text: ' + err);
        })
    }
};
module.exports = ImageFormPanel;
