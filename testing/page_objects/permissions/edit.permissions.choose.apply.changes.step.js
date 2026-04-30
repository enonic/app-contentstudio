/**
 * Created on 04.06.2025
 */
const BaseStepPermissionsDialog = require('./base.step.edit.permissions.dialog');
const appConst = require('../../libs/app_const');

const xpath = {
    stepDescriptionP: "//header[child::h2[contains(.,'Choose where the changes should apply')]]",
    dialogButtonRow: `//div[contains(@class,'button-container')]`,
};

// Step 2 of 3 - Choose how to apply changes
class EditPermissionsChooseApplyChangesStep extends BaseStepPermissionsDialog {

    get stepDescription() {
        return this.container + xpath.stepDescriptionP;
    }

    get replaceAllChildChildPermissionsCheckbox() {
        return this.container + `//label[.//span[contains(text(),'Replace all child permissions')]]`;
    }

    get thisItemRadioButton() {
        return this.container + `//span[contains(text(),'This item')]/parent::button[@role='radio']`;
    }

    get childrenOnlyRadioButton() {
        return this.container + `//span[contains(text(),'Children only')]/parent::button[@role='radio']`;
    }

    get thisItemAndChildrenRadioButton() {
        return this.container + `//span[contains(text(),'This item and all children')]/parent::button[@role='radio']`;
    }

    async waitForThisItemRadioDisplayed() {
        return this.waitForElementDisplayed(this.thisItemRadioButton);
    }

    async isThisItemRadioSelected() {
        await this.waitForThisItemRadioDisplayed();
        return await this.isSelected(this.thisItemRadioButton);
    }

    async waitForLoaded() {
        try {
            await this.waitForElementDisplayed(this.stepDescription);
            return await this.pause(300);
        } catch (err) {
            await this.handleError(`Edit permissions - Choose how to apply changes step should be loaded`,
                'err_edit_perm_choose_apply_changes_loaded', err);
        }
    }

    async clickOnChildrenOnlyRadioButton() {
        try {
            await this.waitForElementDisplayed(this.childrenOnlyRadioButton);
            await this.clickOnElement(this.childrenOnlyRadioButton);
        } catch (err) {
            await this.handleError(`Edit Permissions - Click on 'Children only' radio button`, 'err_edit_perm_children_only', err);
        }
    }

    async clickOnThisItemAndChildrenRadioButton() {
        try {
            await this.waitForElementDisplayed(this.thisItemAndChildrenRadioButton);
            await this.clickOnElement(this.thisItemAndChildrenRadioButton);
        } catch (err) {
            await this.handleError(`Edit Permissions - Click on 'This item and all children' radio button`,
                'err_edit_perm_this_item_and_children', err);
        }
    }

    async clickOnThisItemRadioButton() {
        try {
            await this.waitForElementDisplayed(this.thisItemRadioButton);
            await this.clickOnElement(this.thisItemRadioButton);
        } catch (err) {
            await this.handleError(`Edit Permissions - Click on 'This item' radio button`, 'err_edit_perm_this_item', err);
        }
    }

    async waitForReplaceExistingChildPermissionsCheckboxNotDisplayed() {
        try {
            await this.waitForElementNotDisplayed(this.replaceAllChildPermissionsCheckbox);
        } catch (err) {
            await this.handleError(`Edit Permissions - Wait for 'Replace existing child permissions' checkbox should not be not displayed`,
                'err_edit_perm_replace_existing_child_permissions_checkbox', err);
        }
    }

    async clickOnReplaceAllChildPermissionsCheckbox() {
        try {
            await this.waitForElementDisplayed(this.replaceAllChildChildPermissionsCheckbox);
            await this.clickOnElement(this.replaceAllChildChildPermissionsCheckbox);
        } catch (err) {
            await this.handleError(`Edit Permissions - Click on 'Replace existing child permissions' checkbox`, 'err_edit_perm_dialog',
                err);
        }
    }

    async isReplaceAllChildPermissionsCheckboxChecked() {
        try {
            await this.waitForElementDisplayed(this.replaceAllChildChildPermissionsCheckbox);
            let inputLocator = this.replaceAllChildChildPermissionsCheckbox + "/following-sibling::input";
            return await this.isSelected(inputLocator);
        } catch (err) {
            await this.handleError(`Edit Permissions - 'Replace all child permissions' checkbox`, 'err_edit_perm_replace_checkbox', err);
        }
    }
}

module.exports = EditPermissionsChooseApplyChangesStep;

