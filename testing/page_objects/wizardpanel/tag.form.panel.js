/**
 * Created on 22.03.2019.
 */
const Page = require('../page');
const lib = require('../../libs/elements');
const appConst = require('../../libs/app_const');
const utils = require('../../libs/studio.utils');

const xpath = {
    suggestions: "//ul[contains(@id,'TagSuggestions')]/li",
    removeTagIcon: "//ul/li[contains(@id,'Tag')]/a",
};

class TagForm extends Page {

    get tagValidationRecording() {
        return lib.FORM_VIEW + lib.INPUT_VALIDATION_VIEW;
    }

    get tagInput() {
        return lib.FORM_VIEW + lib.TEXT_INPUT;
    }

    get removeTagIcon() {
        return lib.FORM_VIEW + xpath.removeTagIcon;
    }

    async clickOnTagInput() {
        await this.clickOnElement(this.tagInput);
    }

    async typeInTagInput(text) {
        await this.clickOnElement(this.tagInput);
        await this.pause(200);
        return await this.getBrowser().keys(text);
    }

    waitForTagInputNotDisplayed() {
        return this.waitForElementNotDisplayed(this.tagInput, appConst.mediumTimeout);
    }

    waitForTagInputDisplayed() {
        return this.waitForElementDisplayed(this.tagInput, appConst.mediumTimeout);
    }


    async doAddTag(text) {
        try {
            await this.waitForTagInputDisplayed();
            await this.typeInTagInput(text)
            await this.pause(200);
            await utils.doPressEnter();
        } catch (err) {
            await this.handleError('Tag Form - tried to add a new tag', 'err_type_tag_input', err);
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

    async getTagValidationMessage() {
        let locator = lib.CONTENT_WIZARD_STEP_FORM + this.tagValidationRecording;
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        return await this.getText(locator);
    }

    async waitForTagValidationMessageNotDisplayed() {
        await this.getBrowser().waitUntil(async () => {
            let elements = await this.getDisplayedElements(this.tagValidationRecording);
            return elements.length === 0;
        }, {timeout: appConst.mediumTimeout, timeoutMsg: "Tag Validation recording should not be displayed"});
    }

    async removeTag(index) {
        try {
            let elements = await this.findElements(this.removeTagIcon);
            if (elements.length === 0) {
                throw new Error("Remove a tag icon was not found:");
            }
            return await elements[index].click();
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_remove_tag_icon');
            throw new Error(`Remove tag icon: screenshot:${screenshot} ` + err);
        }
    }

    async getTagsCount() {
        let elements = await this.findElements(this.removeTagIcon);
        return elements.length;
    }
}

module.exports = TagForm;
