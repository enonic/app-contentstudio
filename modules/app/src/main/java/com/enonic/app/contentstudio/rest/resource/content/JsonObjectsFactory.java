package com.enonic.app.contentstudio.rest.resource.content;

import java.util.Enumeration;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;

import jakarta.servlet.http.HttpServletRequest;

import com.enonic.app.contentstudio.json.content.ContentJson;
import com.enonic.app.contentstudio.json.content.ContentSummaryJson;
import com.enonic.app.contentstudio.json.content.ValidationErrorJson;
import com.enonic.app.contentstudio.json.content.page.PageDescriptorJson;
import com.enonic.app.contentstudio.json.content.page.region.LayoutDescriptorJson;
import com.enonic.app.contentstudio.json.content.page.region.PartDescriptorJson;
import com.enonic.app.contentstudio.json.schema.content.ContentTypeSummaryJson;
import com.enonic.app.contentstudio.rest.resource.schema.content.ContentTypeIconResolver;
import com.enonic.app.contentstudio.rest.resource.schema.content.ContentTypeIconUrlResolver;
import com.enonic.app.contentstudio.rest.resource.schema.content.LocaleMessageResolver;
import com.enonic.app.contentstudio.rest.resource.schema.mixin.InlineMixinResolver;
import com.enonic.xp.content.Content;
import com.enonic.xp.content.ContentService;
import com.enonic.xp.content.FindContentByParentParams;
import com.enonic.xp.content.ValidationErrors;
import com.enonic.xp.i18n.LocaleService;
import com.enonic.xp.page.PageDescriptor;
import com.enonic.xp.region.LayoutDescriptor;
import com.enonic.xp.region.PartDescriptor;
import com.enonic.xp.schema.content.ContentType;
import com.enonic.xp.schema.content.ContentTypeService;
import com.enonic.xp.schema.mixin.MixinService;
import com.enonic.xp.security.SecurityService;

@Component(service = JsonObjectsFactory.class)
public class JsonObjectsFactory
{
    private LocaleService localeService;

    private MixinService mixinService;

    private ContentTypeService contentTypeService;

    private ContentService contentService;

    private ContentPrincipalsResolver principalsResolver;

    private ComponentDisplayNameResolver componentDisplayNameResolver;

    public JsonObjectsFactory()
    {
        int i = 0;
    }

    public PartDescriptorJson createPartDescriptorJson( final PartDescriptor descriptor, final HttpServletRequest request )
    {
        return new PartDescriptorJson( descriptor, new LocaleMessageResolver( this.localeService, descriptor.getApplicationKey(),
                                                                              request.getLocales() ),
                                       new InlineMixinResolver( mixinService ), request );
    }

    public PageDescriptorJson createPageDescriptorJson( final PageDescriptor descriptor, final Enumeration<Locale> locales )
    {
        return new PageDescriptorJson( descriptor, new LocaleMessageResolver( this.localeService, descriptor.getApplicationKey(), locales ),
                                       new InlineMixinResolver( mixinService ) );
    }

    public LayoutDescriptorJson createLayoutDescriptorJson( final LayoutDescriptor descriptor, final Enumeration<Locale> locales )
    {
        return new LayoutDescriptorJson( descriptor,
                                         new LocaleMessageResolver( this.localeService, descriptor.getApplicationKey(), locales ),
                                         new InlineMixinResolver( mixinService ) );
    }

    public ContentTypeSummaryJson createContentTypeSummaryJson( final ContentType contentType, final HttpServletRequest request )
    {
        final ContentTypeIconUrlResolver contentTypeIconUrlResolver =
            new ContentTypeIconUrlResolver( new ContentTypeIconResolver( contentTypeService ), request );

        return new ContentTypeSummaryJson( contentType, contentTypeIconUrlResolver,
                                           new LocaleMessageResolver( localeService, contentType.getName().getApplicationKey(),
                                                                      request.getLocales() ), request );
    }

    public ContentJson createContentJson( final Content content, final HttpServletRequest request )
    {
        final List<ValidationErrorJson> localizedValidationErrors = Optional.ofNullable( content.getValidationErrors() )
            .map( ValidationErrors::stream )
            .orElse( Stream.empty() )
            .map( ve -> new ValidationErrorJson( ve, new LocaleMessageResolver( localeService, ve.getErrorCode().getApplicationKey(),
                                                                                request.getLocales() ) ) )
            .collect( Collectors.toList() );

        return new ContentJson( content, hasChildren( content ), new ContentIconUrlResolver( contentTypeService, request ), principalsResolver,
                                componentDisplayNameResolver, new ContentListTitleResolver( contentTypeService ),
                                localizedValidationErrors );
    }

    public ContentSummaryJson createContentSummaryJson( final Content content, final HttpServletRequest request )
    {
        return new ContentSummaryJson( content, hasChildren( content ), new ContentIconUrlResolver( contentTypeService, request ),
                                       new ContentListTitleResolver( contentTypeService ) );
    }

    private boolean hasChildren( final Content c )
    {
        return
            contentService.findIdsByParent( FindContentByParentParams.create().parentPath( c.getPath() ).size( 0 ).build() ).getTotalHits() >
                0;
    }


    @Reference
    public void setLocaleService( final LocaleService localeService )
    {
        this.localeService = localeService;
    }

    @Reference
    public void setMixinService( final MixinService mixinService )
    {
        this.mixinService = mixinService;
    }

    @Reference
    public void setContentTypeService( final ContentTypeService contentTypeService )
    {
        this.contentTypeService = contentTypeService;
    }

    @Reference
    public void setSecurityService( final SecurityService securityService )
    {
        this.principalsResolver = new ContentPrincipalsResolver( securityService );
    }

    @Reference
    public void setComponentNameResolver( final ComponentDisplayNameResolver componentDisplayNameResolver )
    {
        this.componentDisplayNameResolver = componentDisplayNameResolver;
    }

    @Reference
    public void setContentService( final ContentService contentService )
    {
        this.contentService = contentService;
    }
}
