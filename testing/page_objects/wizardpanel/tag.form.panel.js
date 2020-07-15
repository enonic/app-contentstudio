/**
 * Created on 22.03.2019.
 */
const Page = require('../page');
const lib = require('../../libs/elements');
const appConst = require('../../libs/app_const');
const utils = require('../../libs/studio.utils');

const xpath = {
    suggestions: "//ul[contains(@id,'TagSuggestions')]/li"
};

class TagForm extends Page {

    get tagInput() {
        return lib.FORM_VIEW + lib.TEXT_INPUT;
    }

    async typeInTagInput(text) {
        await this.clickOnElement(this.tagInput);
        await this.pause(700);
        return await this.getBrowser().keys(text);
    }

    doAddTag(text) {
        return this.typeInTagInput(text).catch(err => {
            throw new Error("Error when typing the tag:  " + err);
        }).then(() => {
            return this.pause(300);
        }).then(() => {
            return utils.doPressEnter();
        })
    }

    waitForTagSuggestions() {
        return this.waitForElementDisplayed(xpath.suggestions, appConst.shortTimeout).catch(err => {
            return false;
        })
    }

    getTagSuggestions() {
        return this.waitForTagSuggestions().then(result => {
            if (result) {
                return this.getText(xpath.suggestions);
            } else {
                return "";
            }
        })
    }
};
module.exports = TagForm;