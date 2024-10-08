/**
 * Created on 23.08.2022.
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const SettingsBrowsePanel = require('../../page_objects/project/settings.browse.panel');
const ProjectWizardDialogParentProjectStep = require('../../page_objects/project/project-wizard-dialog/project.wizard.parent.project.step');
const appConst = require('../../libs/app_const');

describe('parent.project.dialog.step.spec - ui-tests for Parent Project step in New Project Wizard Dialog', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }
    const DESCRIPTION = "1 of 7 - To set up synchronization of a content with another project, select it here (optional)";

    it(`WHEN 'New...' button has been pressed THEN 'Parent Project' step should be loaded in Project Wizard dialog`,
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let parentProjectStep = new ProjectWizardDialogParentProjectStep();
            //1.'New...' button has been clicked:
            await settingsBrowsePanel.clickOnNewButton();
            //2. 'parent Project Step' dialog should be loaded:
            await parentProjectStep.waitForLoaded();
            await studioUtils.saveScreenshot("setting_item_dialog_1");
            //3. Expected title should be loaded:
            let actualDescription = await parentProjectStep.getStepDescription();
            assert.equal(actualDescription, DESCRIPTION, "Expected description should be displayed");
            //4. Skip button should be enabled:
            await parentProjectStep.waitForSkipButtonEnabled();
            await parentProjectStep.waitForCancelButtonTopDisplayed();
            //5. Verify that Project options filter input is displayed:
            await parentProjectStep.waitForProjectOptionsFilterInputDisplayed();
        });

    it(`GIVEN Project Wizard modal dialog is opened WHEN 'Cancel Top' button has been pressed THEN the dialog should be closed`,
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let parentProjectStep = new ProjectWizardDialogParentProjectStep();
            //1.'New...' button has been clicked:
            await settingsBrowsePanel.clickOnNewButton();
            //2. 'parent Project Step' dialog should be loaded:
            await parentProjectStep.waitForLoaded();
            //3. 'Cancel' button has been clicked
            await parentProjectStep.clickOnCancelButtonTop();
            await studioUtils.saveScreenshot("setting_item_dialog_canceled");
            await parentProjectStep.waitForDialogClosed();
        });

    it(`GIVEN Project Wizard modal dialog is opened WHEN 'Esc' key has been pressed THEN the dialog should be closed`,
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let parentProjectStep = new ProjectWizardDialogParentProjectStep();
            //1.'New...' button has been clicked:
            await settingsBrowsePanel.clickOnNewButton();
            //2. 'parent Project Step' dialog should be loaded:
            await parentProjectStep.waitForLoaded();
            //3. 'Cancel Top' button has been clicked:
            await parentProjectStep.pressEscKey();
            await studioUtils.saveScreenshot("setting_item_dialog_esc");
            await parentProjectStep.waitForDialogClosed();
        });

    beforeEach(async () => {
        await studioUtils.navigateToContentStudioCloseProjectSelectionDialog();
        return await studioUtils.openSettingsPanel();
    });
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(async () => {
        if (typeof browser !== 'undefined') {
            await studioUtils.getBrowser().setWindowSize(appConst.BROWSER_WIDTH, appConst.BROWSER_HEIGHT);
        }
        return console.log('specification starting: ' + this.title);
    });
});
