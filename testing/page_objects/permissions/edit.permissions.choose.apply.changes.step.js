/**
 * Created on 04.06.2025
 */
const BaseStepPermissionsDialog = require('./base.step.edit.permissions.dialog');
const appConst = require('../../libs/app_const');
const lib = require('../../libs/elements');

const xpath = {
    stepDescriptionP: "//p[contains(@class,'sub-name') and contains(.,'Choose how to apply changes')]",
    dialogButtonRow: `//div[contains(@class,'button-container')]`,
};

// Step 2 of 3 - Choose how to apply changes
class EditPermissionsChooseApplyChangesStep extends BaseStepPermissionsDialog {

    get stepDescription() {
        return this.container + xpath.stepDescriptionP;
    }

    get replaceExistingChildPermissionsCheckbox() {
        return this.container + lib.INPUTS.checkBoxLabel('Replace existing child permissions');
    }

    get thisItemRadioButton() {
        return this.container +
               `//span[contains(@class,'radio-button') and descendant::span[contains(.,'This item'') and not (contains(.,'children']]//input`
    }

    get childrenOnlyRadioButton() {
        return this.container + lib.radioButtonContainsLabel('Children only');
    }

    get thisItemAndChildrenRadioButton() {
        return this.container + lib.radioButtonContainsLabel('This item and all children');
    }

    async waitForThisItemRadioDisplayed() {
        await this.waitForElementDisplayed(this.thisItemRadioButton, appConst.shortTimeout);
    }

    async isThisItemRadioSelected() {
        await this.waitForThisItemRadioDisplayed();
        return await this.isSelected(this.thisItemRadioButton);
    }

    async waitForLoaded() {
        try {
            await this.waitForElementDisplayed(this.stepDescription, appConst.mediumTimeout);
            return await this.pause(300);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_edit_perm_choose_apply_changes');
            throw new Error(`Edit permissions Choose Apply changes - step was not loaded! screenshot ${screenshot} ` + err);
        }
    }

    async clickOnChildrenOnlyRadioButton() {
        try {
            await this.waitForElementDisplayed(this.childrenOnlyRadioButton, appConst.mediumTimeout);
            await this.clickOnElement(this.childrenOnlyRadioButton);
        } catch (err) {
            await this.handleError(`Edit Permissions - Click on 'Children only' radio button`, 'err_edit_perm_children_only', err);
        }
    }

    async clickOnThisItemAndChildrenRadioButton() {
        try {
            await this.waitForElementDisplayed(this.thisItemAndChildrenRadioButton, appConst.mediumTimeout);
            await this.clickOnElement(this.thisItemAndChildrenRadioButton);
        } catch (err) {
            await this.handleError(`Edit Permissions - Click on 'This item and all children' radio button`,
                'err_edit_perm_this_item_and_children', err);
        }
    }

    async clickOnThisItemRadioButton() {
        try {
            await this.waitForElementDisplayed(this.thisItemRadioButton, appConst.mediumTimeout);
            await this.clickOnElement(this.thisItemRadioButton);
        } catch (err) {
            await this.handleError(`Edit Permissions - Click on 'This item' radio button`, 'err_edit_perm_this_item', err);
        }
    }
    async waitForReplaceExistingChildPermissionsCheckboxNotDisplayed() {
        try {
            await this.waitForElementNotDisplayed(this.replaceExistingChildPermissionsCheckbox, appConst.mediumTimeout);
        } catch (err) {
            await this.handleError(`Edit Permissions - Wait for 'Replace existing child permissions' checkbox should not be not displayed`, 'err_edit_perm_replace_existing_child_permissions_checkbox', err);
        }
    }
    async clickOnReplaceExistingChildPermissionsCheckbox() {
        try {
            await this.waitForElementDisplayed(this.replaceExistingChildPermissionsCheckbox, appConst.mediumTimeout);
            await this.clickOnElement(this.replaceExistingChildPermissionsCheckbox);
        } catch (err) {
            await this.handleError(`Edit Permissions - Click on 'Replace existing child permissions' checkbox`, 'err_edit_perm_replace_existing_child_permissions', err);
        }
    }
    async isReplaceExistingChildPermissionsCheckboxChecked() {
        try {
            await this.waitForElementDisplayed(this.replaceExistingChildPermissionsCheckbox, appConst.mediumTimeout);
            let inputLocator =this.container+ lib.checkBoxDiv('Replace existing child permissions');
            return await this.isSelected(inputLocator);
        } catch (err) {
            await this.handleError(`Edit Permissions - Check 'Replace existing child permissions' checkbox`, 'err_edit_perm_replace_existing_child_permissions_checked', err);
        }
    }
}

module.exports = EditPermissionsChooseApplyChangesStep;

