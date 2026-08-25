/**
 * Created on 21.03.2019. updated on 11.06.2026
 */
const Page = require('../page');
const appConst = require('../../libs/app_const');
const xpath = {
    wizardTabs: "//div[@data-component='ContentWizardTabs']",
    // Tab trigger in the wizard tab-bar ('Image', 'Properties', 'Photo', 'Location'):
    tabTriggerByName: (name) => `//button[@role='tab' and descendant::span[text()='${name}']]`,
    // The main content tab panel (caption, alt-text, artist, tags, copyright):
    contentTabPanel: "//div[@data-component='Tab.Content' and contains(@id,'-panel-content')]",
    captionTextArea: "//textarea[@aria-label='Caption']",
    alternativeText: "//input[@aria-label='Alternative text']",
    copyrightInput: "//input[@aria-label='Copyright']",
    imageEditorComponent: "//div[@data-component='LiveViewImageEditor']",
    imageCanvas: "//div[contains(@id,'ImageEditor')]//div[contains(@class,'image-canvas')]",
    // Editor toolbar buttons are wrapped in a tooltip that overwrites their data-component,
    // so they are located by 'aria-label' (lucide icon names change between versions):
    imageEditorCropButton: "//div[@data-component='LiveViewImageEditor']//button[@aria-label='Crop Image']",
    imageEditorAutofocusButton: "//div[@data-component='LiveViewImageEditor']//button[@aria-label='Set Autofocus']",
    imageEditorRotateButton: "//div[@data-component='LiveViewImageEditor']//button[@aria-label='Rotate clockwise']",
    imageEditorFlipButton: "//div[@data-component='LiveViewImageEditor']//button[@aria-label='Flip']",
    artistsTagInput:
        "//div[contains(@id,'InputView') and descendant::div[@class='label' and text()='Artist']]//input[@type='text']",
    tagsInput:
        "//div[contains(@id,'InputView') and descendant::div[@class='label' and text()='Tags']]//input[@type='text']",
    addedArtistTag:
        "//div[contains(@id,'InputView') and descendant::div[@class='label' and text()='Artist']]//ul/li[contains(@id,'Tag')]/span",
    addedTags:
        "//div[contains(@id,'InputView') and descendant::div[@class='label' and text()='Tags']]//ul/li[contains(@id,'Tag')]/span",
};

class ImageFormPanel extends Page {
    get photoWizardStep() {
        return xpath.wizardTabs + xpath.tabTriggerByName('Photo');
    }

    get artistsTagInput() {
        return xpath.artistsTagInput;
    }

    get tagsInput() {
        return xpath.tagsInput;
    }

    get captionTextArea() {
        return xpath.captionTextArea;
    }

    get copyrightInput() {
        return xpath.copyrightInput;
    }

    get alternativeText() {
        return xpath.alternativeText;
    }

    get imageEditorCropButton() {
        return xpath.imageEditorCropButton;
    }

    get imageEditorAutofocusButton() {
        return xpath.imageEditorAutofocusButton;
    }

    get imageEditorRotateButton() {
        return xpath.imageEditorRotateButton;
    }

    get imageEditorFlipButton() {
        return xpath.imageEditorFlipButton;
    }

    // Clicks on a tab in the wizard tab-bar ('Image', 'Properties', 'Photo', 'Location'):
    async clickOnWizardTab(tabName) {
        let locator = xpath.wizardTabs + xpath.tabTriggerByName(tabName);
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        await this.clickOnElement(locator);
        return await this.pause(300);
    }

    clickOnPhotoWizardStep() {
        return this.clickOnWizardTab('Photo');
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
        return this.getTextInInput(this.captionTextArea).catch((err) => {
            throw new Error('getting Caption text: ' + err);
        });
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
        let timeout = ms === undefined ? appConst.longTimeout : ms;
        try {
            await this.waitForElementDisplayed(xpath.imageEditorComponent, timeout);
            return await this.waitForElementEnabled(xpath.imageEditorCropButton, timeout);
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
