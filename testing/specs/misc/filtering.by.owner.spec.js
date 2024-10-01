/**
 * Created on 24.05.2022
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConst = require('../../libs/app_const');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require("../../libs/content.builder");
const FilterPanel = require('../../page_objects/browsepanel/content.filter.panel');
const ContentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');
const ContentWizardPanel = require('../../page_objects/wizardpanel/content.wizard.panel');

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
            let userName = contentBuilder.generateRandomName('user');
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
            await studioUtils.saveScreenshot('collaboration_wizard_user');
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

    it("GIVEN SU is logged in WHEN Filter Panel has been opened THEN owner-selector should be present in aggregations view",
        async () => {
            let filterPanel = new FilterPanel();
            // 1. SU is logged in:
            await studioUtils.navigateToContentStudioApp('su', 'password');
            // 2. Open Filter Panel
            await studioUtils.openFilterPanel();
            // 3. Click on dropdown handle for 'Owner selector' in the Filter Panel:
            await filterPanel.clickOnOwnerDropdownHandle();
            await studioUtils.saveScreenshot('owner_selector_expanded');
            // 4. Verify that expected options should be present in the options:
            let options = await filterPanel.getOwnerNameInSelector();
            assert.ok(options.includes('Me'), "'Me' user should be displayed in options");
            assert.ok(options.includes(USER.displayName), 'Expected user should be displayed in options');
            await studioUtils.doCloseAllWindowTabsAndSwitchToHome();
            await studioUtils.doLogout();
        });

    it("WHEN existing user has been selected in 'Owner' selector in Filter Panel THEN only the content that were created by this user should be present in the grid",
        async () => {
            let filterPanel = new FilterPanel();
            let contentBrowsePanel = new ContentBrowsePanel();
            // 1. SU is logged in:
            await studioUtils.navigateToContentStudioApp('su', 'password');
            // 2. Open Filter Panel
            await studioUtils.openFilterPanel();
            // 3. Select the existing user in Owner selector:
            await filterPanel.filterAndSelectOwnerOption(USER.displayName);
            await filterPanel.pause(2000);
            await studioUtils.saveScreenshot('owner_selected_in_selector');
            // 4. Verify that only content that were created by the user are displayed in Grid
            let contentNames = await contentBrowsePanel.getDisplayNamesInGrid();
            assert.ok(contentNames.includes(FOLDER.displayName));
            assert.equal(contentNames.length, 3, 'Only three items should be present in the grid');
            await studioUtils.doCloseAllWindowTabsAndSwitchToHome();
            await studioUtils.doLogout();
        });

    it("WHEN existing user has been selected in 'Modified by' selector THEN only the content that were modified by this user should be present in the grid",
        async () => {
            let filterPanel = new FilterPanel();
            let contentBrowsePanel = new ContentBrowsePanel();
            // 1. SU is logged in:
            await studioUtils.navigateToContentStudioApp('su', 'password');
            // 2. Open 'Filter Panel'
            await studioUtils.openFilterPanel();
            // 3. Select the existing user in 'Modified by' selector:
            await filterPanel.filterAndSelectLastModifiedByOption(USER.displayName);
            await filterPanel.pause(2000);
            await studioUtils.saveScreenshot('modified_by_selected_in_selector');
            // 4. Verify that content modified by the user are displayed in Browse panel
            let contentNames = await contentBrowsePanel.getDisplayNamesInGrid();
            assert.ok(contentNames.includes(FOLDER.displayName));
            assert.equal(contentNames.length, 3, 'Only three items should be present in the grid');

            await studioUtils.doCloseAllWindowTabsAndSwitchToHome();
            await studioUtils.doLogout();
        });

    it("GIVEN 'Last Modified by' selector is expanded WHEN checkbox for the user has been unchecked in List Options THEN 'Clear Filter' icon gets not visible",
        async () => {
            let filterPanel = new FilterPanel();
            let contentBrowsePanel = new ContentBrowsePanel();
            // 1. SU is logged in:
            await studioUtils.navigateToContentStudioApp('su', 'password');
            // 2. Open 'Filter Panel'
            await studioUtils.openFilterPanel();
            // 3. Select the existing user in 'Last Modified by' dropdown selector:
            await filterPanel.filterAndSelectLastModifiedByOption(USER.displayName);
            // 4. Expand the dropdown
            await filterPanel.clickOnLastModifiedByDropdownHandle();
            // 5. Verify that the checkbox is checked:
            let isChecked = await filterPanel.isCheckedInLastModifiedByListOptions(USER.displayName);
            assert.ok(isChecked, "This checkbox should be checked in the dropdown");
            await studioUtils.saveScreenshot('modified_by_selected_dropdown_expanded');
            // 6. Uncheck the checkbox in the lidy-options:
            await filterPanel.uncheckItemInLastModifiedByListBox(USER.displayName);
            // 7. Verify that 'Clear Filter' icon is not visible in Filter Panel ( top right)
            await filterPanel.waitForClearLinkNotDisplayed();

            await studioUtils.doCloseAllWindowTabsAndSwitchToHome();
            await studioUtils.doLogout();
        });

    it("GIVEN an user has been checked in 'Last Modified by' selector WHEN 'Clear Filter' has been clicked THEN the user-checkbox gets unchecked in List Options",
        async () => {
            let filterPanel = new FilterPanel();
            let contentBrowsePanel = new ContentBrowsePanel();
            // 1. SU is logged in:
            await studioUtils.navigateToContentStudioApp('su', 'password');
            // 2. Open 'Filter Panel'
            await studioUtils.openFilterPanel();
            // 3. Select the existing user in 'Last Modified by' dropdown selector:
            await filterPanel.filterAndSelectLastModifiedByOption(USER.displayName);
            await filterPanel.clickOnClearLink();
            // 4. Expand the 'Last Modified by' dropdown
            await filterPanel.clickOnLastModifiedByDropdownHandle();
            await studioUtils.saveScreenshot('modified_by_selected_dropdown_expanded_2');
            // 5. Verify that the checkbox is checked:
            let isChecked = await filterPanel.isCheckedInLastModifiedByListOptions(USER.displayName);
            assert.ok(isChecked === false, "This checkbox should not be checked in the dropdown");
            // 6. 'Clear Filter' icon should not be displayed now
            await filterPanel.waitForClearLinkNotDisplayed();
        });

    before(async () => {
        if (typeof browser !== 'undefined') {
            await studioUtils.getBrowser().setWindowSize(appConst.BROWSER_WIDTH, appConst.BROWSER_HEIGHT);
        }
        return console.log('specification starting: ' + this.title);
    });

});
