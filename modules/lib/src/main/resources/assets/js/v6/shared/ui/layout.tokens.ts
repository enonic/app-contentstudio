import { ResponsiveRanges } from '@enonic/lib-admin-ui/ui/responsive/ResponsiveRanges';

export const LayoutTokens = {
    contextPanel: {
        minWidth: 360,
        dockedWidthPercent: {
            browse: 25,
            wizardWithEditor: 16,
            wizardNoEditor: 38,
        },
        floatingWidthPercent: {
            wizardWithEditor: 24,
        },
        // Left-panel responsive range at or below which the context panel switches to floating mode.
        floatingThreshold: {
            browse: ResponsiveRanges._960_1200,
            wizardNoEditor: ResponsiveRanges._720_960,
            wizardMaximized: ResponsiveRanges._1200_1380,
            wizardNormal: ResponsiveRanges._540_720,
        },
        mobileThreshold: ResponsiveRanges._540_720,
        initialCollapseThreshold: ResponsiveRanges._1620_1920,
    },
};
