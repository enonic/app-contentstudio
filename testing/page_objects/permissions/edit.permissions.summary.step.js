/**
 * Created on 04.06.2025
 */
const BaseStepPermissionsDialog = require('./base.step.edit.permissions.dialog');
const appConst = require('../../libs/app_const');
const lib = require('../../libs/elements');

const xpath = {
    stepDescriptionP: "//p[contains(@class,'sub-name') and contains(.,'Summary')]",
    dialogButtonRow: `//div[contains(@class,'button-container')]`,
};

//2 of 3 - Choose how to apply changes
class EditPermissionsSummaryStep extends BaseStepPermissionsDialog {

    get stepDescription() {
        return this.container + xpath.stepDescriptionP;
    }

    get applyChangesButton() {
        return this.container + xpath.dialogButtonRow + lib.dialogButton('Apply Changes');
    }

    get replaceAllPermissionsButton() {
        return this.container + xpath.dialogButtonRow + lib.dialogButton('Replace All Permissions');
    }

    get noChangesToApply() {
        return this.container + xpath.dialogButtonRow + lib.dialogButton('No changes to apply');
    }

    async waitForApplyChangesButtonEnabled() {
        try {
            await this.waitForElementDisplayed(this.applyChangesButton, appConst.mediumTimeout);
            return await this.waitForElementEnabled(this.applyChangesButton, appConst.mediumTimeout);
        } catch (err) {
            await this.handleError(`Apply Changes button should be enabled`, 'err_permissions_apply_changes', err);
        }
    }

    async clickOnReplaceAllPermissionsButton() {
        try {
            await this.waitForElementEnabled(this.replaceAllPermissionsButton, appConst.mediumTimeout);
            await this.clickOnElement(this.replaceAllPermissionsButton);
            return await this.pause(500);
        } catch (err) {
            await this.handleError(`Edit Permissions - Click on 'Replace All Permissions' button`, 'err_replace_all_permissions', err);
        }
    }
    async clickOnApplyChangesButton() {
        try {
            await this.waitForApplyChangesButtonEnabled();
            await this.clickOnElement(this.applyChangesButton);
            return await this.pause(500);
        } catch (err) {
            await this.handleError(`Edit Permissions - Click on 'Apply Changes' button`, 'err_permissions_apply_changes', err);
        }
    }

    async waitForLoaded() {
        try {
            await this.waitForElementDisplayed(this.stepDescription, appConst.mediumTimeout);
            return await this.pause(300);
        } catch (err) {
            await this.handleError('Edit permissions Summary - step was not loaded!', 'err_edit_perm_summary', err);
        }
    }

    async waitForNoChangesToApplyDisabled() {
        try {
            await this.waitForElementDisplayed(this.noChangesToApply, appConst.mediumTimeout);
            return await this.waitForElementDisabled(this.noChangesToApply, appConst.mediumTimeout);
        } catch (err) {
            let msg = 'No changes to apply button should be disabled';
            await this.handleError(msg, 'err_no_changes_to_apply', err);
        }
    }
}

module.exports = EditPermissionsSummaryStep;

