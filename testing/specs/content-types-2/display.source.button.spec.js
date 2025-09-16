/**
 * Created on 31.01.2022
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConst = require('../../libs/app_const');
const studioUtils = require('../../libs/studio.utils.js');
const builder = require('../../libs/content.builder');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const HtmlAreaForm = require('../../page_objects/wizardpanel/htmlarea.form.panel');
const contentBuilder = require('../../libs/content.builder');
const SourceCodeDialog = require('../../page_objects/wizardpanel/html.source.code.dialog');
const EditPermissionsGeneralStep = require('../../page_objects/permissions/edit.permissions.general.step');
const EditPermissionsSummaryStep = require('../../page_objects/permissions/edit.permissions.summary.step');
const EditPermissionsChooseApplyChangesStep = require('../../page_objects/permissions/edit.permissions.choose.apply.changes.step');
const SiteFormPanel = require('../../page_objects/wizardpanel/site.form.panel');
const UserAccessWidget = require('../../page_objects/browsepanel/detailspanel/user.access.widget.itemview');

describe('display.source.button.spec - tests for user with Content Manager Expert role and  Display Source button', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }
    let USER;
    let SITE;

    it(`Precondition 1: new user with 'Content Manager Expert' and Author roles should be created`,
        async () => {
            // Do Log in with 'SU', navigate to 'Users' and create new user:
            await studioUtils.navigateToUsersApp();
            let userName = builder.generateRandomName('user');
            let roles = [appConst.SYSTEM_ROLES.ADMIN_CONSOLE, appConst.SYSTEM_ROLES.CM_APP_EXPERT, appConst.SYSTEM_ROLES.CM_APP,
                'Default - Author'];
            USER = builder.buildUser(userName, appConst.PASSWORD.MEDIUM, builder.generateEmail(userName), roles);
            await studioUtils.addSystemUser(USER);
        });

    it('Precondition 2: new site should be created by SU',
        async () => {
            let contentWizard = new ContentWizard();
            let editPermissionsGeneralStep = new EditPermissionsGeneralStep();
            let editPermissionsSummaryStep = new EditPermissionsSummaryStep();
            let editPermissionsChooseApplyChangesStep = new EditPermissionsChooseApplyChangesStep();
            let userAccessWidget = new UserAccessWidget();
            // 1. Do Log in with 'SU':
            await studioUtils.navigateToContentStudioApp();
            // 2. SU creates new site:
            let siteName = appConst.generateRandomName('site');
            SITE = contentBuilder.buildSite(siteName, 'description', [appConst.APP_CONTENT_TYPES]);
            await studioUtils.openContentWizard(appConst.contentTypes.SITE);
            await contentWizard.typeData(SITE);
            // 3. The site should be automatically saved
            await contentWizard.waitForNotificationMessage();
            await contentWizard.pause(500);
            await contentWizard.openContextWindow();
            await contentWizard.openDetailsWidget();
            // 4. Add 'Full access' permissions for the just created user and click on Apply button:
            await userAccessWidget.clickOnEditPermissionsLinkAndWaitForDialog();
            await editPermissionsGeneralStep.filterAndSelectPrincipal(USER.displayName);
            await editPermissionsGeneralStep.showAceMenuAndSelectItem(USER.displayName, appConst.permissions.FULL_ACCESS);
            await editPermissionsGeneralStep.pause(500);
            // 5. Click on 'Next' button: go to 'Choose how to apply changes' step:
            await editPermissionsGeneralStep.clickOnNextButton();
            //6. click on 'Next' button to go to 'Summary' step:
            await editPermissionsChooseApplyChangesStep.waitForLoaded();
            await editPermissionsChooseApplyChangesStep.clickOnNextButton();
            await editPermissionsSummaryStep.waitForLoaded();
            let number = await editPermissionsSummaryStep.getNumberFromApplyChangesButton();
            // 7. click on 'Apply Changes' button:
            await editPermissionsSummaryStep.clickOnApplyChangesButton();
            await editPermissionsSummaryStep.waitForDialogClosed();
            await studioUtils.doCloseAllWindowTabsAndSwitchToHome();
            await studioUtils.doLogout();
            assert.equal(number, 1, "Expected number of changes should be displayed in the button: 1");
        });

    it("GIVEN user with roles 'Author ' and 'Content Manager Expert' is logged in WHEN content with html area has been opened THEN 'Source' button should be displayed in the htmlArea toolbar",
        async () => {
            let htmlAreaForm = new HtmlAreaForm();
            let sourceCodeDialog = new SourceCodeDialog();
            await studioUtils.navigateToContentStudioApp(USER.displayName, appConst.PASSWORD.MEDIUM);
            // 1. Open wizard for new content with htmlArea:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.HTML_AREA_0_1);
            // 2. Verify that 'Source' button is displayed for 'Content Manager Expert'
            await htmlAreaForm.clickOnSourceButton();
            await studioUtils.saveScreenshot('cm_expert_source_button');
            await sourceCodeDialog.waitForDialogLoaded();
        });

    // Verifies issue Edit/Delete icons in the Site configurator should be hidden for non-admin users #3496
    // https://github.com/enonic/app-contentstudio/issues/3496
    it("GIVEN user with roles 'Author' and 'Content Manager Expert' is signing in WHEN existing site has been opened THEN 'Edit configurator' and 'remove application' icons should be hidden",
        async () => {
            let siteFormPanel = new SiteFormPanel();
            await studioUtils.navigateToContentStudioApp(USER.displayName, appConst.PASSWORD.MEDIUM);
            // 1. Open existing site:
            await studioUtils.selectAndOpenContentInWizard(SITE.displayName);
            await studioUtils.saveScreenshot('cm_expert_edit_remove_icons_hidden');
            // 2. 'Edit' icon should be hidden in Site Configurator
            await siteFormPanel.waitForEditApplicationIconNotDisplayed(appConst.APP_CONTENT_TYPES);
            // 3. 'Remove' icon should be hidden
            await siteFormPanel.waitForRemoveApplicationIconNotDisplayed(appConst.APP_CONTENT_TYPES);
            // 4. Verify that the selector is disabled:
            await siteFormPanel.waitForSiteConfiguratorSelectorDisabled();
        });

    afterEach(async () => {
        let title = await studioUtils.getBrowser().getTitle();
        if (title.includes(appConst.CONTENT_STUDIO_TITLE) || title.includes('Users') || title.includes(appConst.TAB_TITLE_PART)) {
            return await studioUtils.doCloseAllWindowTabsAndSwitchToHome();
        }
    });
    before(async () => {
        if (typeof browser !== 'undefined') {
            await studioUtils.getBrowser().setWindowSize(appConst.BROWSER_WIDTH, appConst.BROWSER_HEIGHT);
        }
        return console.log('specification starting: ' + this.title);
    });
});
