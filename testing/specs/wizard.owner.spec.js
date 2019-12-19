/**
 * Created on 19.12.2019.
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../libs/WebDriverHelper');
const appConst = require('../libs/app_const');
const studioUtils = require('../libs/studio.utils.js');
const contentBuilder = require("../libs/content.builder");
const ContentWizard = require('../page_objects/wizardpanel/content.wizard.panel');
const WizardVersionsWidget = require('../page_objects/wizardpanel/details/wizard.versions.widget');
const SettingsStepForm = require('../page_objects/wizardpanel/settings.wizard.step.form');
const ContentBrowsePanel = require('../page_objects/browsepanel/content.browse.panel');

describe('wizard.mark.as.ready.spec - publishes and unpublishes single folder in wizard`', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();
    let TEST_FOLDER;

    it(`Preconditions: test folder should be added`,
        async () => {
            let displayName = contentBuilder.generateRandomName('folder');
            TEST_FOLDER = contentBuilder.buildFolder(displayName);
            await studioUtils.doAddFolder(TEST_FOLDER);
        });

    it(`GIVEN existing folder is opened ADN owner is updated WHEN the previous version has been reverted THEN initial owner should be restored`,
        async () => {
            let contentWizard = new ContentWizard();
            let wizardVersionsWidget = new WizardVersionsWidget();
            let settingsForm = new SettingsStepForm();
            //1. Open existing folder:
            await studioUtils.selectAndOpenContentInWizard(TEST_FOLDER.displayName);
            //2. Change the owner to 'Anonymous User':
            await settingsForm.clickOnRemoveOwner("Super User");
            await settingsForm.filterOptionsAndSelectOwner('Anonymous User');
            await contentWizard.waitAndClickOnSave();
            //3. Open versions widget and revert the previous version:
            await contentWizard.openVersionsHistoryPanel();
            await wizardVersionsWidget.clickAndExpandVersion(1);
            await wizardVersionsWidget.clickOnRevertButton();
            //4. Super User should be in owner form after reverting the previous version:
            let actualOwner = await settingsForm.getSelectedOwner();
            assert.equal(actualOwner, "Super User", "Super User should appears after the reverting of the previous version");
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(() => {
        return console.log('specification is starting: ' + this.title);
    });
});
