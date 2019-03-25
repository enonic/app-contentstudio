/**
 * Created on 21.03.2019.
 */

const page = require('../page');
const elements = require('../../libs/elements');
const appConst = require('../../libs/app_const');
const xpath = {
    captionTextArea: "//textarea[contains(@name,'caption')]",
    alternativeText: `//input[contains(@name,'altText')]`,
};

const imageFormPanel = Object.create(page, {

    captionTextArea: {
        get: function () {
            return `${elements.FORM_VIEW}` + `${xpath.captionTextArea}`;
        }
    },
    alternativeText: {
        get: function () {
            return `${elements.FORM_VIEW}` + `${xpath.alternativeText}`;
        }
    },
    //TODO type all data
    type: {
        value: function (imageData) {
            return this.typeCaption(imageData.caption);
        }
    },
    typeCaption: {
        value: function (caption) {
            return this.typeTextInInput(this.captionTextArea, caption);
        }
    },
    waitForCaptionDisplayed: {
        value: function () {
            return this.waitForVisible(this.captionTextArea, appConst.TIMEOUT_2);
        }
    },

    getCaption: {
        value: function () {
            return this.getTextFromInput(this.captionTextArea).catch(err => {
                throw new Error('getting Caption text: ' + err);
            })
        }
    }
});
module.exports = imageFormPanel;
