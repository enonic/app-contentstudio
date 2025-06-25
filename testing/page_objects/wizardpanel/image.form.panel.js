/**
 * Created on 21.03.2019.
 */
const Page = require('../page');
const lib = require('../../libs/elements-old');
const appConst = require('../../libs/app_const');
const xpath = {
    captionTextArea: "//textarea[contains(@name,'caption')]",
    alternativeText: `//input[contains(@name,'altText')]`,
    imageEditor: "//div[contains(@id,'ImageEditor')]",
    copyrightInput: "//input[contains(@name,'copyright')]",
    artistsTagInput: "//div[contains(@id,'InputView') and descendant::div[@class='label' and text()='Artist']]//input[@type='text']",
    tagsInput: "//div[contains(@id,'InputView') and descendant::div[@class='label' and text()='Tags']]//input[@type='text']",
    addedArtistTag: "//div[contains(@id,'InputView') and descendant::div[@class='label' and text()='Artist']]//ul/li[contains(@id,'Tag')]/span",
    addedTags: "//div[contains(@id,'InputView') and descendant::div[@class='label' and text()='Tags']]//ul/li[contains(@id,'Tag')]/span"
};

class ImageFormPanel extends Page {

    get photoWizardStep() {
        return "//ul[contains(@id,'WizardStepNavigator')]" + lib.tabBarItemByName("Photo");
    }

    get artistsTagInput() {
        return lib.FORM_VIEW + xpath.artistsTagInput;
    }

    get tagsInput() {
        return lib.FORM_VIEW + xpath.tagsInput;
    }

    get captionTextArea() {
        return lib.FORM_VIEW + xpath.captionTextArea;
    }

    get copyrightInput() {
        return lib.FORM_VIEW + xpath.copyrightInput;
    }

    get alternativeText() {
        return lib.FORM_VIEW + xpath.alternativeText;
    }

    get resetAutofocusButton() {
        return xpath.imageEditor + xpath.resetAutofocusButton;
    }

    clickOnPhotoWizardStep() {
        return this.clickOnElement(this.photoWizardStep);
    }

    //TODO type all data
    type(imageData) {
        return this.typeCaption(imageData.caption);
    }

    typeCaption(caption) {
        return this.typeTextInInput(this.captionTextArea, caption);
    }

    waitForCaptionTextAreaDisplayed() {
        return this.waitForElementDisplayed(this.captionTextArea, appConst.shortTimeout);
    }

    waitForCopyrightInputDisplayed() {
        return this.waitForElementDisplayed(this.copyrightInput, appConst.shortTimeout);
    }

    waitForAlternativeTextInputDisplayed() {
        return this.waitForElementDisplayed(this.alternativeText, appConst.shortTimeout);
    }

    waitForArtistsTagInputDisplayed() {
        return this.waitForElementDisplayed(this.artistsTagInput, appConst.shortTimeout);
    }

    waitForTagsInputDisplayed() {
        return this.waitForElementDisplayed(this.tagsInput, appConst.shortTimeout);
    }

    getCaption() {
        return this.getTextInInput(this.captionTextArea).catch(err => {
            throw new Error('getting Caption text: ' + err);
        })
    }

    async addArtistsTag(text) {
        await this.waitForArtistsTagInputDisplayed();
        await this.typeTextInInput(this.artistsTagInput, text);
        return await this.pressEnterKey();
    }

    async addTag(text) {
        await this.waitForTagsInputDisplayed();
        await this.typeTextInInput(this.tagsInput, text);
        return await this.pressEnterKey();
    }

    async waitForImageLoaded(ms) {
        try {
            let timeout = ms === undefined ? appConst.longTimeout : ms;
            let locator = xpath.imageEditor + "//div[@class='image-canvas']";
            return await this.waitForElementDisplayed(locator, timeout);
        } catch (err) {
            await this.handleError('Image loading failed', 'err_image_load', err);
        }
    }

    getArtistsTagsText() {
        return this.getTextInDisplayedElements(xpath.addedArtistTag);
    }

    getTagsText() {
        return this.getTextInDisplayedElements(xpath.addedTags);
    }
}

module.exports = ImageFormPanel;
