/**
 * Created on 10.10.2018.
 */
const chai = require('chai');
chai.use(require('chai-as-promised'));
const expect = chai.expect;
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const appConst = require('../../libs/app_const');
const contentBuilder = require("../../libs/content.builder");
const shortcutForm = require('../../page_objects/wizardpanel/shortcut.form.panel');
const contentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');


describe('Shortcut parameters specification', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();
    const displayName = contentBuilder.generateRandomName('shortcut');

    it(`WHEN shortcut-wizard is opened THEN 'Add Parameter' button should be present`,
        () => {
            let displayName = contentBuilder.generateRandomName('shortcut');
            let shortcut = contentBuilder.buildShortcut(displayName, appConst.TEST_IMAGES.WHALE);
            return studioUtils.openContentWizard(appConst.contentTypes.SHORTCUT).then(() => {
            }).then(() => {
                return assert.eventually.isTrue(shortcutForm.waitForAddParametersButtonVisible(),
                    "Add Parameters button should be visible");
            });
        });

    it(`GIVEN  shortcut-wizard is opened WHEN 'Add Parameters' button has been clicked THEN 2 inputs for parameter should appear AND 'Collapse' link should be present`,
        () => {

            let shortcut = contentBuilder.buildShortcut(displayName, appConst.TEST_IMAGES.WHALE);
            return studioUtils.openContentWizard(appConst.contentTypes.SHORTCUT).then(() => {
            }).then(() => {
                return contentWizard.typeDisplayName(displayName);
            }).then(() => {
                return shortcutForm.filterOptionsAndSelectTarget('whale');
            }).then(() => {
                return shortcutForm.clickOnAddParametersButton();
            }).then(() => {
                return assert.eventually.isTrue(shortcutForm.waitForAddParametersButtonVisible(),
                    "Add Parameters button should be visible");
            }).then(() => {
                return assert.eventually.isTrue(shortcutForm.waitForCollapseLinkVisible(),
                    "'Collapse' link should be present");
            }).then(() => {
                return assert.eventually.isTrue(shortcutForm.waitForParametersFormVisible(),
                    "Add Parameters button should be visible");
            }).then(() => {
                return shortcutForm.typeParameterName("param 1");
            }).then(() => {
                return shortcutForm.typeParameterValue("value 1");
            }).then(() => {
                studioUtils.saveScreenshot("shortcut_parameter_saved");
                return contentWizard.waitAndClickOnSave();
            });
        });

    it(`WHEN existing shortcut with parameters is opened THEN expected parameter should be displayed`,
        () => {
            return studioUtils.selectContentAndOpenWizard(displayName).then(() => {
                return shortcutForm.getParameterName();
            }).then(result => {
                assert.isTrue(result == "param 1", "Expected parameter should be present")
            }).then(() => {
                return shortcutForm.getParameterValue();
            }).then(result => {
                assert.isTrue(result == "value 1", "Expected value of the parameter should be present");
            });
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(() => {
        return console.log('specification is starting: ' + this.title);
    });
});
