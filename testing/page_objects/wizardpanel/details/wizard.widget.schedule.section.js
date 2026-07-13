/**
 * Created on 13.07.2026
 */
const DetailsWidgetScheduleSection = require('../../details_panel/base.schedule.section');
const xpath = {
    widget: "//div[contains(@id,'ContentWizardPanel')]//section[@data-component='DetailsWidgetScheduleSection']",
};

class WizardDetailsWidgetScheduleSection extends DetailsWidgetScheduleSection {

    get scheduleWidget() {
        return xpath.widget;
    }
}

module.exports = WizardDetailsWidgetScheduleSection;
