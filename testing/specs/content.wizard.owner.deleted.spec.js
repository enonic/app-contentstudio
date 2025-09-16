/**
 * Created on 08.10.2021
 */
const assert = require('node:assert');
const webDriverHelper = require('../libs/WebDriverHelper');
const appConst = require('../libs/app_const');
const studioUtils = require('../libs/studio.utils.js');
const builder = require('../libs/content.builder');
const ContentWizard = require('../page_objects/wizardpanel/content.wizard.panel');
const UserBrowsePanel = require('../page_objects/users/userbrowse.panel');
const ContentWizardPanel = require('../page_objects/wizardpanel/content.wizard.panel');
const PropertiesWidget = require('../page_objects/browsepanel/detailspanel/properties.widget.itemview');

describe('content.wizard.owner.spec - ui-tests for owner', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }
    const OWNER_REMOVED = 'This user is deleted';

    const FOLDER_NAME = studioUtils.generateRandomName('folder');
    let USER;

    it(`Precondition 1: new system user should be created`,
        async () => {
            // Do Log in with 'SU', navigate to 'Users' and create new user:
            await studioUtils.navigateToUsersApp();
            let userName = builder.generateRandomName('user');
            let roles = [appConst.SYSTEM_ROLES.ADMIN_CONSOLE];
            USER = builder.buildUser(userName, appConst.PASSWORD.MEDIUM, builder.generateEmail(userName), roles);
            await studioUtils.addSystemUser(USER);
            await studioUtils.doCloseAllWindowTabsAndSwitchToHome();
        });

    it("GIVEN wizard for new folder is opened WHEN just created user has been set as owner THEN expected user should be present in the selected option",
        async () => {
            await studioUtils.navigateToContentStudioApp();
            let contentWizard = new ContentWizard();
            let propertiesWidget = new PropertiesWidget();
            // 1. Open new wizard for folder
            await studioUtils.openContentWizard(appConst.contentTypes.FOLDER);
            await contentWizard.typeDisplayName(FOLDER_NAME);
            // 2. Open 'Edit Details' modal dialog:
            await contentWizard.openContextWindow();
            await contentWizard.openDetailsWidget();
            let editDetailsDialog = await studioUtils.openEditSettingDialog();
            await editDetailsDialog.waitForLoaded();
            // 3. Remove the default owner
            await editDetailsDialog.clickOnRemoveOwner('Super User');
            // 4. Select another user in owner-selector
            await editDetailsDialog.filterOptionsAndSelectOwner(USER.displayName);
            await editDetailsDialog.clickOnApplyButton();
            await contentWizard.waitForNotificationMessage();
            // 5. Save the folder content
            await contentWizard.waitAndClickOnSave();
            // 6. Verify that the owner is updated:
            let actualOwner = await propertiesWidget.getOwnerName();
            await studioUtils.saveScreenshot('owner_is_updated_properties_widget');
            assert.equal(actualOwner, USER.displayName, 'Expected user should be in the selected option');
        });

    it("GIVEN Users app is opened WHEN the user has been removed THEN the user should not be displayed in browse panel",
        async () => {
            // 1. navigate to 'Users' and delete the user
            await studioUtils.navigateToUsersApp();
            let userBrowsePanel = new UserBrowsePanel();
            await userBrowsePanel.selectAndDeleteItem(USER.displayName);
            await userBrowsePanel.waitForNotificationMessage();
        });

    it("GIVEN user owner was deleted WHEN the folder is reopened THEN the user should be displayed as 'removed' in the wizard form",
        async () => {
            let contentWizard = new ContentWizard();
            await studioUtils.navigateToContentStudioApp();
            // 1. Open the folder
            await studioUtils.selectAndOpenContentInWizard(FOLDER_NAME);
            // 2. Click on 'Edit Setting':
            await contentWizard.openContextWindow();
            await contentWizard.openDetailsWidget();
            let editSettingsDialog = await studioUtils.openEditSettingDialog();
            // 3. Verify that 'This user is deleted' text appears in the settings form:
            let actualText = await editSettingsDialog.waitForOwnerRemoved();
            assert.equal(actualText, OWNER_REMOVED, "'This user is deleted' - this text should be present in the form");
        });

    // Verify issue https://github.com/enonic/app-contentstudio/issues/4457
    // Content wizard: new content wizard is not loaded when collaboration is enabled #4457
    it(`GIVEN collaboration is enabled in cfg file WHEN folder wizard has been opened by Super User THEN expected collaboration icon should be displayed`,
        async () => {
            let contentWizard = new ContentWizardPanel();
            await studioUtils.navigateToContentStudioApp();
            // 1. Open wizard for new folder:
            await studioUtils.openContentWizard(appConst.contentTypes.FOLDER);
            await studioUtils.saveScreenshot('collaboration_wizard');
            // 2. Verify that collaboration icon is displayed:
            let compactNames = await contentWizard.getCollaborationUserCompactName();
            assert.equal(compactNames[0], 'SU', 'SU user should be displayed in the toolbar');
            assert.equal(compactNames.length, 1, 'One compact name should be displayed');
        });

    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(async () => {
        if (typeof browser !== 'undefined') {
            await studioUtils.getBrowser().setWindowSize(appConst.BROWSER_WIDTH, appConst.BROWSER_HEIGHT);
        }
        return console.log('specification starting: ' + this.title);
    });
});
