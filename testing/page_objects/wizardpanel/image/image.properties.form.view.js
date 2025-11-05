/**
 * Created on 23.09.2021
 */
const Page = require('../../page');
const lib = require('../../../libs/elements');
const appConst = require('../../../libs/app_const');

const XPATH = {
    container: "//div[contains(@id,'MixinsWizardStepForm') and preceding-sibling::div[child::span[text()='Properties']]]",
    sizePixelsInput: "//input[contains(@name,'pixelSize')]",
    heightInput: "//input[contains(@name,'imageHeight')]",
    widthInput: "//input[contains(@name,'imageWidth')]",
    contentTypeInput: "//input[contains(@name,'contentType')]",
    descriptionInput: "//input[contains(@name,'description')]",
    fileSourceInput: "//input[contains(@name,'fileSource')]",
    colorSpaceInput: "//input[contains(@name,'colorSpace')]",
    byteSizeInput: "//input[contains(@name,'byteSize')]",
};

class ImagePropertiesForm extends Page {

    get sizePixelsInput() {
        return XPATH.container + XPATH.sizePixelsInput;
    }

    get heightInput() {
        return XPATH.container + XPATH.heightInput;
    }

    get widthInput() {
        return XPATH.container + XPATH.widthInput;
    }

    get contentTypeInput() {
        return XPATH.container + XPATH.contentTypeInput;
    }

    get descriptionInput() {
        return XPATH.container + XPATH.descriptionInput;
    }

    get fileSourceInput() {
        return XPATH.container + XPATH.fileSourceInput;
    }

    get colorSpaceInput() {
        return XPATH.container + XPATH.colorSpaceInput;
    }

    get byteSizeInput() {
        return XPATH.container + XPATH.byteSizeInput;
    }

    waitForWidthInputDisplayed() {
        return this.waitForElementDisplayed(this.widthInput, appConst.mediumTimeout);
    }

    waitForHeightInputDisplayed() {
        return this.waitForElementDisplayed(this.heightInput, appConst.mediumTimeout);
    }

    waitForByteSizeInputDisplayed() {
        return this.waitForElementDisplayed(this.byteSizeInput, appConst.mediumTimeout);
    }

    waitForContentTypeInputDisplayed() {
        return this.waitForElementDisplayed(this.contentTypeInput, appConst.mediumTimeout);
    }

    waitForSizePixelsInputDisplayed() {
        return this.waitForElementDisplayed(this.sizePixelsInput, appConst.mediumTimeout);
    }

    waitForFileSourceInputDisplayed() {
        return this.waitForElementDisplayed(this.fileSourceInput, appConst.mediumTimeout);
    }

    waitForColorSpaceInputDisplayed() {
        return this.waitForElementDisplayed(this.colorSpaceInput, appConst.mediumTimeout);
    }

    waitForDescriptionInputDisplayed() {
        return this.waitForElementDisplayed(this.descriptionInput, appConst.mediumTimeout);
    }

    async typeDescription(description) {
        await this.waitForDescriptionInputDisplayed();
        await this.typeTextInInput(this.descriptionInput, description);
        return await this.pause(200);
    }

    async typeColorSpace(text) {
        await this.waitForColorSpaceInputDisplayed();
        await this.typeTextInInput(this.colorSpaceInput, text);
        return await this.pause(500);
    }

    async getTextInDescription() {
        await this.waitForDescriptionInputDisplayed();
        return await this.getTextInInput(this.descriptionInput);
    }

    async getTextInColorSpace() {
        await this.waitForColorSpaceInputDisplayed();
        return await this.getTextInInput(this.colorSpaceInput);
    }
}

module.exports = ImagePropertiesForm;


