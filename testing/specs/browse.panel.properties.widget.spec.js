/**
 * Created on 05.07.2018.
 *
 */
const chai = require('chai');
chai.use(require('chai-as-promised'));
const expect = chai.expect;
const assert = chai.assert;
const webDriverHelper = require('../libs/WebDriverHelper');
const appConstant = require('../libs/app_const');
const ContentWizard = require('../page_objects/wizardpanel/content.wizard.panel');
const studioUtils = require('../libs/studio.utils.js');
const contentBuilder = require("../libs/content.builder");
const PropertiesWidget = require('../page_objects/browsepanel/detailspanel/properties.widget.itemview');
const SettingsForm = require('../page_objects/wizardpanel/settings.wizard.step.form');


describe('Browse panel, properties widget, language spec`', function () {
    this.timeout(appConstant.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();
    let TEST_FOLDER;
    it(`GIVEN existing folder(English (en)) WHEN the folder has been selected and 'Details Panel' opened THEN expected language should be displayed in the widget`,
        async () => {
            let displayName = contentBuilder.generateRandomName('folder');
            TEST_FOLDER = contentBuilder.buildFolder(displayName, null, 'English (en)');
            await studioUtils.doAddFolder(TEST_FOLDER);
            await studioUtils.findAndSelectItem(TEST_FOLDER.displayName);
            await studioUtils.openBrowseDetailsPanel();
            studioUtils.saveScreenshot("details_panel_language_en");
            let propertiesWidget = new PropertiesWidget();

            let actualLanguage = await propertiesWidget.getLanguage();
            assert.equal(actualLanguage, 'en', "expected language should be present in the widget");
        });

    it(`GIVEN existing folder with language is opened WHEN the language has been removed and 'Details Panel' opened THEN language should not be displayed in the widget`,
        async () => {
            let contentWizard = new ContentWizard();
            let propertiesWidget = new PropertiesWidget();
            //1. Open the folder:
            await studioUtils.selectContentAndOpenWizard(TEST_FOLDER.displayName);
            let settingsForm = new SettingsForm();
            //2.remove the language:
            await settingsForm.clickOnRemoveLanguage();
            await contentWizard.waitAndClickOnSave();
            await studioUtils.doSwitchToContentBrowsePanel();
            //3. Open details panel:
            await studioUtils.openBrowseDetailsPanel();

            //4. Language should not be present in the widget now :
            studioUtils.saveScreenshot("details_panel_language_removed");
            await propertiesWidget.waitForLanguageNotVisible();
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(() => {
        return console.log('specification is starting: ' + this.title);
    });
});
