/**
 * Created on 23.09.2021
 */
const Page = require('../../page');
const lib = require('../../../libs/elements');
const appConst = require('../../../libs/app_const');

const XPATH = {
    container: "//div[contains(@id,'XDataWizardStepForm') and preceding-sibling::div[child::span[text()='Location']]]",
    altitudeInput: "//input[contains(@name,'altitude')]",
    directionInput: "//input[contains(@name,'direction')]",
    geoPointInput: "//input[contains(@title,'latitude,longitude')]",
};

class ImageLocationForm extends Page {

    get altitudeInput() {
        return XPATH.container + XPATH.altitudeInput;
    }

    get directionInput() {
        return XPATH.container + XPATH.directionInput;
    }

    get geoPointInput() {
        return XPATH.container + XPATH.geoPointInput;
    }

    waitForAltitudeInputDisplayed() {
        return this.waitForElementDisplayed(this.altitudeInput, appConst.mediumTimeout);
    }

    waitForDirectionInputDisplayed() {
        return this.waitForElementDisplayed(this.directionInput, appConst.mediumTimeout);
    }

    waitForGeoPointInputDisplayed() {
        return this.waitForElementDisplayed(this.geoPointInput, appConst.mediumTimeout);
    }

    async typeAltitude(altitude) {
        await this.waitForAltitudeInputDisplayed();
        await this.typeTextInInput(this.altitudeInput, altitude);
    }

    async typeDirection(text) {
        await this.waitForDirectionInputDisplayed();
        await this.typeTextInInput(this.directionInput, text);
    }

    async typeGeoPoint(text) {
        await this.waitForGeoPointInputDisplayed();
        await this.typeTextInInput(this.geoPointInput, text);
    }

    async getTextInAltitude() {
        await this.waitForAltitudeInputDisplayed();
        return await this.getTextInInput(this.altitudeInput);
    }

    async getTextInGeoPoint() {
        await this.waitForGeoPointInputDisplayed();
        return await this.getTextInInput(this.geoPointInput);
    }

    async getTextInDirection() {
        await this.waitForDirectionInputDisplayed();
        return await this.getTextInInput(this.directionInput);
    }

    async getGeoPointValidationRecording() {
        let locator = XPATH.container + lib.OCCURRENCE_ERROR_BLOCK;
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        return await this.getTextInDisplayedElements(locator);
    }
}

module.exports = ImageLocationForm;


