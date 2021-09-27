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

    async doAddTag(text) {
        try {
            await this.typeInTagInput(text)
            await this.pause(200);
            await utils.doPressEnter();
            return await this.pause(200);
        } catch (err) {
            throw new Error("Error when typing the tag:  " + err);
        }
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
}

module.exports = TagForm;
