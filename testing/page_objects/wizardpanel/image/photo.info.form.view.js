/**
 * Created on 23.09.2021
 */
const Page = require('../../page');
const lib = require('../../../libs/elements');
const appConst = require('../../../libs/app_const');

const XPATH = {
    container: "//div[contains(@id,'MixinsWizardStepForm') and preceding-sibling::div[child::span[text()='Photo']]]",
    lensInput: "//input[contains(@name,'lens')]",
    focalInput: "//input[contains(@name,'focalLength')]",
    makeInput: "//input[contains(@name,'make')]",
    modelInput: "//input[contains(@name,'model')]",
    isoInput: "//input[contains(@name,'iso')]",
    exposureInput: "//input[contains(@name,'exposureBias')]",
    apertureInput: "//input[contains(@name,'aperture')]",
    dateTimeInput: "//div[contains(@id,'DateTimePicker')]//input[contains(@id,'TextInput')]",
    focalLength35Input: "//input[contains(@name,'focalLength35')]",
    orientationInput: "//input[contains(@name,'orientation')]",
    focusInput: "//input[contains(@name,'focusDistance')]",
    exposureModeInput: "//input[contains(@name,'exposureMode')]",
    shootingModeInput: "//input[contains(@name,'shootingMode')]",
    exposureProgramInput: "//input[contains(@name,'exposureProgram')]",
    whitBalanceInput: "//input[contains(@name,'whiteBalance')]",
    flashInput: "//input[contains(@name,'flash')]",
    shutterTimeInput: "//input[contains(@name,'shutterTime')]",
    autoFlashCompensationInput: "//input[contains(@name,'autoFlashCompensation')]",
    meteringModeInput: "//input[contains(@name,'meteringMode')]",
    focusDistanceInput: "//input[contains(@name,'focusDistance')]"
};

class ImagePhotoInfoForm extends Page {

    get lensInput() {
        return XPATH.container + XPATH.lensInput;
    }

    get focusDistanceInput() {
        return XPATH.container + XPATH.focusDistanceInput;
    }

    get meteringModeInput() {
        return XPATH.container + XPATH.meteringModeInput;
    }

    get focalInput() {
        return XPATH.container + XPATH.focalInput;
    }

    get focalLength35Input() {
        return XPATH.container + XPATH.focalLength35Input;
    }

    get makeInput() {
        return XPATH.container + XPATH.makeInput;
    }

    get modelInput() {
        return XPATH.container + XPATH.modelInput;
    }

    get isoInput() {
        return XPATH.container + XPATH.isoInput;
    }

    get orientationInput() {
        return XPATH.container + XPATH.orientationInput;
    }

    get focusInput() {
        return XPATH.container + XPATH.focusInput;
    }

    get exposureInput() {
        return XPATH.container + XPATH.exposureInput;
    }

    get apertureInput() {
        return XPATH.container + XPATH.apertureInput;
    }

    get dateTimeInput() {
        return XPATH.container + XPATH.dateTimeInput;
    }

    get autoFlashCompensationInput() {
        return XPATH.container + XPATH.autoFlashCompensationInput;
    }

    get shutterTimeInput() {
        return XPATH.container + XPATH.shutterTimeInput;
    }

    get exposureModeInput() {
        return XPATH.container + XPATH.exposureModeInput;
    }

    get shootingModeInput() {
        return XPATH.container + XPATH.shootingModeInput;
    }

    get exposureProgramInput() {
        return XPATH.container + XPATH.exposureProgramInput;
    }

    get whitBalanceInput() {
        return XPATH.container + XPATH.whitBalanceInput;
    }

    get flashInput() {
        return XPATH.container + XPATH.flashInput;
    }

    get focusDistance() {
        return XPATH.container + XPATH.focusDistanceInput;
    }

    waitForShutterTimeInputDisplayed() {
        return this.waitForElementDisplayed(this.shutterTimeInput, appConst.mediumTimeout);
    }

    waitForLensInputDisplayed() {
        return this.waitForElementDisplayed(this.lensInput, appConst.mediumTimeout);
    }

    waitForFocalInputDisplayed() {
        return this.waitForElementDisplayed(this.focalInput, appConst.mediumTimeout);
    }

    waitForMakeInputDisplayed() {
        return this.waitForElementDisplayed(this.makeInput, appConst.mediumTimeout);
    }

    waitForIsoInputDisplayed() {
        return this.waitForElementDisplayed(this.isoInput, appConst.mediumTimeout);
    }

    waitForExposureInputDisplayed() {
        return this.waitForElementDisplayed(this.exposureInput, appConst.mediumTimeout);
    }

    waitForApertureInputDisplayed() {
        return this.waitForElementDisplayed(this.apertureInput, appConst.mediumTimeout);
    }

    waitForDateTimeInputDisplayed() {
        return this.waitForElementDisplayed(this.dateTimeInput, appConst.mediumTimeout);
    }

    waitForFocalLength35InputDisplayed() {
        return this.waitForElementDisplayed(this.focalLength35Input, appConst.mediumTimeout);
    }

    waitForOrientationInputDisplayed() {
        return this.waitForElementDisplayed(this.orientationInput, appConst.mediumTimeout);
    }

    waitForFocusInputDisplayed() {
        return this.waitForElementDisplayed(this.focusInput, appConst.mediumTimeout);
    }

    waitForExposureModeInputDisplayed() {
        return this.waitForElementDisplayed(this.exposureModeInput, appConst.mediumTimeout);
    }

    waitForShootingModeInputDisplayed() {
        return this.waitForElementDisplayed(this.shootingModeInput, appConst.mediumTimeout);
    }

    waitForFlashInputDisplayed() {
        return this.waitForElementDisplayed(this.flashInput, appConst.mediumTimeout);
    }

    waitForWhitBalanceInputDisplayed() {
        return this.waitForElementDisplayed(this.whitBalanceInput, appConst.mediumTimeout);
    }

    waitForAutoFlashCompensationInputDisplayed() {
        return this.waitForElementDisplayed(this.autoFlashCompensationInput, appConst.mediumTimeout);
    }

    waitForModelInputDisplayed() {
        return this.waitForElementDisplayed(this.modelInput, appConst.mediumTimeout);
    }

    waitForMeteringModeInputDisplayed() {
        return this.waitForElementDisplayed(this.meteringModeInput, appConst.mediumTimeout);
    }

    waitForFocusDistanceInputDisplayed() {
        return this.waitForElementDisplayed(this.focusDistanceInput, appConst.mediumTimeout);
    }


    async typeMake(text) {
        await this.waitForMakeInputDisplayed();
        await this.typeTextInInput(this.makeInput, text);
        return await this.pause(200);
    }

    async typeModel(text) {
        await this.waitForModelInputDisplayed();
        await this.typeTextInInput(this.modelInput, text);
        return await this.pause(200);
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

module.exports = ImagePhotoInfoForm;


