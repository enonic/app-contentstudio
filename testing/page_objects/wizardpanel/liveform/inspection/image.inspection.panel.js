/**
 * Created on 25.01.2019.
 */

const Page = require('../../../page');
const lib = require('../../../../libs/elements');
const appConst = require('../../../../libs/app_const');
const LoaderComboBox = require('../../../components/loader.combobox');
const xpath = {
    container: `//div[contains(@id,'ImageInspectionPanel')]`,
    imageContentComboBox: `//div[contains(@id,'ImageContentComboBox')]`,
    modeTogglerButton: "//button[contains(@id,'ModeTogglerButton')]",
    applyButton: ``,
    comboBoxOptionFilterInput: "//input[contains(@id,'ComboBoxOptionFilterInput')]",
};

//Context Window, Inspect tab for Image Component
class ImageInspectionPanel extends Page {

    get captionTextArea() {
        return xpath.container + "//div[contains(@id,'InputView') and descendant::div[text()='Caption']]" + lib.TEXT_AREA;
    }

    get imageContentComboBox() {
        return xpath.container + xpath.imageContentComboBox;
    }

    get comboBoxOptionFilterInput() {
        return xpath.container + xpath.comboBoxOptionFilterInput;
    }

    get modeTogglerButton() {
        return xpath.container + xpath.modeTogglerButton;
    }

    async typeTextInOptionsFilter(text) {
        return await this.typeTextInInput(this.comboBoxOptionFilterInput, text);
    }

    async typeNameAndSelectImage(displayName) {
        let loaderComboBox = new LoaderComboBox();
        await loaderComboBox.typeTextAndSelectOption(displayName, xpath.container);
        return await this.pause(500);
    }

    async clickOnModeTogglerButton() {
        try {
            await this.clickOnElement(this.modeTogglerButton);
            return await this.pause(1000);
        } catch (err) {
            this.saveScreenshot('err_inspect_panel_mode_toggler');
            throw  new Error('mode toggler not found ' + err);
        }
    }

    async expandFolderInOptions(folderName) {
        let locator = xpath.container + lib.expanderIconByName(folderName);
        this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        await this.clickOnElement(locator);
        return await this.pause(300);
    }

    async getTreeModeOptionDisplayNames() {
        let options = xpath.container + lib.SLICK_VIEW_PORT + lib.H6_DISPLAY_NAME;
        return await this.getTextInElements(options);
    }

    waitForOpened() {
        return this.waitForElementDisplayed(xpath.container, appConst.mediumTimeout).catch(err => {
            this.saveScreenshot('err_load_inspect_panel');
            throw new Error('Live Edit, Inspection not loaded' + err);
        });
    }

    typeCaption(caption) {
        return this.waitForElementDisplayed(this.captionTextArea, appConst.mediumTimeout).then(() => {
            return this.typeTextInInput(this.captionTextArea, caption);
        }).catch(err => {
            this.saveScreenshot('err_type_text_in_caption');
            throw new Error('error- Image Inspect Panel, type text in Caption text area: ' + err)
        })
    }

    getCaptionText() {
        return this.getTextInInput(this.captionTextArea).catch(err => {
            this.saveScreenshot('err_get_text_in_caption');
            throw new Error('error- Image Inspect Panel, type text in Caption text area: ' + err)
        });
    }

    async clickOnRemoveIcon() {
        try {
            let selector = xpath.container + lib.CONTENT_SELECTED_OPTION_VIEW + lib.REMOVE_ICON;
            await this.waitForElementDisplayed(selector);
            await this.clickOnElement(selector);
            return await this.pause(200);
        } catch (err) {
            this.saveScreenshot('err_clicking_remove_inspection_panel');
            throw new Error('Image Inspect Panel, error when remove-icon has been clicked: ' + err)
        }
    }

    async clickOnApplyButton() {
        let selector = "//div[contains(@id,'ContextWindow')]" + lib.ACTION_BUTTON + "/span[text()='Apply']";
        await this.clickOnElement(selector);
        return await this.pause(1000);
    }

    isImageComboBoxDisplayed() {
        return this.isElementDisplayed(xpath.container + xpath.imageContentComboBox + "//input[contains(@id,'ComboBoxOptionFilterInput')]");
    }

    isErrorMessageDisplayed() {
        return this.isElementDisplayed(xpath.container + "//div[contains(@class,'error-container')]");
    }

}

module.exports = ImageInspectionPanel;

