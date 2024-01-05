/**
 * Created on 24.05.2022
 */
const assert = require('node:assert');
const webDriverHelper = require('../libs/WebDriverHelper');
const appConst = require('../libs/app_const');
const studioUtils = require('../libs/studio.utils.js');
const contentBuilder = require("../libs/content.builder");
const FilterPanel = require('../page_objects/browsepanel/content.filter.panel');
const ContentBrowsePanel = require('../page_objects/browsepanel/content.browse.panel');
const ContentWizardPanel = require('../page_objects/wizardpanel/content.wizard.panel');

describe('filter.by.owner.spec: tests for filtering by', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }
    let USER;
    let FOLDER;
    it(`Precondition 1: new system user should be added`,
        async () => {
            // Do Log in with 'SU', navigate to 'Users' and create new system user:
            await studioUtils.navigateToUsersApp();
            let userName = contentBuilder.generateRandomName("user");
            let roles = [appConst.SYSTEM_ROLES.ADMIN_CONSOLE, appConst.SYSTEM_ROLES.CM_ADMIN];
            USER = contentBuilder.buildUser(userName, appConst.PASSWORD.MEDIUM, contentBuilder.generateEmail(userName), roles);
            await studioUtils.addSystemUser(USER);
            await studioUtils.doCloseAllWindowTabsAndSwitchToHome();
            await studioUtils.doLogout();
        });

    it("GIVEN just created user is logged in WHEN wizard for new folder has been opened THEN expected compact collaboration-name should be displayed in the wizard toolbar",
        async () => {
            let contentWizard = new ContentWizardPanel();
            // 1. user is logged in:
            await studioUtils.navigateToContentStudioApp(USER.displayName, USER.password);
            // 2. Open new folder wizard:
            await studioUtils.openContentWizard(appConst.contentTypes.FOLDER);
            await studioUtils.saveScreenshot("collaboration_wizard_user");
            // 3. Verify that collaboration icon is displayed:
            let compactNames = await contentWizard.getCollaborationUserCompactName();
            assert.equal(compactNames[0], 'US', 'US - this compact name should be displayed in the toolbar');
            assert.equal(compactNames.length, 1, 'One compact name should be displayed');
            await studioUtils.doCloseAllWindowTabsAndSwitchToHome();
            await studioUtils.doLogout();
        });

    it("GIVEN just created user added a folder with En language WHEN wizard for new child folder has been opened THEN 'English' language should be present in the wizard by default",
        async () => {
            // 1. user is logged in:
            await studioUtils.navigateToContentStudioApp(USER.displayName, USER.password);
            let displayName = appConst.generateRandomName('folder');
            // 2. User adds new folder with English language:
            FOLDER = contentBuilder.buildFolder(displayName, null, appConst.LANGUAGES.EN);
            await studioUtils.doAddFolder(FOLDER);
            // 3. Open wizard for new child folder:
            await studioUtils.findAndSelectItem(FOLDER.displayName);
            await studioUtils.openContentWizard(appConst.contentTypes.FOLDER);
            let editSettingsDialog = await studioUtils.openEditSettingDialog();
            await studioUtils.saveScreenshot('child_folder_default_language');
            // 4. Verify language in the wizard for new child folder:
            let language = await editSettingsDialog.getSelectedLanguage();
            assert.equal(language, appConst.LANGUAGES.EN, 'English language should be selected by default in wizard for new child content');
            await studioUtils.doCloseAllWindowTabsAndSwitchToHome();
            await studioUtils.doLogout();
        });

    it("GIVEN SU is logged in WHEN Filter Panel has been opened THEN owner selector should be present in aggregations view",
        async () => {
            let filterPanel = new FilterPanel();
            // 1. SU is logged in:
            await studioUtils.navigateToContentStudioApp('su', 'password');
            // 2. Open Filter Panel
            await studioUtils.openFilterPanel();
            // 3. Click on expand Owner selector in the Filter Panel:
            await filterPanel.clickOnOwnerDropdownHandle();
            await studioUtils.saveScreenshot('owner_selector_expanded');
            // 4. Verify that expected options should be present in the options:
            let options = await filterPanel.getOwnerNameInSelector();
            assert.ok(options.includes('Me'), "'Me' user should be displayed in options");
            assert.ok(options.includes(USER.displayName), 'Expected user should be displayed in options');
            await studioUtils.doCloseAllWindowTabsAndSwitchToHome();
        });

    it("WHEN existing user has been selected in Owner selector THEN only content created by the user should be present in the grid",
        async () => {
            let filterPanel = new FilterPanel();
            let contentBrowsePanel = new ContentBrowsePanel();
            // 1. SU is logged in:
            await studioUtils.navigateToContentStudioApp('su', 'password');
            // 2. Open Filter Panel
            await studioUtils.openFilterPanel();
            // 3. Select the existing user in Owner selector:
            await filterPanel.expandOwnerOptionsAndSelectItem(USER.displayName);
            await filterPanel.pause(2000);
            await studioUtils.saveScreenshot('owner_selected_in_selector');
            // 4. Verify that only content that were created by the user are displayed in Grid
            let contentNames = await contentBrowsePanel.getDisplayNamesInGrid();
            assert.ok(contentNames.includes(FOLDER.displayName));
            assert.equal(contentNames.length, 3, 'Only three items should be present in the grid');
        });
    before(async () => {
        if (typeof browser !== 'undefined') {
            await studioUtils.getBrowser().setWindowSize(appConst.BROWSER_WIDTH, appConst.BROWSER_HEIGHT);
        }
        return console.log('specification starting: ' + this.title);
    });

});
