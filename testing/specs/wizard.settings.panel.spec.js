/**
 * Created on 18.10.2021
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../libs/WebDriverHelper');
const ContentWizard = require('../page_objects/wizardpanel/content.wizard.panel');
const studioUtils = require('../libs/studio.utils.js');
const appConst = require('../libs/app_const');
const PropertiesWidget = require('../page_objects/browsepanel/detailspanel/properties.widget.itemview');
const EditDetailsDialog = require('../page_objects/details_panel/edit.details.dialog');

describe('wizard.setting.panel.spec:  test for Owner and Language selectors', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }
    const DISPLAY_NAME = appConst.generateRandomName('folder');

    it(`WHEN folder-wizard is opened THEN 'Save' button should be disabled`,
        async () => {
            let editDetailsDialog = new EditDetailsDialog();
            let propertiesWidget = new PropertiesWidget();
            // 1. Open new wizard for folder:
            await studioUtils.openContentWizard(appConst.contentTypes.FOLDER);
            // 2. Open 'Edit Details' modal dialog:
            await propertiesWidget.clickOnEditPropertiesButton();
            await editDetailsDialog.waitForLoaded();
            let actualOwner = await editDetailsDialog.getSelectedOwner();
            // 3. Verify that owner is "Super User" and a language is not selected
            assert.equal(actualOwner, appConst.systemUsersDisplayName.SUPER_USER, 'Expected owner should be present');
            // 4. Language filter input should be displayed:
            await editDetailsDialog.waitForLanguageOptionsFilterDisplayed()
        });

    it(`WHEN folder-wizard is opened WHEN a language has been selected THEN the same language should be present in the details panel`,
        async () => {
            let contentWizard = new ContentWizard();
            let editDetailsDialog = new EditDetailsDialog();
            let propertiesWidget = new PropertiesWidget();
            // 1. Open new folder wizard
            await studioUtils.openContentWizard(appConst.contentTypes.FOLDER);
            await contentWizard.openDetailsPanel();
            await contentWizard.typeDisplayName(DISPLAY_NAME);
            // 2. Open 'Edit Details' modal dialog and select the language:
            await propertiesWidget.clickOnEditPropertiesButton();
            await editDetailsDialog.waitForLoaded();
            // 3. Select the language then click on Apply button and close the dialog:
            await editDetailsDialog.filterOptionsAndSelectLanguage('English (en)');
            await editDetailsDialog.clickOnApplyButton();
            await contentWizard.waitForNotificationMessage();
            await contentWizard.pause(300);
            // 4. Click on 'Save' button:
            await contentWizard.waitAndClickOnSave();
            // 3. Verify that expected language should be displayed in Details Panel
            let actualLanguage = await propertiesWidget.getLanguage();
            assert.equal(actualLanguage, 'en', 'expected language should be present in the widget');
        });

    it(`WHEN existing folder is opened WHEN a language has been removed THEN the language should not be displayed in the properties widget`,
        async () => {
            let editDetailsDialog = new EditDetailsDialog();
            let propertiesWidget = new PropertiesWidget();
            // 1. existing folder is opened:
            await studioUtils.selectAndOpenContentInWizard(DISPLAY_NAME);
            // 2. Open 'Edit Details' modal dialog and select the language:
            await propertiesWidget.clickOnEditPropertiesButton();
            await editDetailsDialog.waitForLoaded();
            // 3. Remove the selected language:
            await editDetailsDialog.clickOnRemoveLanguage();
            await editDetailsDialog.clickOnApplyButton();
            // 4. Verify that 'language property' is not displayed in the properties widget now:
            await propertiesWidget.waitForLanguageNotVisible();
        });

    it(`WHEN folder-wizard is opened WHEN the default owner has been removed THEN owner property gets not visible in the property widget`,
        async () => {
            let contentWizard = new ContentWizard();
            let editDetailsDialog = new EditDetailsDialog();
            let propertiesWidget = new PropertiesWidget();
            // 1. Open wizard for new folder:
            await studioUtils.openContentWizard(appConst.contentTypes.FOLDER);
            // 2. Verify the owner property in the widget
            await contentWizard.openDetailsPanel();
            await propertiesWidget.waitForOwnerDisplayed();
            // 3. default owner has been removed
            await propertiesWidget.clickOnEditPropertiesButton();
            await editDetailsDialog.waitForLoaded();
            await editDetailsDialog.clickOnRemoveOwner();
            // 4. Click on Apply button:
            await editDetailsDialog.clickOnApplyButton();
            // 5. Verify that 'owner property' is not displayed in the properties-widget now
            await propertiesWidget.waitForOwnerNotVisible();
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
