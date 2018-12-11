/**
 * Created on 27.04.2018.
 */
const chai = require('chai');
chai.use(require('chai-as-promised'));
const expect = chai.expect;
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConstant = require('../../libs/app_const');
const contentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require("../../libs/content.builder");
const htmlAreaForm = require('../../page_objects/wizardpanel/htmlarea.form.panel');
const contentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const fullScreenDialog = require('../../page_objects/wizardpanel/html.full.screen.dialog');
const sourceCodeDialog = require('../../page_objects/wizardpanel/html.source.code.dialog');

describe('htmlarea1_0.cke.spec:  html area with CKE`', function () {
    this.timeout(appConstant.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();
    const EXPECTED_TEXT_TEXT1 = '<p>test text</p>';
    const TEXT_TO_TYPE = "test text";
    let SITE;
    let htmlAreaContent;
    it(`WHEN site with content types has been added THEN the site should be listed in the grid`,
        () => {
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'description', [appConstant.APP_CONTENT_TYPES]);
            return studioUtils.doAddSite(SITE).then(() => {
            }).then(() => {
                return studioUtils.findAndSelectItem(SITE.displayName);
            }).then(() => {
                return contentBrowsePanel.waitForContentDisplayed(SITE.displayName);
            }).then(isDisplayed => {
                assert.isTrue(isDisplayed, 'site should be listed in the grid');
            });
        });
    it(`GIVEN wizard for 'htmlArea 0:1' is opened WHEN html area is empty and the content has been saved THEN red icon should not be present, because the input is not required`,
        () => {
            return studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, ':htmlarea0_1').then(() => {
                return contentWizard.typeDisplayName('test_area0_1');
            }).then(() => {
                return contentWizard.waitAndClickOnSave();
            }).pause(1000).then(() => {
                return contentWizard.isContentInvalid();
            }).then(result => {
                studioUtils.saveScreenshot('cke_htmlarea_should_be_valid');
                assert.isFalse(result, EXPECTED_TEXT_TEXT1, 'the content should be valid, because the input is not required');
            });
        });

    it(`GIVEN wizard for 'htmlArea 0:1' is opened WHEN text has been typed THEN the text should be present in the area `,
        () => {
            return studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, ':htmlarea0_1').then(() => {
                return htmlAreaForm.typeTextInHtmlArea(TEXT_TO_TYPE)
            }).pause(1000).then(() => {
                return htmlAreaForm.getTextFromHtmlArea();
            }).then(result => {
                studioUtils.saveScreenshot('cke_htmlarea_0_1');
                assert.equal(result[0], EXPECTED_TEXT_TEXT1, 'expected and actual value should be equals');
            });
        });

    it(`GIVEN wizard for 'htmlArea 0:1' is opened WHEN all data has been typed and saved THEN correct notification message should be displayed `,
        () => {
            let displayName = contentBuilder.generateRandomName('htmlarea');
            htmlAreaContent = contentBuilder.buildHtmlArea(displayName, ':htmlarea0_1', [TEXT_TO_TYPE]);
            return studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, ':htmlarea0_1').pause(1000).then(() => {
                return contentWizard.typeData(htmlAreaContent);
            }).pause(500).then(() => {
                return contentWizard.waitAndClickOnSave();
            }).then(() => {
                let expectedMessage = '\"' + htmlAreaContent.displayName + '\"' + ' is saved';
                return contentWizard.waitForExpectedNotificationMessage(expectedMessage);
            }).then(result => {
                studioUtils.saveScreenshot('content_htmlarea_0_1');
                assert.isTrue(result, 'correct notification message should be displayed');
            });
        });
    it(`GIVEN existing 'htmlArea 0:1' WHEN it has been opened THEN expected text should be displayed in the area`,
        () => {
            return studioUtils.selectContentAndOpenWizard(htmlAreaContent.displayName).then(() => {
                return htmlAreaForm.getTextFromHtmlArea();
            }).then(result => {
                studioUtils.saveScreenshot('htmlarea_0_1_check_value');
                assert.equal(result[0], EXPECTED_TEXT_TEXT1, 'expected and actual strings should be equal');
            });
        });

    it(`GIVEN existing 'htmlArea 0:1' is opened WHEN 'fullscreen' button has been pressed THEN expected text should be present in full screen`,
        () => {
            return studioUtils.selectContentAndOpenWizard(htmlAreaContent.displayName).then(() => {
                return htmlAreaForm.clickOnFullScreenButton();
            }).then(() => {
                return fullScreenDialog.waitForDialogLoaded();
            }).then(() => {
                return fullScreenDialog.getTextFromHtmlArea();
            }).then(result => {
                studioUtils.saveScreenshot('htmlarea_0_1_full_screen_mode');
                assert.equal(result[0], EXPECTED_TEXT_TEXT1, 'expected text should be present in `full screen` dialog');
            });
        });

    it(`GIVEN existing 'htmlArea 0:1' is opened WHEN 'Source Code' button has been pressed THEN source dialog should appear with expected text`,
        () => {
            return studioUtils.selectContentAndOpenWizard(htmlAreaContent.displayName).then(() => {
                return htmlAreaForm.clickOnSourceButton();
            }).then(() => {
                return sourceCodeDialog.waitForDialogLoaded();
            }).then(() => {
                return sourceCodeDialog.getText();
            }).then(result => {
                studioUtils.saveScreenshot('htmlarea_0_1_source_code_dialog');
                assert.equal(result.trim(), EXPECTED_TEXT_TEXT1, 'expected text should be present in `full screen` dialog');
            });
        });

    it(`GIVEN 'Source Code' dialog is opened WHEN text has been cleared THEN htmlArea should be cleared as well`,
        () => {
            return studioUtils.selectContentAndOpenWizard(htmlAreaContent.displayName).then(() => {
                return htmlAreaForm.clickOnSourceButton();
            }).then(() => {
                return sourceCodeDialog.waitForDialogLoaded();
            }).then(() => {
                return sourceCodeDialog.typeText("");
            }).then(() => {
                return sourceCodeDialog.clickOnOkButton();
            }).then(() => {
                return htmlAreaForm.getTextFromHtmlArea();
            }).then(result => {
                studioUtils.saveScreenshot('htmlarea_0_1_cleared');
                assert.equal(result[0], "", 'htmlArea should be cleared as well');
            });
        });


    it(`GIVEN existing 'htmlArea 0:1' in full screen mode is opened WHEN 'Esc' key has been pressed THEN 'fullscreen'-dialog should be closed`,
        () => {
            return studioUtils.selectContentAndOpenWizard(htmlAreaContent.displayName).then(() => {
                return htmlAreaForm.clickOnFullScreenButton();
            }).then(() => {
                return fullScreenDialog.waitForDialogLoaded();
            }).then(() => {
                return fullScreenDialog.pressEscKey();
            }).then(() => {
                return fullScreenDialog.waitForDialogClosed();
            }).then(result => {
                studioUtils.saveScreenshot('htmlarea_full_screen_mode_closed');
                assert.isTrue(result, 'full screen dialog should be closed');
            });
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
});
