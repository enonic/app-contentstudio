/**
 * Created on 04.06.2025
 */
const BaseStepPermissionsDialog = require('./base.step.edit.permissions.dialog');
const appConst = require('../../libs/app_const');
const {BUTTONS, COMMON} = require('../../libs/elements');

const xpath = {
    stepSummary: "//div[@role='dialog' and descendant::h2[contains(.,'Summary')]]",
    applyToText: "//dt[contains(.,'Apply to')]/following-sibling::dd[1]",
    accessModeText: "//dt[contains(.,'Access Mode')]/following-sibling::dd[1]",
    accessModeUpdatedText: `//dt[contains(.,'Access Mode')]/following-sibling::dd[1]/span[2]`,
    accessModePreviousText: `//dt[contains(.,'Access Mode')]/following-sibling::dd[1]/span[1]`,
    replaceChildPermissionsText: "//dt[contains(.,'Replace child permissions')]/following-sibling::dd[1]",
    showHideDetailsButtonDiv: (text) => `//button[contains(@id,'ShowHideDetailsButton') and child::span[contains(.,'${text}')]]`,
    // 'Added' or 'Removed' or 'Unchanged' section - display names of principals:
    itemsInSection: (header) => `//h3[text()='${header}']/following-sibling::ul[1]//li//div[@data-component='ItemLabel']//span[contains(@class,'font-semibold') and contains(@class,'truncate')]`,
    itemInSectionByName: (header, name) =>
        `//h3[text()='${header}']/following-sibling::ul[1]//li[descendant::div[@data-component='ItemLabel']//span[contains(.,'${name}')]]`,
};

//2 of 3 - Choose how to apply changes
class EditPermissionsSummaryStep extends BaseStepPermissionsDialog {

    get container() {
        return xpath.stepSummary;
    }

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
        return this.container + xpath.stepSummary;
    }

    get applyChangesButton() {
        return this.container + COMMON.FOOTER_ELEMENT + BUTTONS.buttonByLabel('Apply changes');
    }

    get replaceAllPermissionsButton() {
        return this.container + COMMON.FOOTER_ELEMENT + BUTTONS.buttonByLabel('Replace all permissions');
    }

    get noChangesToApply() {
        return this.container + COMMON.FOOTER_ELEMENT + BUTTONS.buttonByLabel('No changes to apply');
    }

    // summary-data-container: 'Apply to' 'Children only' or 'This item' or 'This item and all children'
    async getApplyToText() {
        try {
            let locator = this.container + xpath.applyToText;
            await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
            return await this.getText(locator);
        } catch (err) {
            await this.handleError(`'Apply to' text should be displayed`, 'err_apply_to_text', err);
        }
    }

    async getAccessModeText() {
        try {
            let locator = this.container + xpath.accessModeText;
            await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
            return await this.getText(locator);
        } catch (err) {
            await this.handleError(`'Access mode' text should be displayed`, 'err_access_mode_text', err);
        }
    }

    async getUpdatedAccessModeText() {
        try {
            let locator = this.container + xpath.accessModeUpdatedText;
            await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
            return await this.getText(locator);
        } catch (err) {
            await this.handleError(`'Access mode' text should be displayed`, 'err_access_mode_text', err);
        }
    }

    // summary-data: 'Replace child permissions' - 'Yes' or 'No'
    async getReplaceChildPermissionsText() {
        try {
            let locator = this.container + xpath.replaceChildPermissionsText;
            await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
            return await this.getText(locator);
        } catch (err) {
            await this.handleError(`'Replace child permissions' text should be displayed`, 'err_replace_child_permissions_text', err);
        }
    }

    async getPreviousAccessModeText() {
        try {
            let locator = this.container + xpath.accessModePreviousText;
            await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
            return await this.getText(locator);
        } catch (err) {
            await this.handleError(`'Access mode' text should be displayed`, 'err_access_mode_text', err);
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
            await this.waitForElementDisplayed(this.container);
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
            await this.waitForElementDisplayed(this.hideNewPermissionsButton);
        } catch (err) {
            await this.handleError('Perm.Summary step - Hide new permissions button should be displayed', 'err_hide_new_permissions', err);
        }
    }

    async clickOnHideNewPermissionsButton() {
        try {
            await this.waitForElementDisplayed(this.hideNewPermissionsButton, appConst.mediumTimeout);
            await this.clickOnElement(this.hideNewPermissionsButton);
        } catch (err) {
            await this.handleError('Perm.Summary step - Click on Hide new permissions button', 'err_click_hide_new_permissions', err);
        }
    }

    async waitForShowNewPermissionsButtonDisplayed() {
        try {
            await this.waitForElementDisplayed(this.showNewPermissionsButton, appConst.mediumTimeout);
        } catch (err) {
            await this.handleError('Perm.Summary step - Show new permissions button should be displayed', 'err_show_new_permissions', err);
        }
    }

    async clickOnShowNewPermissionsButton() {
        try {
            await this.waitForElementDisplayed(this.showNewPermissionsButton, appConst.mediumTimeout);
            await this.clickOnElement(this.showNewPermissionsButton);
        } catch (err) {
            await this.handleError('Perm.Summary step - Click on Show new permissions button', 'err_click_show_new_permissions', err);
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

    async getNumberFromApplyChangesButton() {
        try {
            let text = await this.getText(this.applyChangesButton);
            const match = text.match(/\((\d+)\)/); // Regular expression to find number inside parentheses
            return match ? parseInt(match[1], 10) : null; // Return the number as an integer or null
        } catch (err) {
            await this.handleError('Error extracting number from text:', err);
            return null;
        }
    }

    async getNumberFromReplaceAllPermissionsButton() {
        try {
            let text = await this.getText(this.replaceAllPermissionsButton);
            const match = text.match(/\((\d+)\)/); // Regular expression to find number inside parentheses
            return match ? parseInt(match[1], 10) : null; // Return the number as an integer or null
        } catch (err) {
            await this.handleError('Error extracting number from text:', err);
            return null;
        }
    }

    // Returns display names of principals in the 'Added' or 'Removed' or 'Unchanged' section:
    async getItemsInSection(header) {
        try {
            let locator = this.container + xpath.itemsInSection(header);
            await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
            return await this.getTextInElements(locator);
        } catch (err) {
            await this.handleError(`Summary step - items in '${header}' section should be displayed`,
                `err_summary_${header.toLowerCase()}_items`, err);
        }
    }

    async getAddedItemsList() {
        return await this.getItemsInSection('Added');
    }

    async getRemovedItemsList() {
        return await this.getItemsInSection('Removed');
    }

    async getUnchangedItemsList() {
        return await this.getItemsInSection('Unchanged');
    }

    async waitForItemInSectionDisplayed(header, name) {
        try {
            let locator = this.container + xpath.itemInSectionByName(header, name);
            await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        } catch (err) {
            await this.handleError(`Summary step - '${name}' item should be displayed in the '${header}' section`,
                `err_summary_${header.toLowerCase()}_item`, err);
        }
    }

    async waitForAddedDisplayed(name) {
        return await this.waitForItemInSectionDisplayed('Added', name);
    }

    async waitForRemovedDisplayed(name) {
        return await this.waitForItemInSectionDisplayed('Removed', name);
    }

    async waitForUnchangedDisplayed(name) {
        return await this.waitForItemInSectionDisplayed('Unchanged', name);
    }

    async isOpened() {
        return await this.isElementDisplayed(this.container);
    }
}

module.exports = EditPermissionsSummaryStep;
