/**
 * Created on 08.07.2019. updated on 11.06.2026
 */
const Page = require('../page');
const xpath = {
    // 'Photo' tab panel (media:cameraInfo x-data) in the ContentWizardTabs:
    container: "//div[@data-component='Tab.Content' and contains(@id,'media:cameraInfo')]",
    dateTimeInput: "//div[@data-component='DateTimeInput']//input",
    inputByLabel: label => `//input[@aria-label='${label}']`,
};

class ImagePhotoInfoFormPanel extends Page {

    get dateTimeInput() {
        return xpath.container + xpath.dateTimeInput;
    }

    get makeInput() {
        return xpath.container + xpath.inputByLabel('Make');
    }

    get modelInput() {
        return xpath.container + xpath.inputByLabel('Model');
    }

    get lensInput() {
        return xpath.container + xpath.inputByLabel('Lens');
    }

    get isoInput() {
        return xpath.container + xpath.inputByLabel('ISO');
    }

    get apertureInput() {
        return xpath.container + xpath.inputByLabel('Aperture');
    }

    typeDateTime(dateTime) {
        return this.typeTextInInput(this.dateTimeInput, dateTime);
    }

    getDateTimeValue() {
        return this.getTextInInput(this.dateTimeInput);
    }
}

module.exports = ImagePhotoInfoFormPanel;
