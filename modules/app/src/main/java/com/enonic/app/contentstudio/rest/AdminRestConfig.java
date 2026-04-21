package com.enonic.app.contentstudio.rest;

public @interface AdminRestConfig
{
    String uploadMaxFileSize() default "100mb";

    boolean contentSecurityPolicy_enabled() default true;
}
