/**
 * Created on 04.06.2025
 */
const BaseStepPermissionsDialog = require('./base.step.edit.permissions.dialog');
const appConst = require('../../libs/app_const');
const lib = require('../../libs/elements');

const xpath = {
    stepDescriptionP: "//p[contains(@class,'sub-name') and contains(.,'Summary')]",
    dialogButtonRow: `//div[contains(@class,'button-container')]`,
    sectionSummary: "//section[@clas='summary-step']",
    applyToText: "//dt[contains(.,'Apply to')]/following-sibling::dd[1]",
    replaceChildPermissionsText: "//dt[contains(.,'Replace child permissions')]/following-sibling::dd[1]",
    summaryDataDl: "//dl[contains(@class,'summary-data-container')]",
    showHideDetailsButtonDiv: (text) => `//button[contains(@id,'ShowHideDetailsButton') and child::span[contains(.,'${text}')]]`
};

//2 of 3 - Choose how to apply changes
class EditPermissionsSummaryStep extends BaseStepPermissionsDialog {

    get showChangesButton() {
        return this.container + xpath.showHideDetailsButtonDiv('Show changes');
    }

    get hideChangesButton() {
        return this.container + xpath.showHideDetailsButtonDiv('Hide changes');
    }

    get hideNewPermissionsButton() {
        return this.container + xpath.showHideDetailsButtonDiv('Hide new permissions');
    }

    get showNewPermissionsButton() {
        return this.container + xpath.showHideDetailsButtonDiv('Show new permissions');
    }

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

    async getApplyToText() {
        try {
            let locator = this.container + xpath.applyToText;
            await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
            return await this.getText(locator);
        } catch (err) {
            await this.handleError(`'Apply to' text should be displayed`, 'err_apply_to_text', err);
        }
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

    async waitForShowChangesButtonDisplayed() {
        try {
            await this.waitForElementDisplayed(this.showChangesButton, appConst.mediumTimeout);
        } catch (err) {
            await this.handleError('Permissions Summary step - Show changes button should be displayed', 'err_show_changes_button', err);
        }
    }

    async clickOnShowChangesButton() {
        try {
            await this.waitForElementDisplayed(this.showChangesButton, appConst.mediumTimeout);
            await this.clickOnElement(this.showChangesButton);
        } catch (err) {
            await this.handleError('Permissions Summary step - Click on Show changes button', 'err_click_show_changes_button', err);
        }
    }

    async waitForHideNewPermissionsButtonDisplayed() {
        try {
            let res = await this.findElements(this.hideNewPermissionsButton);
            await this.waitForElementDisplayed(this.hideNewPermissionsButton, appConst.mediumTimeout);
        } catch (err) {
            await this.handleError('Permissions Summary step - Hide new permissions button should be displayed',
                'err_hide_new_permissions_button', err);
        }
    }

    async clickOnHideNewPermissionsButton() {
        try {
            await this.waitForElementDisplayed(this.hideNewPermissionsButton, appConst.mediumTimeout);
            await this.clickOnElement(this.hideNewPermissionsButton);
        } catch (err) {
            await this.handleError('Permissions Summary step - Click on Hide new permissions button',
                'err_click_hide_new_permissions_button', err);
        }
    }

    async waitForShowNewPermissionsButtonDisplayed() {
        try {
            await this.waitForElementDisplayed(this.showNewPermissionsButton, appConst.mediumTimeout);
        } catch (err) {
            await this.handleError('Permissions Summary step - Show new permissions button should be displayed',
                'err_show_new_permissions_button', err);
        }
    }

    async clickOnShowNewPermissionsButton() {
        try {
            await this.waitForElementDisplayed(this.showNewPermissionsButton, appConst.mediumTimeout);
            await this.clickOnElement(this.showNewPermissionsButton);
        } catch (err) {
            await this.handleError('Permissions Summary step - Click on Show new permissions button',
                'err_click_show_new_permissions_button', err);
        }
    }

    async waitForHideChangesButtonDisplayed() {
        try {
            await this.waitForElementDisplayed(this.hideChangesButton, appConst.mediumTimeout);
        } catch (err) {
            await this.handleError('Permissions Summary step - Hide changes button should be displayed', 'err_hide_changes_button', err);
        }
    }

    async clickOnHideChangesButton() {
        try {
            await this.waitForElementDisplayed(this.hideChangesButton, appConst.mediumTimeout);
            await this.clickOnElement(this.hideChangesButton);
        } catch (err) {
            await this.handleError('Permissions Summary step - Click on Hide changes button', 'err_click_hide_changes_button', err);
        }
    }
}

module.exports = EditPermissionsSummaryStep;

