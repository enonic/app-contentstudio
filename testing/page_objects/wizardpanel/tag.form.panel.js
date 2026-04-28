/**
 * Created on 22.03.2019.
 */
const Page = require('../page');
const {COMMON} = require('../../libs/elements');
const appConst = require('../../libs/app_const');
const utils = require('../../libs/studio.utils');


const xpath = {
    dataComponent: "//div[@data-component='TagInput']",
    suggestions: "//ul[contains(@class,'flex-wrap')]/li",
    removeTagIcon: "//ul/li[contains(@id,'Tag')]/a",
};

class TagForm extends Page {

    get tagValidationRecording() {
        return COMMON.INPUTS.FORM_RENDERER_DATA_COMPONENT + COMMON.INPUTS.VALIDATION_RECORDING;
    }

    get tagInput() {
        return COMMON.INPUTS.FORM_RENDERER_DATA_COMPONENT + xpath.dataComponent ;
    }

    get removeTagIcon() {
        return COMMON.INPUTS.FORM_RENDERER_DATA_COMPONENT + xpath.dataComponent +
               `//ul/li//button[@aria-label='Remove occurrence']`;
    }

    async clickOnTagInput() {
        await this.clickOnElement(this.tagInput);
    }

    async clickInTagInput(){
        await this.clickOnElement(this.tagInput);
    }
    async typeInTagInput(text) {
        let locator = COMMON.INPUTS.FORM_RENDERER_DATA_COMPONENT + xpath.dataComponent + COMMON.INPUTS.INPUT;
        let inputs = await this.getDisplayedElements(locator);
        if (inputs.length === 0) {
            throw new Error("Tag input is not displayed - the maximum number of tags may have been reached");
        }
        await inputs[0].click();
        await this.pause(300);
        for (const ch of text) {
            await inputs[0].addValue(ch);
        }
    }

    async waitForNewTagInputNotDisplayed() {
        let locator = COMMON.INPUTS.FORM_RENDERER_DATA_COMPONENT + xpath.dataComponent + COMMON.INPUTS.INPUT;
        return await this.waitForElementNotDisplayed(locator, appConst.mediumTimeout);
    }

    async waitForNewTagInputDisplayed() {
        let locator = COMMON.INPUTS.FORM_RENDERER_DATA_COMPONENT + xpath.dataComponent + COMMON.INPUTS.INPUT;
        return await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
    }

    waitForTagInputDisplayed() {
        return this.waitForElementDisplayed(COMMON.INPUTS.FORM_RENDERER_DATA_COMPONENT + xpath.dataComponent);
    }


    async doAddTag(text) {
        try {
            await this.typeInTagInput(text)
            await this.pause(400);
            await utils.doPressEnter();
            return await this.pause(500);
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

    async getTagValidationMessage() {
        let locator = this.tagValidationRecording;
        await this.waitForElementDisplayed(locator);
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
                throw new Error("The remove tag icon was not found:");
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
