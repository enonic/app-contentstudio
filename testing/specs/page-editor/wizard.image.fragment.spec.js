/**
 * Created on 04.03.2019.
 *
 */
const chai = require('chai');
chai.use(require('chai-as-promised'));
const expect = chai.expect;
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConstant = require('../../libs/app_const');
const ContentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');
const studioUtils = require('../../libs/studio.utils.js');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const contentBuilder = require("../../libs/content.builder");
const PageComponentView = require("../../page_objects/wizardpanel/liveform/page.components.view");
const LiveFormPanel = require("../../page_objects/wizardpanel/liveform/live.form.panel");
const ImageInspectionPanel = require('../../page_objects/wizardpanel/liveform/inspection/image.inspection.panel');
const WizardDetailsPanel = require('../../page_objects/wizardpanel/details/wizard.details.panel');
const WizardVersionsWidget = require('../../page_objects/wizardpanel/details/wizard.versions.widget');


describe('wizard.image.fragment: changing of an image in image-fragment',
    function () {
        this.timeout(appConstant.SUITE_TIMEOUT);
        webDriverHelper.setupBrowser();

        let IMAGE_DISPLAY_NAME1 = 'cape';
        let IMAGE_DISPLAY_NAME2 = 'man2';
        let SITE;
        let CONTROLLER_NAME = 'main region';

        it(`Precondition: new site should be added`,
            async () => {
                let displayName = contentBuilder.generateRandomName('site');
                SITE = contentBuilder.buildSite(displayName, 'description', ['All Content Types App'], CONTROLLER_NAME);
                await studioUtils.doAddSite(SITE);
            });

        it(`Precondition: image-fragment should be inserted in the site`,
            () => {
                let contentWizard = new ContentWizard();
                let pageComponentView = new PageComponentView();
                let liveFormPanel = new LiveFormPanel();
                return studioUtils.selectContentAndOpenWizard(SITE.displayName).then(() => {
                    // opens 'Show Component View'
                    return contentWizard.clickOnShowComponentViewToggler();
                }).then(() => {
                    return pageComponentView.openMenu("main");
                }).then(() => {
                    return pageComponentView.selectMenuItem(["Insert", "Image"]);
                }).then(() => {
                    // insert the image
                    return liveFormPanel.selectImageByDisplayName(IMAGE_DISPLAY_NAME1);
                }).then(() => {
                    return contentWizard.switchToMainFrame();
                }).then(() => {
                    return pageComponentView.openMenu(IMAGE_DISPLAY_NAME1);
                }).then(() => {
                    // save the image as fragment
                    return pageComponentView.clickOnMenuItem(appConstant.MENU_ITEMS.SAVE_AS_FRAGMENT);
                });
            });

        //verifies the "https://github.com/enonic/app-contentstudio/issues/256"
        //"Save" button doesn't get disabled after saving any changes #256
        it(`GIVEN existing fragment is opened WHEN image has been changed and the fragment saved THEN Save button gets Saved`,
            () => {
                let contentWizard = new ContentWizard();
                let imageInspectionPanel = new ImageInspectionPanel();
                let pageComponentView = new PageComponentView();
                return studioUtils.selectContentAndOpenWizard('fragment-' + IMAGE_DISPLAY_NAME1).then(() => {
                    return contentWizard.clickOnShowComponentViewToggler();
                }).then(() => {
                    return pageComponentView.clickOnComponent(IMAGE_DISPLAY_NAME1);
                }).then(() => {
                    //the image has been removed in 'inspection panel'
                    return imageInspectionPanel.clickOnRemoveIcon();
                }).then(() => {
                    // new image has been selected( fragment should be saved automatically)
                    return imageInspectionPanel.typeNameAndSelectImage(IMAGE_DISPLAY_NAME2);
                }).then(() => {
                    //so Save should be disabled now!
                    return assert.eventually.isTrue(contentWizard.waitForSaveButtonDisabled(),
                        "`Save` button should be disabled on the toolbar");
                })
            });

        //checks alert after clicking on Close icon(nothing was changed)
        it(`GIVEN existing fragment is opened AND Components View is opened WHEN image has been clicked in Components View  AND close browser tab has been clicked THEN Alert with warning about unsaved changes should not appear`,
            () => {
                let contentWizard = new ContentWizard();
                let pageComponentView = new PageComponentView();
                return studioUtils.selectContentAndOpenWizard('fragment-' + IMAGE_DISPLAY_NAME1).then(() => {
                    return contentWizard.clickOnShowComponentViewToggler();
                }).then(() => {
                    // just click on the image (nothing is changing)
                    return pageComponentView.clickOnComponent(IMAGE_DISPLAY_NAME2);
                }).then(() => {
                    //`Close tab` has been clicked
                    return contentWizard.clickOnCloseIconInBrowser();
                }).then(() => {
                    return contentWizard.isAlertPresent();
                }).then(result => {
                    assert.isFalse(result, "Alert dialog should not be present, because nothing was changed!");
                })
            });

        //verifies https://github.com/enonic/app-contentstudio/issues/335
        //Site Wizard Context panel - versions widget closes after rollback a version
        it(`GIVEN existing site is opened AND Versions widget is opened WHEN rollback a version THEN Versions widget should not be closed`,
            () => {
                let contentWizard = new ContentWizard();
                let wizardVersionsWidget = new WizardVersionsWidget();
                let wizardDetailsPanel = new WizardDetailsPanel();
                return studioUtils.selectContentAndOpenWizard(SITE.displayName).then(() => {
                    return contentWizard.openDetailsPanel();
                }).then(() => {
                    return wizardDetailsPanel.openVersionHistory();
                }).then(() => {
                    return wizardVersionsWidget.waitForVersionsLoaded();
                }).then(() => {
                    //expand the version item
                    return wizardVersionsWidget.clickAndExpandVersion(1);
                }).then(() => {
                    // click on Restore button
                    return wizardVersionsWidget.clickOnRestoreButton();
                }).then(() => {
                    //wait for the notification message
                    return contentWizard.waitForNotificationMessage();
                }).then(message => {
                    assert.include(message, "Version was changed to", "Expected notification message should appear");
                }).then(() => {
                    return wizardVersionsWidget.isWidgetVisible();
                }).then(result => {
                    assert.isTrue(result, "Versions widget should be present in Details Panel")
                })
            });

        beforeEach(() => studioUtils.navigateToContentStudioApp());
        afterEach(() => {
            let contentWizard = new ContentWizard();
            return contentWizard.isAlertPresent().then(result => {
                if (result) {
                    return contentWizard.alertAccept();
                }
            }).then(() => {
                return studioUtils.doCloseAllWindowTabsAndSwitchToHome();
            })
        });
        before(() => {
            return console.log('specification starting: ' + this.title);
        });
    });
