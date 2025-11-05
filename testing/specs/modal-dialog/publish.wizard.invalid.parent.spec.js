/**
 * Created on 31.03.2023
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const ContentPublishDialog = require('../../page_objects/content.publish.dialog');
const appConst = require('../../libs/app_const');
const ContentWizardPanel = require('../../page_objects/wizardpanel/content.wizard.panel');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const SiteFormPanel = require('../../page_objects/wizardpanel/site.form.panel');

describe('publish.wizard.invalid.parent.spec - test for dependent required items', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }

    const SITE_NAME = appConst.generateRandomName('site');
    const MIXINS_NAME = 'Html Area mixins';

    it("Precondition: new invalid site should be added",
        async () => {
            let contentWizard = new ContentWizardPanel();
            let siteFormPanel = new SiteFormPanel();
            await studioUtils.openContentWizard(appConst.contentTypes.SITE);
            await contentWizard.typeDisplayName(SITE_NAME);
            await siteFormPanel.filterOptionsAndSelectApplication(appConst.TEST_APPS_NAME.APP_CONTENT_TYPES);
            await contentWizard.clickOnMixinsTogglerByName(MIXINS_NAME);
            await contentWizard.waitAndClickOnSave();
            await contentWizard.waitForNotificationMessage();
            await studioUtils.doCloseWizardAndSwitchToGrid();
        });

    it("GIVEN 'Publish wizard' is opened in folder-wizard WHEN the folder's parent content is invalid THEN 'Exclude invalid items' button should not be displayed in the dialog",
        async () => {
            let contentWizard = new ContentWizard();
            let contentPublishDialog = new ContentPublishDialog();
            // 1. Select the site and open wizard for new folder:
            await studioUtils.selectSiteAndOpenNewWizard(SITE_NAME, appConst.contentTypes.FOLDER);
            await contentWizard.typeDisplayName(appConst.generateRandomName('folder'));
            // 2. Click on Mark as ready button in the wizard toolbar:
            await contentWizard.clickOnMarkAsReadyButton();
            // 3. Verify that 'Publish Wizard' is loaded:
            await contentPublishDialog.waitForDialogOpened();
            // 4. Verify that 'Mark as ready' button is not displayed in the modal dialog:
            await contentPublishDialog.waitForMarkAsReadyButtonNotDisplayed();
            // 5. 'Publish now' button should be disabled:
            await contentPublishDialog.waitForPublishNowButtonDisabled();
            // 6. 'Exclude invalid items' button  should not be displayed because the parent invalid site is required for publishing:
            await contentPublishDialog.waitForExcludeInvalidItemsButtonNotDisplayed();
            // 7. 'All' checkbox should be disabled:
            await contentPublishDialog.waitForAllDependantsCheckboxDisabled();
            // 8. Verify that only one invalid item is displayed in the Dialog State Bar:
            let result = await contentPublishDialog.getNumberOfInvalidItems();
            assert.equal(result, '(1)', 'One invalid item should be present in the state baer');
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
