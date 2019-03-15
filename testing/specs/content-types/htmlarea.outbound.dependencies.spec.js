/**
 * Created on 26.11.2018.
 * verifies
 * https://github.com/enonic/xp/issues/6768
 * https://github.com/enonic/xp/issues/6795
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
const insertImageDialog = require('../../page_objects/wizardpanel/insert.image.dialog.cke');
const wizardDetailsPanel = require('../../page_objects/wizardpanel/details/wizard.details.panel');
const wizardDependenciesWidget = require('../../page_objects/wizardpanel/details/wizard.dependencies.widget');

describe('htmlarea.outbound.dependencies.spec:  checks Outbound Dependency for a content with Html Area', function () {
    this.timeout(appConstant.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();

    let SITE;
    let IMAGE_DISPLAY_NAME = "Pop_03";
    let CONTENT_NAME = contentBuilder.generateRandomName('htmlarea');

    it(`Preconditions: site should be added`,
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

    it(`GIVEN new 'htmlArea' content is opened WHEN image has been inserted in 'htmlarea' THEN the content should be updated`,
        () => {
            return studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, 'htmlarea0_1').then(() => {
                return contentWizard.typeDisplayName(CONTENT_NAME);
            }).then(() => {
                return contentWizard.waitAndClickOnSave();
            }).pause(1000).then(() => {
                return htmlAreaForm.showToolbarAndClickOnInsertImageButton();
            }).then(() => {
                return insertImageDialog.filterAndSelectImage(IMAGE_DISPLAY_NAME);
            }).then(() => {
                return insertImageDialog.clickOnInsertButton();
            }).then(() => {
                return contentWizard.waitAndClickOnSave();
            }).then(()=>{
                return contentWizard.waitForNotificationMessage();
            }).then(result => {
                studioUtils.saveScreenshot('cke_image_is_inserted');
                let expectedMessage = appConstant.itemSavedNotificationMessage(CONTENT_NAME);
                assert.isTrue(result == expectedMessage, 'correct notification should appear');
            });
        });

    //verifies  https://github.com/enonic/xp/issues/6768
    it(`GIVEN existing 'htmlArea' content is selected WHEN Dependencies panel is opened THEN 'Outbound dependency' should be present`,
        () => {
            return studioUtils.openContentInWizard(CONTENT_NAME).then(() => {
                return contentWizard.openDetailsPanel();
            }).then(() => {
                return wizardDetailsPanel.openDependencies();
            }).then(() => {
                studioUtils.saveScreenshot('htmlarea_with_image');
                return assert.eventually.isTrue(wizardDependenciesWidget.waitForOutboundButtonVisible(),
                    '`Show outbound` button should be present on the widget, because an image was inserted in the htmlarea');
            }).then(() => {
                return assert.eventually.isFalse(wizardDependenciesWidget.isInboundButtonVisible(),
                    '`Show Inbound` button should not be present');
            })
        });

    // verifies https://github.com/enonic/xp/issues/6795 (Outbound Dependency is not cleared after removing an image in html area)
    it(`GIVEN existing 'htmlArea' content is opened AND Dependencies panel is opened WHEN image in htmlArea has been removed THEN 'Outbound dependency' should be cleared as well`,
        () => {
            return studioUtils.openContentInWizard(CONTENT_NAME).then(() => {
                return contentWizard.openDetailsPanel();
            }).then(() => {
                return wizardDetailsPanel.openDependencies();
            }).then(() => {
                return htmlAreaForm.clearHtmlArea(0);
            }).then(() => {
                //save the changes!
                return contentWizard.waitAndClickOnSave();
            }).then(() => {
                studioUtils.saveScreenshot('htmlarea_image_removed');
                return assert.eventually.isTrue(wizardDependenciesWidget.waitForOutboundButtonNotVisible(),
                    '`Show outbound` button is getting not visible on the widget, because an image is removed');
            }).then(() => {
                return assert.eventually.isFalse(wizardDependenciesWidget.isInboundButtonVisible(),
                    '`Show Inbound` button should not be present');
            })
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
});
