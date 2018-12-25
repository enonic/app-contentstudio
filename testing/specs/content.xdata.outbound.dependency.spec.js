/**
 * Created on 20.11.2018.
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
const xDataImageSelector = require('../page_objects/wizardpanel/xdata.image.selector.wizard.step.form');
const contentWizard = require('../page_objects/wizardpanel/content.wizard.panel');
const wizardDetailsPanel = require('../page_objects/wizardpanel/details/wizard.details.panel');
const wizardDependenciesWidget = require('../page_objects/wizardpanel/details/wizard.dependencies.widget');

describe('content.xdata.outbound.dependency.spec:  check outbound dependency for a content with x-data(image)', function () {
    this.timeout(appConstant.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();
    let SITE;
    let CONTENT_WITH_XDATA = contentBuilder.generateRandomName('test');
    let IMAGE_DISPLAY_NAME = "kotey";

    it(`Preconditions: add new site and select required application `,
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

    it(`GIVEN wizard for content with optional x-data(image-selector) is opened WHEN image has been selected THEN image should be present in the x-data form`,
        () => {
            return studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, 'double1_1').then(() => {
                return contentWizard.typeDisplayName(CONTENT_WITH_XDATA);
            }).then(() => {
                return contentWizard.clickOnXdataToggler();
            }).then(() => {
                return xDataImageSelector.filterOptionsAndSelectImage(IMAGE_DISPLAY_NAME);
            }).then(() => {
                return contentWizard.waitAndClickOnSave();
            }).then(result => {
                studioUtils.saveScreenshot('xdata_image_selector_saved');
                return assert.eventually.isTrue(xDataImageSelector.isImageSelected(), "Option should be selected in the form");
            });
        });

    it(`GIVEN existing content with x-data(image) is opened WHEN 'Dependencies widget' has been opened THEN 'Show Outbound' button should be present AND 'Show Inbound' should not be present`,
        () => {
            return studioUtils.selectContentAndOpenWizard(CONTENT_WITH_XDATA).then(() => {
                return contentWizard.openDetailsPanel();
            }).then(() => {
                return wizardDetailsPanel.openDependencies();
            }).then(() => {
                studioUtils.saveScreenshot('content_with_xdata_dependencies_widget');
                return assert.eventually.isTrue(wizardDependenciesWidget.waitForOutboundButtonVisible(),
                    'Show outbound button should be present on the widget, because the x-data contains an image');
            }).then(() => {
                return assert.eventually.isFalse(wizardDependenciesWidget.isInboundButtonVisible(),
                    '`Show Inbound` button should not be present');
            })
        });
    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
});
