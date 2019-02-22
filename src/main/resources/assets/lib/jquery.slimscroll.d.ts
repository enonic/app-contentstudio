// Type definitions for jquery-slimscroll 1.3.8
// Project: https://github.com/rochal/jQuery-slimScroll
// Definitions by: Mikita Taukachou <https://github.com/edloidas>
// Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped
// TypeScript Version: 2.3
/// <reference types="jquery" />

declare namespace JQuery.slimScroll {
    interface Options {
        width?: string;
        height?: string;
        size?: string;
        position?: string;
        color?: string;
        alwaysVisible?: boolean;
        distance?: string;
        start?: any;
        railVisible?: boolean;
        railColor?: string;
        railOpacity?: number;
        wheelStep?: number;
        allowPageScroll?: boolean;
        disableFadeOut?: boolean;
    }
}

interface JQuery {
    slimScroll(options?: JQuery.slimScroll.Options): JQuery;
}
