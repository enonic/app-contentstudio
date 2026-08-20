/**
 * Created on 10.04.2021. Updated on 18.08.2026
 */
const BaseOptionSetFormView = require('./base.option.set.form.view');
const ImageSelectorDropdown = require('../../components/selectors/image.selector.dropdown');
const { COMMON, BUTTONS, DROPDOWN } = require('../../../libs/elements');
const appConst = require('../../../libs/app_const');

const xpath = {
    container:
        "//div[@data-component='OptionSetView' and child::div[@data-component='SetHeader']//span[text()='Single selection']]",
    optionSetMoreMenuButton: "//div[@data-component='OptionSetOccurrenceView']//button[@aria-label='More actions']",
    resetMenuItem:
        "//div[@data-component='ContextMenu.Content']//div[@data-component='ContextMenu.Item' and text()='Reset']",
    checkboxByLabel: (label) => `//div[@data-component='Checkbox' and descendant::span[text()='${label}']]//label`,
    imageSelector: "//div[@data-component='ImageSelector']",
    selectedImageByName: (imageName) =>
        "//div[@data-component='SelectorSelection']" + DROPDOWN.selectedItemByDisplayName(imageName),
};

class OptionSetForm2View extends BaseOptionSetFormView {
    get container() {
        return xpath.container;
    }

    get optionSetMenuButton() {
        return xpath.container + xpath.optionSetMoreMenuButton;
    }

    // Options filter input in the Image selector, the input is displayed in the selected option's form:
    get imageOptionsFilterInput() {
        return xpath.container + xpath.imageSelector + DROPDOWN.OPTION_FILTER_DATA_COMPONENT;
    }

    async selectOption(optionDisplayName) {
        try {
            let locator = xpath.container + COMMON.INPUTS.dataComponentRadioByLabel(optionDisplayName);
            await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
            await this.clickOnElement(locator);
            return await this.pause(500);
        } catch (err) {
            await this.handleError('Option Set Form2 - select option:', 'err_optionset2', err);
        }
    }

    async clickOnCheckboxByLabel(label) {
        let locator = xpath.container + xpath.checkboxByLabel(label);
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        return await this.clickOnElement(locator);
    }

    // 'Full width' checkbox is displayed in the form of the selected option:
    async clickOnFullWidthCheckbox() {
        try {
            return await this.clickOnCheckboxByLabel('Full width');
        } catch (err) {
            await this.handleError(
                `Option Set Form2 - tried to click on 'Full width' checkbox`,
                'err_optionset2_full_width',
                err,
            );
        }
    }

    // 'Sidebar image' checkbox is displayed in the form of the selected option:
    async clickOnSidebarImageCheckbox() {
        try {
            return await this.clickOnCheckboxByLabel('Sidebar image');
        } catch (err) {
            await this.handleError(
                `Option Set Form2 - tried to click on 'Sidebar image' checkbox`,
                'err_optionset2_sidebar_image',
                err,
            );
        }
    }

    async expandOptionSetMenu() {
        await this.waitForElementDisplayed(this.optionSetMenuButton, appConst.mediumTimeout);
        await this.clickOnElement(this.optionSetMenuButton);
        return await this.pause(400);
    }

    async clickOnResetMenuItem() {
        await this.expandOptionSetMenu();
        let resetMenuItems = await this.getDisplayedElements(xpath.resetMenuItem);
        await resetMenuItems[0].click();
        return await this.pause(400);
    }

    // Filters the images in the Image selector then clicks on the filtered option:
    async selectImage(imageName) {
        try {
            let imageSelectorDropdown = new ImageSelectorDropdown(xpath.container);
            // 1. Type the image name in the options filter input(the input is inside the option set form):
            await this.typeTextInInput(this.imageOptionsFilterInput, imageName);
            await this.pause(700);
            // 2. Click on the filtered option(the dropdown list is displayed outside the option set form):
            await imageSelectorDropdown.clickOnOptionByDisplayName(imageName);
            // 3. Wait for the image is displayed in the selected options:
            await this.waitForImageSelected(imageName);
            return await this.pause(500);
        } catch (err) {
            await this.handleError(
                `Option Set Form2 - tried to select the image: ${imageName}`,
                'err_optionset2_select_image',
                err,
            );
        }
    }

    // Clicks on the 'Remove' button in the selected image:
    async removeImage(imageName) {
        try {
            let selectedImage = xpath.container + xpath.selectedImageByName(imageName);
            let removeButton = selectedImage + BUTTONS.BUTTON_REMOVE_ICON;
            await this.waitForElementDisplayed(removeButton, appConst.mediumTimeout);
            await this.clickOnElement(removeButton);
            await this.waitForElementNotDisplayed(selectedImage, appConst.mediumTimeout);
            return await this.pause(500);
        } catch (err) {
            await this.handleError(
                `Option Set Form2 - tried to remove the image: ${imageName}`,
                'err_optionset2_remove_image',
                err,
            );
        }
    }

    async waitForImageSelected(imageName) {
        try {
            let locator = xpath.container + xpath.selectedImageByName(imageName);
            return await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        } catch (err) {
            await this.handleError(
                `Option Set Form2 - the image '${imageName}' should be displayed in the selected options`,
                'err_optionset2_image_selected',
                err,
            );
        }
    }

    async waitForImageNotSelected(imageName) {
        try {
            let locator = xpath.container + xpath.selectedImageByName(imageName);
            return await this.waitForElementNotDisplayed(locator, appConst.mediumTimeout);
        } catch (err) {
            await this.handleError(
                `Option Set Form2 - the image '${imageName}' should not be displayed in the selected options`,
                'err_optionset2_image_not_selected',
                err,
            );
        }
    }

    async getSelectedImagesDisplayNames() {
        let locator =
            xpath.container +
            "//div[@data-component='SelectorSelection']" +
            `//div[@data-component='ImageSelectorItemView']//span[contains(@class,'font-semibold')]`;
        return await this.getTextInDisplayedElements(locator);
    }
}

module.exports = OptionSetForm2View;
