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
const wizardDetailsPanel = require('../../page_objects/wizardpanel/details/wizard.details.panel');
const wizardVersionsWidget = require('../../page_objects/wizardpanel/details/wizard.versions.widget');


describe('Shortcut parameters specification', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();
    const PARAM_NAME = "param 1";
    const PARAM_VALUE = "value 1";

    const SHORTCUT_NAME = contentBuilder.generateRandomName('shortcut');

    it(`WHEN shortcut-wizard is opened THEN 'Add Parameter' button should be present`,
        () => {
            return studioUtils.openContentWizard(appConst.contentTypes.SHORTCUT).then(() => {
            }).then(() => {
                return assert.eventually.isTrue(shortcutForm.waitForAddParametersButtonVisible(),
                    "Add Parameters button should be visible");
            });
        });

    it(`GIVEN required data is typed in the wizard AND 'Add Parameters' button has been clicked WHEN 'Save' button has been pressed THEN the content is getting not valid because parameter's inputs are required`,
        () => {
            return studioUtils.openContentWizard(appConst.contentTypes.SHORTCUT).then(() => {
            }).then(() => {
                return contentWizard.typeDisplayName(contentBuilder.generateRandomName('shortcut'));
            }).then(() => {
                return shortcutForm.filterOptionsAndSelectTarget('whale');
            }).then(() => {
                return shortcutForm.clickOnAddParametersButton();
            }).then(() => {
                return contentWizard.waitAndClickOnSave();
            }).then(() => {
                return assert.eventually.isTrue(contentWizard.waitUntilInvalidIconAppears(),
                    "red icon should appear, because the content is getting not valid");
            });
        });

    it(`GIVEN  shortcut-wizard is opened WHEN 'Add Parameters' button has been clicked THEN 2 inputs for parameter should appear AND 'Collapse' link should be present`,
        () => {
            return studioUtils.openContentWizard(appConst.contentTypes.SHORTCUT).then(() => {
            }).then(() => {
                return contentWizard.typeDisplayName(SHORTCUT_NAME);
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
                return shortcutForm.typeParameterName(PARAM_NAME);
            }).then(() => {
                return shortcutForm.typeParameterValue(PARAM_VALUE);
            }).then(() => {
                studioUtils.saveScreenshot("shortcut_parameter_saved");
                return contentWizard.waitAndClickOnSave();
            });
        });

    it(`WHEN existing shortcut with parameters is opened THEN expected parameter should be displayed`,
        () => {
            return studioUtils.selectContentAndOpenWizard(SHORTCUT_NAME).then(() => {
                return shortcutForm.getParameterName();
            }).then(result => {
                assert.isTrue(result == PARAM_NAME, "Expected parameter should be present")
            }).then(() => {
                return shortcutForm.getParameterValue();
            }).then(result => {
                assert.isTrue(result == PARAM_VALUE, "Expected value of the parameter should be present");
            });
        });

    it(`GIVEN existing shortcut with parameters is opened WHEN the parameter has been removed THEN 'Add Parameters' button should appear`,
        () => {
            return studioUtils.selectContentAndOpenWizard(SHORTCUT_NAME).then(() => {
                return shortcutForm.clickOnRemoveParameterButton();
            }).then(() => {
                return contentWizard.waitAndClickOnSave();
            }).then(() => {
                studioUtils.saveScreenshot("shortcut_parameter_removed");
                return shortcutForm.waitForParametersFormNotVisible();
            }).then(result => {
                assert.isTrue(result, "parameters form should not  be present");
            }).then(() => {
                return assert.eventually.isTrue(shortcutForm.waitForAddParametersButtonVisible(),
                    "Add Parameters button should be visible");
            });
        });

    it(`GIVEN existing shortcut is opened(parameter is removed) WHEN rollback the previous version THEN expected parameter should appear`,
        () => {
            return studioUtils.selectContentAndOpenWizard(SHORTCUT_NAME).then(() => {
                return contentWizard.openDetailsPanel();
            }).then(() => {
                return wizardDetailsPanel.openVersionHistory();
            }).then(() => {
                return wizardVersionsWidget.waitForVersionsLoaded();
            }).then(() => {
                return wizardVersionsWidget.clickAndExpandVersion(1);
            }).then(result => {
                studioUtils.saveScreenshot("shortcut_version_selected");
                return wizardVersionsWidget.clickOnRestoreThisVersion();
            }).pause(2000).then(() => {
                studioUtils.saveScreenshot("shortcut_parameter_version_rollback");
                return shortcutForm.getParameterName();
            }).then(result => {
                assert.isTrue(result == PARAM_NAME, "Expected parameter should be present")
            }).then(() => {
                return shortcutForm.getParameterValue();
            }).then(result => {
                assert.isTrue(result == PARAM_VALUE, "Expected value of the parameter should be present");
            });
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(() => {
        return console.log('specification is starting: ' + this.title);
    });
});