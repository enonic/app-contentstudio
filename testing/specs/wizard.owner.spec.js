/**
 * Created on 19.12.2019.
 */
const assert = require('node:assert');
const webDriverHelper = require('../libs/WebDriverHelper');
const appConst = require('../libs/app_const');
const studioUtils = require('../libs/studio.utils.js');
const contentBuilder = require("../libs/content.builder");
const ContentWizard = require('../page_objects/wizardpanel/content.wizard.panel');
const WizardVersionsWidget = require('../page_objects/wizardpanel/details/wizard.versions.widget');
const PropertiesWidget = require('../page_objects/browsepanel/detailspanel/properties.widget.itemview');

describe('wizard.owner.spec - update and revert owner in wizard`', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }
    let TEST_FOLDER;

    it(`Preconditions: test folder should be added`,
        async () => {
            let displayName = contentBuilder.generateRandomName('folder');
            TEST_FOLDER = contentBuilder.buildFolder(displayName);
            await studioUtils.doAddFolder(TEST_FOLDER);
        });
    // Verifies https://github.com/enonic/app-contentstudio/issues/1201 owner is not refreshed after reverting a version.
    it.skip(`GIVEN existing folder is opened ADN the owner is updated WHEN the previous version has been reverted THEN initial owner should be restored`,
        async () => {
            let contentWizard = new ContentWizard();
            let wizardVersionsWidget = new WizardVersionsWidget();
            let propertiesWidget = new PropertiesWidget();
            // 1. Open existing folder:
            await studioUtils.selectAndOpenContentInWizard(TEST_FOLDER.displayName);
            await contentWizard.openContextWindow();
            await contentWizard.openDetailsWidget();
            let editSettingsDialog = await studioUtils.openEditSettingDialog();
            // 2. Change the owner to 'Anonymous User':
            await editSettingsDialog.clickOnRemoveOwner(appConst.systemUsersDisplayName.SUPER_USER);
            await editSettingsDialog.filterOptionsAndSelectOwner(appConst.systemUsersDisplayName.ANONYMOUS_USER);
            await editSettingsDialog.clickOnApplyButton();
            await contentWizard.waitForNotificationMessage();
            // Save should be disabled after updating owner in properties:
            await contentWizard.waitForSaveButtonDisabled();
            // 3. Open versions widget and revert the previous version:
            await contentWizard.openVersionsHistoryPanel();
            await wizardVersionsWidget.clickAndExpandVersion(1);
            await wizardVersionsWidget.clickOnRestoreButton();
            // 4. Select 'Details' in the dropdown selector:
            await contentWizard.openDetailsWidget();
            await studioUtils.saveScreenshot('owner_after_reverting_version');
            // 5. 'Super User' should be properties widget after reverting the previous version:
            let actualOwner = await propertiesWidget.getOwnerName();
            assert.equal(actualOwner, appConst.systemUsersDisplayName.SUPER_USER, "'Super User' should appears after the reverting of the previous version");
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
