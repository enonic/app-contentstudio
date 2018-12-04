/**
 * Created on 04.10.2018.
 */
const chai = require('chai');
chai.use(require('chai-as-promised'));
const expect = chai.expect;
const assert = chai.assert;
const webDriverHelper = require('../libs/WebDriverHelper');
const appConstant = require('../libs/app_const');
const contentBrowsePanel = require('../page_objects/browsepanel/content.browse.panel');
const studioUtils = require('../libs/studio.utils.js');
const contentBuilder = require("../libs/content.builder");
const xDataHtmlArea = require('../page_objects/wizardpanel/xdata.htmlarea.wizard.step.form');
const xDataTextArea = require('../page_objects/wizardpanel/xdata.textarea.wizard.step.form');
const contentWizard = require('../page_objects/wizardpanel/content.wizard.panel');
const detailsPanel = require('../page_objects/wizardpanel/details/wizard.details.panel');
const versionsWidget = require('../page_objects/wizardpanel/details/wizard.versions.widget');

describe('content.xdata.textarea.spec:  enable/disable x-data with textarea(htmlarea), type a text in the textarea`', function () {
    this.timeout(appConstant.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();
    let SITE;
    let contentName = contentBuilder.generateRandomName('test');
    let TEST_TEXT = 'test text';
    let X_DATA_STEP_WIZARD = 'Html Area x-data';

    it(`Preconditions: WHEN site with content types has been added THEN the site should be present in the grid`,
        () => {
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'description', [appConstant.APP_CONTENT_TYPES]);
            return studioUtils.doAddSite(SITE).then(() => {
            }).then(() => {
                return studioUtils.findAndSelectItem(SITE.displayName);
            }).then(() => {
                return contentBrowsePanel.waitForContentDisplayed(SITE.displayName);
            }).then(isDisplayed => {
                assert.isTrue(isDisplayed, 'site should be present in the grid');
            });
        });

    // verifies https://github.com/enonic/app-contentstudio/issues/487
    //Inactive optional x-data should not be visible in the Content Wizard navigation bar
    it(`WHEN site with optional x-data has been opened THEN step for the x-data  should not be present on the navigation bar`,
        () => {
            return studioUtils.openContentInWizard(SITE.displayName).then(() => {
            }).then(() => {
                return contentWizard.waitForWizardStepPresent(X_DATA_STEP_WIZARD);
            }).then(isDisplayed => {
                assert.isFalse(isDisplayed, 'Inactive optional x-data should not be visible in the Content Wizard navigation bar');
            });
        });
    // verifies https://github.com/enonic/app-contentstudio/issues/487
    //Inactive optional x-data should not be visible in the Content Wizard navigation bar
    it(`GIVEN site with optional x-data is opened WHEN x-data has been activated THEN x-data should be visible in the Content Wizard navigation bar`,
        () => {
            return studioUtils.openContentInWizard(SITE.displayName).then(() => {
            }).then(() => {
                return contentWizard.clickOnXdataToggler();
            }).then(() => {
                return contentWizard.waitForWizardStepPresent(X_DATA_STEP_WIZARD);
            }).then(isDisplayed => {
                assert.isTrue(isDisplayed,
                    'optional x-data should be visible in the Content Wizard navigation bar, because it was activated');
            });
        });

    //verifies "https://github.com/enonic/app-contentstudio/issues/467" (Incorrect validation inside X-data with ItemSet and htmlArea)
    it(`GIVEN existing site with optional x-data(html-area) WHEN x-data has been activated AND Save button pressed THEN content is getting invalid`,
        () => {
            return studioUtils.selectContentAndOpenWizard(SITE.displayName).then(() => {
                //x-data (required html-area) is added
                return contentWizard.clickOnXdataToggler();
            }).then(() => {
                //site has been saved
                return contentWizard.waitAndClickOnSave();
            }).then(() => {
                return contentWizard.waitUntilInvalidIconAppears();
            }).then(result => {
                studioUtils.saveScreenshot('activated_xdata_required_htmlarea_empty');
                assert.isTrue(result, 'Red icon should be present in the site-wizard, because required html-area in x-data is empty');
            });
        });

    it(`GIVEN existing site with optional x-data(html-area) WHEN text has been typed in x-data (required htmlarea) AND Save button pressed THEN content is getting valid`,
        () => {
            return studioUtils.selectContentAndOpenWizard(SITE.displayName).then(() => {
                // text typed in x-data(htmlarea)
                return xDataHtmlArea.typeTextInHtmlArea("Hello World");
            }).then(() => {
                //site has been saved
                return contentWizard.waitAndClickOnSave();
            }).then(() => {
                return contentWizard.waitUntilInvalidIconDisappears();
            }).then(result => {
                studioUtils.saveScreenshot('xdata_required_htmlarea_filled');
                assert.isTrue(result,
                    'Red icon should not be present in the site-wizard, because required html-area in x-data is not empty');
            });
        });


    it(`GIVEN content with optional x-data is opened WHEN x-data toggler has been clicked THEN x-data form should be added and text area should be visible`,
        () => {
            return studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, ':double0_0').then(() => {
                return contentWizard.typeDisplayName(contentName);
            }).then(() => {
                return contentWizard.waitForXdataTogglerVisible();
            }).then(() => {
                return contentWizard.clickOnXdataToggler();
            }).then(() => {
                return contentWizard.waitAndClickOnSave();
            }).then(() => {
                return xDataTextArea.waitForTextAreaVisible();
            }).then(result => {
                studioUtils.saveScreenshot('xdata_enabled_textarea');
                assert.isTrue(result, 'x-data form should be added and text area should be visible');
            }).then(() => {
                return contentWizard.waitUntilInvalidIconAppears();
            }).then(result => {
                assert.isTrue(result, 'Red icon should be present in the wizard, because text-area is required input in x-data');
            });
        });
    it(`GIVEN existing content with enabled x-data is opened WHEN x-data toggler has been clicked THEN x-data form should be hidden and content is getting valid`,
        () => {
            return studioUtils.selectContentAndOpenWizard(contentName).then(() => {
                return contentWizard.clickOnXdataToggler();
            }).then(() => {
                return contentWizard.waitAndClickOnSave();
            }).then(() => {
                //x-data is disabled now and 'text area' is getting hidden
                return xDataTextArea.waitForTextAreaNotVisible();
            }).then(result => {
                studioUtils.saveScreenshot('xdata_has_been_disabled');
                assert.isTrue(result, 'x-data form should be disabled and text area should be not visible');
            }).then(() => {
                return contentWizard.waitUntilInvalidIconDisappears();
            }).then(result => {
                assert.isTrue(result, 'Red icon should not be present in the wizard, because x-data is disabled now');
            });
        });

    it(`GIVEN existing content with enabled x-data is opened WHEN text typed in x-data form THEN content is getting valid`,
        () => {
            return studioUtils.selectContentAndOpenWizard(contentName).then(() => {
                return contentWizard.clickOnXdataToggler();
            }).then(() => {
                return xDataTextArea.typeText(TEST_TEXT);
            }).then(() => {
                return contentWizard.waitAndClickOnSave();
            }).then(() => {
                return contentWizard.waitUntilInvalidIconDisappears();
            }).then(result => {
                studioUtils.saveScreenshot('xdata_text_typed');
                assert.isTrue(result, 'Red icon should not be present in the wizard, because required text-area in x-data is not empty');
            });
        });

    it(`GIVEN text is present in  textarea AND x-data has been disabled AND content saved WHEN x-data has been enabled again THEN text-area in x-data should be cleared, when x-data was disabled and the content was saved`,
        () => {
            return studioUtils.selectContentAndOpenWizard(contentName).then(() => {
                //x-data form has been disabled
                return contentWizard.clickOnXdataToggler();
            }).then(() => {
                return contentWizard.waitAndClickOnSave();
            }).then(() => {
                //x-data form has been enabled again
                return contentWizard.clickOnXdataToggler();
            }).then(() => {
                return xDataTextArea.getTextInTextArea();
            }).then(result => {
                studioUtils.saveScreenshot('xdata_textarea_should_be_cleared');
                assert.isTrue(result == '', 'text-area in x-data should be cleared, when x-data was disabled and the content was saved');
            }).then(() => {
                return assert.eventually.isTrue(contentWizard.waitUntilInvalidIconAppears(),
                    "Red icon should be present in the wizard, because text-area is required input");
            })
        });

    it(`GIVEN existing content with x-data is opened WHEN version of the content when text is present in the textarea has been restored THEN text should appear in the area`,
        () => {
            return studioUtils.selectContentAndOpenWizard(contentName).then(() => {
                //open details panel
                return contentWizard.openDetailsPanel();
            }).pause(500).then(() => {
                //open versions widget
                return detailsPanel.openVersionHistory();
            }).then(() => {
                return versionsWidget.clickAndExpandVersion(1);
            }).then(() => {
                return versionsWidget.clickOnRestoreThisVersion();
            }).pause(2000).then(() => {
                studioUtils.saveScreenshot('xdata_text_in_textarea_restored');
                return xDataTextArea.getTextInTextArea();
            }).then(result => {
                assert.isTrue(result == TEST_TEXT, 'Required text should appear in the textarea in x-data');
            })
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
});
