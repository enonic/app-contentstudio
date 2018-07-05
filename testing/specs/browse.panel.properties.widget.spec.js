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
const contentWizard = require('../page_objects/wizardpanel/content.wizard.panel');
const studioUtils = require('../libs/studio.utils.js');
const contentBuilder = require("../libs/content.builder");
const propertiesWidget = require('../page_objects/browsepanel/detailspanel/properties.widget.itemview');
const settingsForm = require('../page_objects/wizardpanel/settings.wizard.step.form');


describe('Browse panel, properties widget, language spec`', function () {
    this.timeout(appConstant.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();
    let TEST_FOLDER;
    it(`GIVEN existing folder with language WHEN the folder has been selected and 'Details Panel' opened THEN expected language should be displayed on the widget`,
        () => {
            let displayName = contentBuilder.generateRandomName('folder');
            TEST_FOLDER = contentBuilder.buildFolder(displayName, null, 'English (en)');
            return studioUtils.doAddFolder(TEST_FOLDER).then(() => {
                return studioUtils.findAndSelectItem(TEST_FOLDER.displayName);
            }).then(() => {
                return studioUtils.openDetailsPanel();
            }).then(() => {
                studioUtils.saveScreenshot("details_panel_language_en");
                return expect(propertiesWidget.getLanguage()).to.eventually.equal('en');
            });
        });

    it(`GIVEN existing folder with language is opened WHEN the language has been removed and 'Details Panel' opened THEN language should not be displayed on the widget`,
        () => {
            return studioUtils.selectContentAndOpenWizard(TEST_FOLDER.displayName).then(() => {
                return settingsForm.clickOnRemoveLanguage();
            }).then(() => {
                return contentWizard.waitAndClickOnSave();
            }).then(() => {
                return studioUtils.doSwitchToContentBrowsePanel();
            }).then(() => {
                return studioUtils.openDetailsPanel();
            }).then(() => {
                studioUtils.saveScreenshot("details_panel_language_removed");
                return expect(propertiesWidget.waitForLanguageNotVisible()).to.eventually.true;
            });
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(() => {
        return console.log('specification is starting: ' + this.title);
    });
});
