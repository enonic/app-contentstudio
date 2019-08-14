/**
 * Created on 20.11.2018.
 */
const chai = require('chai');
chai.use(require('chai-as-promised'));
const expect = chai.expect;
const assert = chai.assert;
const webDriverHelper = require('../libs/WebDriverHelper');
const appConstant = require('../libs/app_const');
const studioUtils = require('../libs/studio.utils.js');
const contentBuilder = require("../libs/content.builder");
const XDataImageSelector = require('../page_objects/wizardpanel/xdata.image.selector.wizard.step.form');
const ContentWizard = require('../page_objects/wizardpanel/content.wizard.panel');
const WizardDetailsPanel = require('../page_objects/wizardpanel/details/wizard.details.panel');
const WizardDependenciesWidget = require('../page_objects/wizardpanel/details/wizard.dependencies.widget');

describe('content.xdata.outbound.dependency.spec:  check outbound dependency for a content with x-data(image)', function () {
    this.timeout(appConstant.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();
    let SITE;
    let CONTENT_WITH_XDATA = contentBuilder.generateRandomName('test');
    let CONTENT_WITH_XDATA_2 = contentBuilder.generateRandomName('test');
    let IMAGE_DISPLAY_NAME = "kotey";

    it(`Preconditions: new site should be added`,
        async () => {
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'description', [appConstant.APP_CONTENT_TYPES]);
            await studioUtils.doAddSite(SITE);
        });

    it(`GIVEN wizard for content with optional x-data(image-selector) is opened WHEN image has been selected THEN image should be present in the x-data form`,
        () => {
            let contentWizard = new ContentWizard();
            let xDataImageSelector = new XDataImageSelector();
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
            let contentWizard = new ContentWizard();
            let wizardDependenciesWidget = new WizardDependenciesWidget();
            let wizardDetailsPanel = new WizardDetailsPanel();
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

    //verifies https://github.com/enonic/app-contentstudio/issues/287
    it(`GIVEN content with enabled x-data(image-selector) WHEN the content has been opened THEN x-data form should be enabled`,
        () => {
            let contentWizard = new ContentWizard();
            let xDataImageSelector = new XDataImageSelector();
            return studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, 'double1_1').then(() => {
                return contentWizard.typeDisplayName(CONTENT_WITH_XDATA_2);
            }).then(() => {
                // click on '+' and enable the x-data
                return contentWizard.clickOnXdataToggler();
            }).then(() => {
                //save and close the content
                return studioUtils.saveAndCloseWizard();
            }).then(() => {
                return studioUtils.selectContentAndOpenWizard(CONTENT_WITH_XDATA_2);
            }).then(() => {
                // x-data with image-selector should be enabled and image selector should be visible
                return xDataImageSelector.waitForImageOptionsFilterInputVisible();
            });
        });
    //verifies https://github.com/enonic/app-contentstudio/issues/287
    it(`GIVEN the existing content is opened WHEN x-data disabled THEN Save button gets visible and enabled`,
        () => {
            let xDataImageSelector = new XDataImageSelector();
            let contentWizard = new ContentWizard();
            return studioUtils.selectContentAndOpenWizard(CONTENT_WITH_XDATA_2).then(()=>{
                // x-data with image-selector should be present
                return xDataImageSelector.waitForImageOptionsFilterInputVisible();
            }).then(() => {
                // click on toggler and disable the x-data
                return contentWizard.clickOnXdataToggler();
            }).then(() => {
                // Save button gets visible and enabled
                return contentWizard.waitForSaveButtonVisible();
            });
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
});
