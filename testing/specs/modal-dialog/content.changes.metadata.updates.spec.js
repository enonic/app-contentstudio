/**
 * Created on 11.12.2023
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConst = require('../../libs/app_const');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require("../../libs/content.builder");
const ContentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');
const ContentPublishDialog = require('../../page_objects/content.publish.dialog');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const SiteForm = require('../../page_objects/wizardpanel/site.form.panel');

describe('content.changes.metadata.updated, tests to verify the bug #7128', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }
    let SITE;
    const SITE_DESCRIPTION_2 = 'Description 2';

    it(`Precondition: published site should be added`,
        async () => {
            let contentPublishDialog = new ContentPublishDialog();
            let contentBrowsePanel = new ContentBrowsePanel();
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'description 1', [appConst.TEST_APPS_NAME.APP_WITH_CONFIG_OPTION_SET]);
            await studioUtils.doAddReadySite(SITE);
            await studioUtils.findAndSelectItem(SITE.displayName);
            await contentBrowsePanel.clickOnPublishButton();
            await contentPublishDialog.clickOnIncludeChildrenToogler();
            await contentPublishDialog.clickOnPublishNowButton();
            await contentPublishDialog.waitForDialogClosed();
            await contentPublishDialog.waitForNotificationMessage();
        });

    // Verify the issue - Content changes are not saved along with meta-data updates #7128
    // https://github.com/enonic/app-contentstudio/issues/7128
    it(`GIVEN existing sire has been updated WHEN meta-data has been updated THEN 'Save' button remains enabled`,
        async () => {
            let siteForm = new SiteForm();
            let contentWizard = new ContentWizard();
            // 1. Open the existing site:
            await studioUtils.selectAndOpenContentInWizard(SITE.displayName);
            // 2. Update the description:
            await siteForm.typeDescription(SITE_DESCRIPTION_2);
            await contentWizard.openContextWindow();
            await contentWizard.openDetailsWidget();
            let editDetailsDialog = await studioUtils.openEditSettingDialog();
            // 3. Select a language:
            await editDetailsDialog.filterOptionsAndSelectLanguage(appConst.LANGUAGES.EN);
            await editDetailsDialog.clickOnApplyButton();
            // 4. Verify the notification message - Settings for "displayName" are updated
            let actualMessage = await editDetailsDialog.waitForNotificationMessage();
            let expectedMessage = appConst.contentSettingsUpdated(SITE.displayName);
            assert.equal(actualMessage, expectedMessage, 'Settings for the content are updated - this message should be displayed');
            // 5. Verify that 'Save' button remains enabled after updating the meta-data:
            await contentWizard.waitForSaveButtonEnabled();
            // 6. Verify the updated description:
            let actualDescription = await siteForm.getTextInDescriptionTextArea();
            assert.equal(actualDescription, SITE_DESCRIPTION_2, 'Updated description should be visible in the area')
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(async () => {
        if (typeof browser !== 'undefined') {
            await studioUtils.getBrowser().setWindowSize(appConst.BROWSER_WIDTH, appConst.BROWSER_HEIGHT);
        }
        return console.log('specification starting: ' + this.title);
    });
});
