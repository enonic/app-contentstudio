/**
 * Created on 08.10.2021
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../libs/WebDriverHelper');
const appConst = require('../libs/app_const');
const studioUtils = require('../libs/studio.utils.js');
const builder = require('../libs/content.builder');
const ContentWizard = require('../page_objects/wizardpanel/content.wizard.panel');
const SettingsStepForm = require('../page_objects/wizardpanel/settings.wizard.step.form');
const UserBrowsePanel = require('../page_objects/users/userbrowse.panel');


describe('content.wizard.owner.spec - ui-tests for owner', function () {
    this.timeout(appConst.SUITE_TIMEOUT);

    if (typeof browser === "undefined") {
        webDriverHelper.setupBrowser();
    }
    const OWNER_REMOVED = 'This user is deleted';

    const FOLDER_NAME = studioUtils.generateRandomName("folder");
    let USER;

    it(`Precondition 1: new system user should be created`,
        async () => {
            //Do Log in with 'SU', navigate to 'Users' and create new user:
            await studioUtils.navigateToUsersApp();
            let userName = builder.generateRandomName("user");
            let roles = [appConst.SYSTEM_ROLES.ADMIN_CONSOLE];
            USER = builder.buildUser(userName, appConst.PASSWORD.MEDIUM, builder.generateEmail(userName), roles);
            await studioUtils.addSystemUser(USER);
            await studioUtils.doCloseAllWindowTabsAndSwitchToHome();
        });

    it("GIVEN wizard for new folder is opened WHEN just created user has been set as owner THEN expected user should be present in the selected option",
        async () => {
            await studioUtils.navigateToContentStudioApp();
            let contentWizard = new ContentWizard();
            let settingsForm = new SettingsStepForm();
            //1. Open new wizard for folder
            await studioUtils.openContentWizard(appConst.contentTypes.FOLDER);
            await contentWizard.typeDisplayName(FOLDER_NAME);
            //2. Remove the default owner
            await settingsForm.clickOnRemoveOwner("Super User");
            //3. Select another user in owner-selector
            await settingsForm.filterOptionsAndSelectOwner(USER.displayName);
            //4. Save the folder content
            await contentWizard.waitAndClickOnSave();
            //5. Verify that the owner is updated:
            let actualOwner = await settingsForm.getSelectedOwner();
            assert.equal(actualOwner, USER.displayName, "Expected user should be in the selected option");
        });

    it("GIVEN Users app is opened WHEN the user has been removed THEN the user should not be displayed in browse panel",
        async () => {
            //1. navigate to 'Users' and delete the user
            await studioUtils.navigateToUsersApp();
            let userBrowsePanel = new UserBrowsePanel();
            await userBrowsePanel.selectAndDeleteItem(USER.displayName);
            await userBrowsePanel.waitForNotificationMessage();
        });

    it("GIVEN user owner was deleted WHEN the folder is reopened THEN the user should be displayed as 'removed' in the wizard form",
        async () => {
            await studioUtils.navigateToContentStudioApp();
            let settingsForm = new SettingsStepForm();
            //1. Open the folder
            await studioUtils.selectAndOpenContentInWizard(FOLDER_NAME);
            //2. Verify that 'This user is deleted' text appears in the settings form:
            let actualText = await settingsForm.waitForOwnerRemoved();
            assert.equal(actualText, OWNER_REMOVED, "This user is deleted - this text should be present in the form");
        });


    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(() => {
        return console.log('specification is starting: ' + this.title);
    });

});
