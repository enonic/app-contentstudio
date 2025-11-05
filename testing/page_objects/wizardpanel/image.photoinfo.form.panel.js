/**
 * Created on 08.07.2019.
 */
const Page = require('../page');
const lib = require('../../libs/elements');
const xpath = {
    container: "//div[contains(@id,'MixinsWizardStepForm') and preceding-sibling::div[child::span[text()='Photo']]]",
    lensInput: `//input[contains(@name,'lens')]`,
    dateTimeInput: "//div[contains(@id,'DateTimePicker')]//input[contains(@id,'TextInput')]",
    makeInput: "//input[contains(@name,'make')]",
    modelInput: "//input[contains(@name,'model')]",
    isoInput: "//input[contains(@name,'iso')]",
    apertureInput: "//input[contains(@name,'aperture')]"
};

class ImagePhotoInfoFormPanel extends Page {

    get lensInput() {
        return xpath.container + xpath.lensInput;
    }

    get dateTimeInput() {
        return xpath.container + xpath.dateTimeInput;
    }

    get makeInput() {
        return xpath.container + xpath.makeInput;
    }

    get modelInput() {
        return xpath.container + xpath.modelInput;
    }

    get isoInput() {
        return xpath.container + xpath.isoInput;
    }

    get apertureInput() {
        return xpath.container + xpath.apertureInput;
    }

    typeDateTime(dateTime) {
        return this.typeTextInInput(this.dateTimeInput, dateTime);
    }

    getDateTimeValue() {
        return this.getTextInInput(this.dateTimeInput);
    }
}

module.exports = ImagePhotoInfoFormPanel;
