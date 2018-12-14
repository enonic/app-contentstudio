/**
 * Created on 04.12.2018.
 */

const page = require('../page');
const elements = require('../../libs/elements');
const appConst = require('../../libs/app_const');
const htmlArea = require('../../page_objects/components/htmlarea');

const formXpath = {
    container: `//div[contains(@id,'XDataWizardStepForm')]`,
};
const xDataHtmlArea = Object.create(page, {

    typeTextInHtmlArea: {
        value: function (text) {
            return htmlArea.typeTextInHtmlArea(formXpath.container, text);
        }
    },
    getTextFromHtmlArea: {
        value: function () {
            return htmlArea.getTextFromHtmlArea(formXpath.container);
        }
    },
});
module.exports = xDataHtmlArea;
