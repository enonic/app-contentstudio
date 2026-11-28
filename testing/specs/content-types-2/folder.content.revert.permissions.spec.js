/**
 * Created on 22.10.2021
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConst = require('../../libs/app_const');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require('../../libs/content.builder');
const EditPermissionsGeneralStep = require('../../page_objects/permissions/edit.permissions.general.step');
const EditPermissionsSummaryStep = require('../../page_objects/permissions/edit.permissions.summary.step');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const WizardVersionsWidget = require('../../page_objects/wizardpanel/details/wizard.versions.widget');
const DetailsWidgetPermissionsSection = require('../../page_objects/browsepanel/detailspanel/details.widget.permissions.section');
const WizardContextPanel = require('../../page_objects/wizardpanel/details/wizard.context.window.panel');

describe(`folder.content.revert.permissions.spec: tests for 'Permissions' version items and restoring a version of a folder with updated permissions`, function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }

    const FOLDER_NAME = contentBuilder.generateRandomName('folder');

    it(`Preconditions: test folder should be added`, async () => {
        let testFolder = contentBuilder.buildFolder(FOLDER_NAME);
        await studioUtils.doAddFolder(testFolder);
    });

    it(`Preconditions: 'en' language should be set for the folder in 'Edit Settings' dialog, so one more 'Edited' version item is created`, async () => {
        let contentWizard = new ContentWizard();
        let wizardContextPanel = new WizardContextPanel();
        // 1. open the existing folder:
        await studioUtils.selectByDisplayNameAndOpenContent(FOLDER_NAME);
        // 2. Open Details Panel widget:
        await contentWizard.openContextWindow();
        await wizardContextPanel.openDetailsWidget();
        // 3. Open 'Edit Settings' dialog, select the 'en' language and click on 'Apply' button:
        let editSettingsDialog = await studioUtils.openEditSettingDialog();
        await editSettingsDialog.filterOptionsAndSelectLanguage(appConst.LANGUAGES.EN);
        await editSettingsDialog.clickOnApplyButton();
        await contentWizard.waitForNotificationMessage();
        await studioUtils.saveScreenshot('folder_language_updated');
    });

    it(`GIVEN existing folder is opened WHEN 'Super User' has been added in 'Edit Permissions' dialog AND the changes have been applied THEN 5 version items should be displayed in Versions Widget AND one of them should be the 'Permissions' item`, async () => {
        let wizardVersionsWidget = new WizardVersionsWidget();
        let contentWizard = new ContentWizard();
        let wizardContextPanel = new WizardContextPanel();
        let userAccessWidget = new DetailsWidgetPermissionsSection();
        let editPermissionsGeneralStep = new EditPermissionsGeneralStep();
        // 1. open the existing folder:
        await studioUtils.selectByDisplayNameAndOpenContent(FOLDER_NAME);
        // 2. Open Details Panel widget:
        await contentWizard.openContextWindow();
        await wizardContextPanel.openDetailsWidget();
        // 3. Open 'Edit Permissions' dialog - click on 'Edit Permissions' link in the details widget:
        await userAccessWidget.clickOnEditPermissionsLinkAndWaitForDialog();
        await editPermissionsGeneralStep.waitForLoaded();
        // 4. Add 'Super User' principal and go to the Summary step:
        await editPermissionsGeneralStep.filterAndSelectPrincipal(appConst.systemUsersDisplayName.SUPER_USER);
        await editPermissionsGeneralStep.clickOnNextButton();
        let editPermissionsSummaryStep = new EditPermissionsSummaryStep();
        await editPermissionsSummaryStep.waitForLoaded();
        // 5. click on 'Apply Changes' button in Summary step and verify the notification message:
        await editPermissionsSummaryStep.clickOnApplyChangesButton();
        await editPermissionsSummaryStep.waitForDialogClosed();
        let expectedMessage = appConst.NOTIFICATION_MESSAGES.PERMISSIONS_APPLIED;
        let actualMessage = await contentWizard.waitForNotificationMessage();
        assert.equal(
            actualMessage,
            expectedMessage,
            `Permissions for 'contentName' are applied -  Message should appear`,
        );
        // 6. open Versions Widget and click on 'Show all activities' checkbox:
        await contentWizard.openVersionsHistoryPanel();
        await wizardVersionsWidget.clickOnShowAllActivitiesCheckbox();
        // 7. Verify that 5 version items are displayed now ('Created', 'Edited', 'Renamed', 'Edited' - language, 'Permissions'):
        let result = await wizardVersionsWidget.countVersionItems();
        await studioUtils.saveScreenshot('number_versions_items_permissions_updated');
        assert.equal(result, 5, 'the number of versions items should be increased by 1');

        // 8. Verify that one 'Permissions' item gets visible in the widget
        let numberItems = await wizardVersionsWidget.countPermissionsUpdatedItems();
        assert.equal(numberItems, 1, `One 'Permissions' item should be present in the widget`);
    });

    it(`GIVEN existing folder with updated permissions is opened AND 'Show all activities' has been checked WHEN 'Permissions' item has been clicked THEN 'Restore' button should not be displayed in the item`, async () => {
        let wizardVersionsWidget = new WizardVersionsWidget();
        let contentWizard = new ContentWizard();
        // 1. open the existing folder:
        await studioUtils.selectByDisplayNameAndOpenContent(FOLDER_NAME);
        // 2. open Versions Widget:
        await contentWizard.openVersionsHistoryPanel();
        // 3. Click on 'Show all activities' checkbox then click on the 'Permissions' item:
        await wizardVersionsWidget.clickOnShowAllActivitiesCheckbox();
        await wizardVersionsWidget.clickOnVersionItemByHeader(appConst.VERSIONS_ITEM_HEADER.PERMISSIONS, 0);
        await wizardVersionsWidget.pause(500);
        // 4. 'Restore' button should not be displayed in the 'Permissions' item:
        await wizardVersionsWidget.waitForRestoreButtonNotDisplayed();
    });

    it(`GIVEN existing folder with updated permissions is opened WHEN the 'Edited' version has been restored THEN 'Super User' should remain in the selected principals in 'Edit Permissions' dialog`, async () => {
        let wizardVersionsWidget = new WizardVersionsWidget();
        let contentWizard = new ContentWizard();
        let editPermissionsDialog = new EditPermissionsGeneralStep();
        let userAccessWidget = new DetailsWidgetPermissionsSection();
        //1. open the existing folder:
        await studioUtils.selectByDisplayNameAndOpenContent(FOLDER_NAME);
        //2. open Versions Widget and restore the 'Edited' version:
        await contentWizard.openVersionsHistoryPanel();
        await wizardVersionsWidget.clickOnVersionItemByHeader('Edited', 0);
        await wizardVersionsWidget.clickOnRestoreButton();
        await contentWizard.waitForNotificationMessage();
        await contentWizard.openDetailsWidget();
        // 3. Open 'Edit Permissions' dialog
        await userAccessWidget.clickOnEditPermissionsLinkAndWaitForDialog();
        await studioUtils.saveScreenshot('acl_entries_after_reverting');
        // 4. Get the selected principals after restoring the version:
        let principals = await editPermissionsDialog.getDisplayNameOfSelectedPrincipals();
        // 5. Verify that 'Super User' principal remains visible in the Edit Permissions dialog:
        assert.ok(
            principals.includes(appConst.systemUsersDisplayName.SUPER_USER),
            'Permissions should not be updated after restoring the version',
        );
    });

    it(`GIVEN existing folder with updated permissions is opened AND 'Show all activities' has been checked WHEN 'Super User' acl-entry has been removed in 'Edit Permissions' dialog AND the changes have been applied THEN the number of version items should be increased AND two 'Permissions' items should be displayed in Versions Widget`, async () => {
        let wizardVersionsWidget = new WizardVersionsWidget();
        let contentWizard = new ContentWizard();
        let editPermissionsGeneralStep = new EditPermissionsGeneralStep();
        let userAccessWidget = new DetailsWidgetPermissionsSection();
        // 1. open the existing folder:
        await studioUtils.selectByDisplayNameAndOpenContent(FOLDER_NAME);
        // 2. open Versions Widget, click on 'Show all activities' checkbox and count the version items:
        await contentWizard.openVersionsHistoryPanel();
        await wizardVersionsWidget.clickOnShowAllActivitiesCheckbox();
        let number1 = await wizardVersionsWidget.countVersionItems();
        await contentWizard.openDetailsWidget();
        // 3. Open 'Edit Permissions' dialog - click on 'Edit Permissions' link in the details widget:
        await userAccessWidget.clickOnEditPermissionsLinkAndWaitForDialog();
        await editPermissionsGeneralStep.waitForLoaded();
        // 4. Remove 'Super User' acl entry and go to the Summary step:
        await editPermissionsGeneralStep.removeAclEntry(appConst.systemUsersDisplayName.SUPER_USER);
        await editPermissionsGeneralStep.clickOnNextButton();
        let editPermissionsSummaryStep = new EditPermissionsSummaryStep();
        await editPermissionsSummaryStep.waitForLoaded();
        // 5. click on 'Apply Changes' button in Summary step:
        await editPermissionsSummaryStep.clickOnApplyChangesButton();
        await editPermissionsSummaryStep.waitForDialogClosed();
        await contentWizard.waitForNotificationMessage();
        // 6. Open Versions Widget again ('Show all activities' remains checked) and verify that the number of version-items is increased:
        await contentWizard.openVersionsHistoryPanel();
        let number2 = await wizardVersionsWidget.countVersionItems();
        await studioUtils.saveScreenshot('number_versions_permissions_updated_2');
        assert.ok(number2 > number1, 'the number of versions should be increased');
        // 7. Verify - 2 items with 'Permissions' header are displayed in the widget:
        let numberItems = await wizardVersionsWidget.countPermissionsUpdatedItems();
        assert.equal(numberItems, 2, "Two 'Permissions' items should be present in the widget");
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
