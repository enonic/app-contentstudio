package com.enonic.app.contentstudio.site;

public @interface AdminSiteConfig
{
    String site_inline_contentSecurityPolicy() default "script-src 'self'; connect-src 'self'; form-action 'self'; base-uri 'self'; object-src 'none'";

    String site_preview_contentSecurityPolicy() default "script-src 'self'; connect-src 'self'; form-action 'self'; base-uri 'self'; object-src 'none'";
}
