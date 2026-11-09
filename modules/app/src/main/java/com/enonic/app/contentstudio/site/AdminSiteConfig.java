package com.enonic.app.contentstudio.site;

public @interface AdminSiteConfig
{
    /**
     * Gap-fill CSP baseline for the page editor. Empty by default, which falls back to
     * {@link #site_preview_contentSecurityPolicy()}; set it only to give the editor a baseline
     * distinct from preview. Applied on top of the directives the editor itself forces.
     */
    String site_edit_contentSecurityPolicy() default "";

    /**
     * Gap-fill CSP baseline for the inline view. Empty by default, which falls back to
     * {@link #site_preview_contentSecurityPolicy()}; set it only to give the inline view a baseline
     * distinct from preview.
     */
    String site_inline_contentSecurityPolicy() default "";

    /**
     * Gap-fill CSP baseline for preview, and the fallback baseline for the inline view and the page
     * editor when their own values are left empty.
     */
    String site_preview_contentSecurityPolicy() default "script-src 'self'; connect-src 'self'; form-action 'self'; base-uri 'self'; object-src 'none'; worker-src 'self'";
}
