/**
 * Created on 22.10.2021
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConst = require('../../libs/app_const');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require("../../libs/content.builder");
const EditPermissionsDialog = require('../../page_objects/edit.permissions.dialog');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const WizardVersionsWidget = require('../../page_objects/wizardpanel/details/wizard.versions.widget');

describe('folder.content.revert.spec: tests for reverting of folder content', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();
    let SITE;
    const FOLDER_NAME_1 = contentBuilder.generateRandomName('folder');
    const FOLDER_NAME_2 = contentBuilder.generateRandomName('folder');

    it(`GIVEN wizard for new folder is opened WHEN name has been saved THEN 2 version-items should be present in Versions Widget`,
        async () => {
            let wizardVersionsWidget = new WizardVersionsWidget();
            let contentWizard = new ContentWizard();
            //1. open new wizard and fill in the name input:
            await studioUtils.openContentWizard(appConst.contentTypes.FOLDER);
            await contentWizard.typeDisplayName(FOLDER_NAME_1);

            await contentWizard.openVersionsHistoryPanel();
            let result = await wizardVersionsWidget.countVersionItems();
            assert.equal(result, 1, "One version item should be present in the widget");
            //2. Save the folder and verify that the number of version items increased:
            await contentWizard.waitAndClickOnSave();
            result = await wizardVersionsWidget.countVersionItems();
            await studioUtils.saveScreenshot("number_versions_should_be_2");
            assert.equal(result, 2, "Two version items should be present in the widget");
        });

    it(`GIVEN display name has been updated and saved WHEN the previous version has been reverted THEN the display name should be updated, but the path(name) remains the same`,
        async () => {
            let wizardVersionsWidget = new WizardVersionsWidget();
            let contentWizard = new ContentWizard();
            //1. open new wizard and fill in the name input:
            await studioUtils.selectAndOpenContentInWizard(FOLDER_NAME_1);
            await contentWizard.typeDisplayName(FOLDER_NAME_2);
            //2. Save the content:
            await contentWizard.waitAndClickOnSave();
            let actualPath1 = await contentWizard.getPath();
            //3. Revert the previous version
            await contentWizard.openVersionsHistoryPanel();
            await wizardVersionsWidget.clickAndExpandVersion(1);
            await wizardVersionsWidget.clickOnRevertButton();
            await contentWizard.waitForNotificationMessage();
            let actualDisplayName = await contentWizard.getDisplayName();
            //4. Verify that 'displayName' is reverted
            assert.equal(actualDisplayName, FOLDER_NAME_1, "The previous display name should be reverted");
            //5. Verify that the path(name) is not updated
            let actualPath2 = await contentWizard.getPath();
            assert.equal(actualPath1, actualPath2, "Path remains the same after reverting the previous display name");
            //6. Verify that the number of versions is updated after the reverting
            let numberVersions = await wizardVersionsWidget.countVersionItems();
            await studioUtils.saveScreenshot("number_versions_should_be_increased");
            assert.equal(numberVersions, 4, "The number of version items should be increased after the reverting");
        });

    it(`WHEN new acl-entry is added in wizard and saved THEN the number of versions should not be changed`,
        async () => {
            let wizardVersionsWidget = new WizardVersionsWidget();
            let contentWizard = new ContentWizard();
            let editPermissionsDialog = new EditPermissionsDialog();
            //1. open the existing folder:
            await studioUtils.selectByDisplayNameAndOpenContent(FOLDER_NAME_1);
            //2. open Versions Widget:
            await contentWizard.openVersionsHistoryPanel();
            //2. Open Edit Permissions dialog,  click on 'Access' button in WizardStepNavigatorAndToolbar
            await contentWizard.clickOnEditPermissionsButton();
            //4. Uncheck the 'Inherit permissions'
            await editPermissionsDialog.waitForDialogLoaded();
            await editPermissionsDialog.clickOnInheritPermissionsCheckBox();
            //5. Update the permissions and click on Apply:
            await editPermissionsDialog.filterAndSelectPrincipal(appConst.systemUsersDisplayName.ANONYMOUS_USER);
            await editPermissionsDialog.clickOnApplyButton();
            let expectedMessage = appConst.permissionsAppliedNotificationMessage(FOLDER_NAME_2);
            let actualMessage = await contentWizard.waitForNotificationMessage();
            assert.equal(actualMessage, expectedMessage, "Permissions for 'contentName' are applied -  Message should appear");
            //6. Verify that the number of version-items is not changed:
            let result = await wizardVersionsWidget.countVersionItems();
            await studioUtils.saveScreenshot("number_versions_permissions_updated");
            assert.equal(result, 4, "the number of versions should not be changed");
        });

    it(`GIVEN existing folder is opened WHEN the previous version has been reverted THEN acl entries should not be updated`,
        async () => {
            let wizardVersionsWidget = new WizardVersionsWidget();
            let contentWizard = new ContentWizard();
            let editPermissionsDialog = new EditPermissionsDialog();
            //1. open the existing folder:
            await studioUtils.selectByDisplayNameAndOpenContent(FOLDER_NAME_1);
            //2. open Versions Widget and revert the previous version:
            await contentWizard.openVersionsHistoryPanel();
            await wizardVersionsWidget.clickAndExpandVersion(1);
            await wizardVersionsWidget.clickOnRevertButton();
            await contentWizard.waitForNotificationMessage();
            //2. Open 'Edit Permissions' dialog
            await contentWizard.clickOnEditPermissionsButton();
            await studioUtils.saveScreenshot("acl_entries_after_reverting");
            //3. 'Inherit Permissions' checkbox remains unselected:
            let isSelected = await editPermissionsDialog.isInheritPermissionsCheckBoxSelected();
            assert.isFalse(isSelected, "The checkbox remains unselected after the reverting");
            //3. Verify that Anonymous user is present after reverting the previous version:
            let principals = await editPermissionsDialog.getDisplayNameOfSelectedPrincipals();
            assert.isTrue(principals.includes(appConst.systemUsersDisplayName.ANONYMOUS_USER),
                "Permissions should not be updated after the reverting");

        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(() => {
        return console.log('specification is starting: ' + this.title);
    });
});
