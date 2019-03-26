/**
 * Created on 22.03.2019.
 */

const page = require('../page');
const elements = require('../../libs/elements');
const appConst = require('../../libs/app_const');
const utils = require('../../libs/studio.utils');

const xpath = {
    suggestions: "//ul[contains(@id,'TagSuggestions')]/li"
};

const tagForm = Object.create(page, {

    tagInput: {
        get: function () {
            return `${elements.FORM_VIEW}` + elements.TEXT_INPUT;
        }
    },
    typeInTagInput: {
        value: function (text) {
            return this.doClick(this.tagInput).pause(700).then(() => {
                return this.getBrowser().keys(text);
            });
        }
    },
    doAddTag: {
        value: function (text) {
            return this.typeInTagInput(text).catch(err => {
                throw new Error("Error when typing the tag:  " + err);
            }).pause(300).then(() => {
                return utils.doPressEnter();
            })
        }
    },
    waitForTagSuggestions: {
        value: function () {
            return this.waitForVisible(xpath.suggestions, appConst.TIMEOUT_2).catch(err => {
                return false;
            })
        }
    },
    getTagSuggestions: {
        value: function () {
            return this.waitForTagSuggestions().then(result => {
                if (result) {
                    return this.getText(xpath.suggestions);
                } else {
                    return "";
                }
            })
        }
    },
});
module.exports = tagForm;