/**
 * Created on 21.11.2018. updated on 31.07.2026
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require("../../libs/content.builder");
const appConst = require('../../libs/app_const');
const EditPermissionsGeneralStep = require('../../page_objects/permissions/edit.permissions.general.step');
const EditPermissionsSummaryStep = require('../../page_objects/permissions/edit.permissions.summary.step');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const DetailsWidgetPermissionsSection = require('../../page_objects/browsepanel/detailspanel/details.widget.permissions.section');
const WizardContextPanel = require('../../page_objects/wizardpanel/details/wizard.context.window.panel');

describe('wizard.update.permissions.spec: update permissions and check the state of Save button in the wizard toolbar', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }
    const DISPLAY_NAME = contentBuilder.generateRandomName('folder');

    it(`GIVEN wizard for a root-folder has been opened WHEN 'Edit Permissions' dialog has been opened THEN 'Copy From Project' button should be disabled`,
        async () => {
            let editPermissionsGeneralStep = new EditPermissionsGeneralStep();
            let userAccessWidget = new DetailsWidgetPermissionsSection();
            let contentWizard = new ContentWizard();
            let wizardContextPanel = new WizardContextPanel();
            // 1. Open new folder-wizard,
            await studioUtils.openContentWizard(appConst.contentTypes.FOLDER);
            await contentWizard.openContextWindow();
            await wizardContextPanel.openDetailsWidget();
            // 2. Open 'Edit Permissions' dialog:
            await userAccessWidget.clickOnEditPermissionsLinkAndWaitForDialog();
            // 3. 'Copy from project' button should not be:
            await editPermissionsGeneralStep.waitForCopyFromProjectButtonNotDisplayed();
            await editPermissionsGeneralStep.waitForNextButtonDisabled();
            // 4. Verify that 'Public' radio is selected by default:
            let isSelected = await editPermissionsGeneralStep.isPublicRadioSelected();
            assert.ok(isSelected, `'Public' radio should be selected by default`);
            // 5. 'Restricted' radio should be displayed
            await editPermissionsGeneralStep.waitForRestrictedRadioDisplayed();
        });

    it(`WHEN permissions have been updated THEN 'Saved' button remains visible after applying the permissions`,
        async () => {
            let contentWizard = new ContentWizard();
            let editPermissionsGeneralStep = new EditPermissionsGeneralStep();
            let userAccessWidget = new DetailsWidgetPermissionsSection();
            let wizardContextPanel = new WizardContextPanel();
            // 1. Open new folder-wizard, fill in the name input and save it:
            await studioUtils.openContentWizard(appConst.contentTypes.FOLDER);
            await contentWizard.typeDisplayName(DISPLAY_NAME);
            // 2. Save the folder:
            await contentWizard.waitAndClickOnSave();
            await contentWizard.openContextWindow();
            await wizardContextPanel.openDetailsWidget();
            // 3. Open 'Edit Permissions' dialog:
            await userAccessWidget.clickOnEditPermissionsLinkAndWaitForDialog();
            // 4.  Restricted radio has been clicked:
            await editPermissionsGeneralStep.clickOnRestrictedRadioButton();
            await editPermissionsGeneralStep.clickOnNextButton();
            // 5. click on 'Next' button to go to 'Summary' step:
            let editPermissionsSummaryStep = new EditPermissionsSummaryStep();
            await editPermissionsSummaryStep.waitForLoaded();
            let accessModeToUpdate = await editPermissionsSummaryStep.getUpdatedAccessModeText();
            let accessModeBefore = await editPermissionsSummaryStep.getPreviousAccessModeText();
            // 6. click on 'Apply Changes' button:
            await editPermissionsSummaryStep.clickOnApplyChangesButton();
            await editPermissionsSummaryStep.waitForDialogClosed();
            let expectedMessage = appConst.NOTIFICATION_MESSAGES.PERMISSIONS_APPLIED;
            await contentWizard.waitForExpectedNotificationMessage(expectedMessage);
            // 7. Verify that 'Saved' button remains visible after applying the permissions:
            await contentWizard.waitForSavedButtonVisible();
            // 8. Mode should be changed to 'Restricted', so it should be displayed in Summary step
            assert.strictEqual(accessModeToUpdate, appConst.PERMISSIONS_DIALOG.ACCESS_MODE.RESTRICTED,
                'Mode is going to be Restricted in Edit permissions dialog');
            assert.strictEqual(accessModeBefore, appConst.PERMISSIONS_DIALOG.ACCESS_MODE.PUBLIC, `The Mode was 'Public' before`);
        });

    it(`WHEN folder's permissions have been updated in browse panel (Details Panel) THEN 'Save(Disabled)' button should still be present after applying permissions in the grid`,
        async () => {
            let editPermissionsGeneralStep = new EditPermissionsGeneralStep();
            let userAccessWidget = new DetailsWidgetPermissionsSection();
            let contentWizard = new ContentWizard();
            // 1. Select and open the folder:
            await studioUtils.selectAndOpenContentInWizard(DISPLAY_NAME);
            // 2. Go to browse-panel and add the default permissions for 'Audit Log' role
            await studioUtils.doSwitchToContentBrowsePanel();
            await studioUtils.openBrowseDetailsPanel();
            await userAccessWidget.clickOnEditPermissionsLinkAndWaitForDialog();
            await editPermissionsGeneralStep.filterAndSelectPrincipal(appConst.SYSTEM_ROLES.AUDIT_LOG);
            await editPermissionsGeneralStep.clickOnNextButton();
            let editPermissionsSummaryStep = new EditPermissionsSummaryStep();
            await editPermissionsSummaryStep.waitForLoaded();
            // 3. Verify the text in the 'Apply to': 'This item'
            let applyToValue = await editPermissionsSummaryStep.getApplyToText();
            assert.strictEqual(applyToValue, appConst.PERMISSIONS_DIALOG.APPLY_TO.THIS_ITEM, `'This item' should be displayed`);
            let accessMode = await editPermissionsSummaryStep.getAccessModeText();
            assert.strictEqual(accessMode, appConst.PERMISSIONS_DIALOG.ACCESS_MODE.RESTRICTED, 'Restricted mode should be displayed');
            await editPermissionsSummaryStep.clickOnApplyChangesButton();
            await editPermissionsSummaryStep.waitForNotificationMessage();
            await editPermissionsSummaryStep.waitForDialogClosed();
            // 3. Switch to the wizard:
            await studioUtils.switchToContentTabWindow(DISPLAY_NAME);
            // 'Save(Disabled)' button should still be present after applying permissions in browse-panel:
            await contentWizard.waitForSaveButtonVisible();
            await contentWizard.waitForSaveButtonDisabled();
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndNavigateToHome());
    before(async () => {
        if (typeof browser !== 'undefined') {
            await studioUtils.getBrowser().setWindowSize(appConst.BROWSER_WIDTH, appConst.BROWSER_HEIGHT);
        }
        return console.log('specification starting: ' + this.title);
    });
});
