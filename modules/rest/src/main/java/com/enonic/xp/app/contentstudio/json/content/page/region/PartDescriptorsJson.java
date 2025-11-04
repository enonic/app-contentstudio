package com.enonic.xp.app.contentstudio.json.content.page.region;

import java.util.List;
import java.util.stream.Collectors;

import jakarta.servlet.http.HttpServletRequest;

import com.enonic.xp.app.contentstudio.rest.resource.schema.content.LocaleMessageResolver;
import com.enonic.xp.app.contentstudio.rest.resource.schema.formfragment.CmsFormFragmentResolver;
import com.enonic.xp.region.PartDescriptors;


@SuppressWarnings("UnusedDeclaration")
public class PartDescriptorsJson
{
    private final List<PartDescriptorJson> descriptorJsonList;

    public PartDescriptorsJson( final List<PartDescriptorJson> descriptorJsonList )
    {
        this.descriptorJsonList = List.copyOf( descriptorJsonList );
    }

    public PartDescriptorsJson( final PartDescriptors descriptors, final LocaleMessageResolver localeMessageResolver,
                                final CmsFormFragmentResolver inlineMixinResolver, final HttpServletRequest request )
    {
        this.descriptorJsonList = descriptors.stream()
            .map( descriptor -> new PartDescriptorJson( descriptor, localeMessageResolver, inlineMixinResolver, request ) )
            .collect( Collectors.toUnmodifiableList() );
    }

    public List<PartDescriptorJson> getDescriptors()
    {
        return descriptorJsonList;
    }
}
