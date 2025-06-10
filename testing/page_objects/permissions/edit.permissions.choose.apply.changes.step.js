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
}

module.exports = EditPermissionsChooseApplyChangesStep;

