/**
 * Created on 21.11.2018.
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../libs/WebDriverHelper');
const appConstant = require('../libs/app_const');
const studioUtils = require('../libs/studio.utils.js');
const contentBuilder = require("../libs/content.builder");
const appConst = require('../libs/app_const');
const EditPermissionsDialog = require('../page_objects/edit.permissions.dialog');
const ContentWizard = require('../page_objects/wizardpanel/content.wizard.panel');
const UserAccessWidget = require('../page_objects/browsepanel/detailspanel/user.access.widget.itemview');

describe('wizard.update.permissions.spec: update permissions and check the state of Save button on toolbar',
    function () {
        this.timeout(appConstant.SUITE_TIMEOUT);
        webDriverHelper.setupBrowser();
        let displayName = contentBuilder.generateRandomName('folder');
        let newDisplayName = contentBuilder.generateRandomName('folder');

        it(`GIVEN new folder wizard is opened and the folder is saved WHEN permissions have been updated THEN 'Saved' button should still be present after applying permissions `,
            async () => {
                let contentWizard = new ContentWizard();
                let editPermissionsDialog = new EditPermissionsDialog();
                //1. Open new folder-wizard, fill in the name input and save it:
                await studioUtils.openContentWizard(appConst.contentTypes.FOLDER);
                await contentWizard.typeDisplayName(displayName);
                //2. Save the folder:
                await contentWizard.waitAndClickOnSave();
                //3. Open 'Edit Permissions' dialog:
                await contentWizard.clickOnEditPermissionsButton();
                //4. Uncheck the 'Inherit permissions'
                await editPermissionsDialog.waitForDialogLoaded();
                await editPermissionsDialog.clickOnInheritPermissionsCheckBox();

                //5.  Add default permissions for 'Anonymous user' and click on Apply button:
                await editPermissionsDialog.filterAndSelectPrincipal(appConstant.systemUsersDisplayName.ANONYMOUS_USER);
                await editPermissionsDialog.clickOnApplyButton();

                let expectedMessage = appConstant.permissionsAppliedNotificationMessage(displayName);
                await contentWizard.waitForExpectedNotificationMessage(expectedMessage);
                //Verify that 'Saved' button should not change its state - this button should still be present after applying permissions:
                await contentWizard.waitForSavedButtonVisible();
            });

        //Verifies https://github.com/enonic/app-contentstudio/issues/1916
        //User with insufficient permissions is allowed to make changes to the Project Wizard form #1916
        it(`GIVEN existing folder is opened WHEN display name has been changed AND new permissions applied THEN 'Save' button gets enabled in the wizard-toolbar`,
            async () => {
                let contentWizard = new ContentWizard();
                let editPermissionsDialog = new EditPermissionsDialog();
                await studioUtils.selectAndOpenContentInWizard(displayName);
                //1. Update the display name:
                await contentWizard.typeDisplayName(newDisplayName);
                await contentWizard.clickOnEditPermissionsButton();
                await editPermissionsDialog.waitForDialogLoaded();
                //2. Update permissions(add default permissions for 'Everyone')
                await editPermissionsDialog.filterAndSelectPrincipal(appConstant.systemUsersDisplayName.EVERYONE);
                return editPermissionsDialog.clickOnApplyButton();
                //3. Check the notification message:
                let expectedMessage = appConstant.permissionsAppliedNotificationMessage(displayName);
                await contentWizard.waitForExpectedNotificationMessage(expectedMessage);
                //4.'Save' button gets enabled in the wizard-toolbar:
                await contentWizard.waitForSaveButtonEnabled();
            });

        it(`GIVEN existing content is opened WHEN folder's permissions have been updated in browse panel (Details Panel) THEN 'Save(Disabled)' button should still be present after applying permissions in the grid`,
            async () => {
                let editPermissionsDialog = new EditPermissionsDialog();
                let userAccessWidget = new UserAccessWidget();
                let contentWizard = new ContentWizard();
                //1. Select and open the folder:
                await studioUtils.selectAndOpenContentInWizard(displayName);
                //2. Go to browse-panel and add default permissions for 'Super User'
                await studioUtils.doSwitchToContentBrowsePanel();
                await studioUtils.openBrowseDetailsPanel();
                await userAccessWidget.clickOnEditPermissionsLinkAndWaitForDialog();
                await editPermissionsDialog.filterAndSelectPrincipal(appConstant.systemUsersDisplayName.SUPER_USER);
                await editPermissionsDialog.clickOnApplyButton();
                //3. Go to the wizard:
                    await studioUtils.switchToContentTabWindow(displayName);
                // 'Save(Disabled)' button should still be present after applying permissions in browse-panel:
                await contentWizard.waitForSaveButtonVisible();
                await contentWizard.waitForSaveButtonDisabled();
            });

        beforeEach(() => studioUtils.navigateToContentStudioApp());
        afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
        before(() => {
            return console.log('specification is starting: ' + this.title);
        });
    });
