/**
 * Created on 08.10.2021 updated on 13.06.2026
 */
const assert = require('node:assert');
const webDriverHelper = require('../libs/WebDriverHelper');
const appConst = require('../libs/app_const');
const studioUtils = require('../libs/studio.utils.js');
const builder = require('../libs/content.builder');
const ContentWizard = require('../page_objects/wizardpanel/content.wizard.panel');
const ContentWizardPanel = require('../page_objects/wizardpanel/content.wizard.panel');
const DetailsWidgetInfoSection = require('../page_objects/browsepanel/detailspanel/details.widget.info.section');
const DetailsWidgetPermissionsSection = require('../page_objects/browsepanel/detailspanel/details.widget.permissions.section');

describe('content.wizard.owner.spec - ui-tests for owner', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }
    //const OWNER_REMOVED = 'This user is deleted';

    const FOLDER_NAME = studioUtils.generateRandomName('folder');
    let USER;

    it(`Precondition 1: new system user should be created`, async () => {
        // Do Log in with 'SU' and create the new user via the Users GraphQL API:
        await studioUtils.doLogin();
        let userName = builder.generateRandomName('user');
        let roles = [appConst.SYSTEM_ROLES.ADMIN_CONSOLE, 'Default - Owner'];
        USER = builder.buildUser(userName, appConst.PASSWORD.MEDIUM, builder.generateEmail(userName), roles);
        USER = await studioUtils.createSystemUserViaApi(USER);
        await studioUtils.navigateToHomePage();
    });

    it('GIVEN wizard for new folder is opened WHEN just created user has been set as owner THEN expected user should be present in the selected option', async () => {
        await studioUtils.navigateToContentStudioApp();
        let contentWizard = new ContentWizard();
        let detailsWidgetInfoSection = new DetailsWidgetInfoSection();
        // 1. Open new wizard for folder
        await studioUtils.openContentWizard(appConst.contentTypes.FOLDER);
        await contentWizard.typeDisplayName(FOLDER_NAME);
        // 2. Open 'Edit Details' modal dialog:
        let contextWindow = await contentWizard.openContextWindow();
        await contextWindow.waitForWidgetSelected(appConst.WIDGET_SELECTOR_OPTIONS.DETAILS);
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
        let actualOwner = await detailsWidgetInfoSection.getOwnerName();
        await studioUtils.saveScreenshot('owner_is_updated_properties_widget');
        assert.equal(actualOwner, USER.displayName, 'Expected user should be in the selected option');
        await studioUtils.doCloseAllWindowTabsAndNavigateToHome();
    });

    it(`GIVEN collaboration is enabled in cfg file WHEN folder wizard has been opened by Super User THEN New created user should be displayed in the permissions widget`, async () => {
        let detailsWidgetPermissionsSection = new DetailsWidgetPermissionsSection();
        await studioUtils.navigateToContentStudioApp();
        // 1. Open wizard for new folder:
        await studioUtils.selectAndOpenContentInWizard(FOLDER_NAME);
        await studioUtils.saveScreenshot('collaboration_wizard');
        // 2. Verify that collaboration icon is displayed:
        let compactNames = await detailsWidgetPermissionsSection.getPrincipalsCompactName();
        assert.equal(compactNames[0], 'SU', 'SU user should be displayed in the toolbar');
        assert.ok(compactNames[1].includes('US'), 'New created user should be displayed in the permissions widget');
        await studioUtils.doCloseAllWindowTabsAndNavigateToHome();
    });

    it('Precondition 2: the user that was set as the owner should be deleted', async () => {
        // Do Log in with 'SU' and delete the user via the Users GraphQL API:
        await studioUtils.doLogin();
        await studioUtils.deletePrincipalsViaApi(USER.key);
    });

    it("GIVEN user owner was deleted WHEN the folder is reopened THEN the user should be displayed as 'removed' in the wizard form", async () => {
        let contentWizard = new ContentWizard();
        await studioUtils.navigateToContentStudioApp();
        // 1. Open the folder
        await studioUtils.selectAndOpenContentInWizard(FOLDER_NAME);
        // 2. Click on 'Edit Setting':
        await contentWizard.openContextWindow();
        await contentWizard.openDetailsWidget();
        let editSettingsDialog = await studioUtils.openEditSettingDialog();
        // 3. Verify that 'This user is deleted' text appears in the settings form:
        //let actualText = await editSettingsDialog.waitForOwnerRemoved();
        //assert.equal(actualText, OWNER_REMOVED, "'This user is deleted' - this text should be present in the form");
        await studioUtils.doCloseAllWindowTabsAndNavigateToHome();
    });

    // Verify issue https://github.com/enonic/app-contentstudio/issues/4457
    // Content wizard: new content wizard is not loaded when collaboration is enabled #4457
    it(`GIVEN collaboration is enabled in cfg file WHEN folder wizard has been opened by Super User THEN expected collaboration icon should be displayed`, async () => {
        let contentWizard = new ContentWizardPanel();
        await studioUtils.navigateToContentStudioApp();
        // 1. Open wizard for new folder:
        await studioUtils.openContentWizard(appConst.contentTypes.FOLDER);
        await studioUtils.saveScreenshot('collaboration_wizard');
        // 2. Verify that collaboration icon is displayed:
        let compactNames = await contentWizard.getCollaborationUserCompactName();
        assert.equal(compactNames[0], 'SU', 'SU user should be displayed in the toolbar');
        assert.equal(compactNames.length, 1, 'One compact name should be displayed');
        await studioUtils.doCloseAllWindowTabsAndNavigateToHome();
    });

    //afterEach(() => studioUtils.doCloseAllWindowTabsAndNavigateToHome());
    before(async () => {
        if (typeof browser !== 'undefined') {
            await studioUtils.getBrowser().setWindowSize(appConst.BROWSER_WIDTH, appConst.BROWSER_HEIGHT);
        }
        return console.log('specification starting: ' + this.title);
    });
});
