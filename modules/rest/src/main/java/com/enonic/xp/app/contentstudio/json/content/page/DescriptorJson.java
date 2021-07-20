package com.enonic.xp.app.contentstudio.json.content.page;

import com.google.common.base.Preconditions;

import com.enonic.xp.app.contentstudio.json.ItemJson;
import com.enonic.xp.app.contentstudio.json.form.FormJson;
import com.enonic.xp.app.contentstudio.rest.resource.schema.content.LocaleMessageResolver;
import com.enonic.xp.app.contentstudio.rest.resource.schema.mixin.InlineMixinResolver;
import com.enonic.xp.region.ComponentDescriptor;

import static com.google.common.base.Strings.nullToEmpty;


public abstract class DescriptorJson
    implements ItemJson
{
    private final ComponentDescriptor descriptor;

    private final FormJson configJson;

    private final LocaleMessageResolver localeMessageResolver;

    private final boolean editable;

    private final boolean deletable;

    public DescriptorJson( final ComponentDescriptor descriptor, final LocaleMessageResolver localeMessageResolver,
                           final InlineMixinResolver inlineMixinResolver )
    {
        Preconditions.checkNotNull( descriptor );
        Preconditions.checkNotNull( localeMessageResolver );

        this.editable = false;
        this.deletable = false;

        this.localeMessageResolver = localeMessageResolver;
        this.descriptor = descriptor;

        this.configJson = new FormJson( descriptor.getConfig(), localeMessageResolver, inlineMixinResolver );
    }

    public String getKey()
    {
        return descriptor.getKey().toString();
    }

    public String getName()
    {
        return descriptor.getName();
    }

    public String getDisplayName()
    {
        if ( !nullToEmpty( descriptor.getDisplayNameI18nKey() ).isBlank() )
        {
            return localeMessageResolver.localizeMessage( descriptor.getDisplayNameI18nKey(), descriptor.getDisplayName() );
        }
        else
        {
            return descriptor.getDisplayName();
        }
    }

    public String getDescription()
    {
        if ( !nullToEmpty( descriptor.getDescriptionI18nKey() ).isBlank() )
        {
            return localeMessageResolver.localizeMessage( descriptor.getDescriptionI18nKey(), descriptor.getDescription() );
        }
        else
        {
            return descriptor.getDescription();
        }
    }

    public FormJson getConfig()
    {
        return configJson;
    }

    @Override
    public boolean getEditable()
    {
        return editable;
    }

    @Override
    public boolean getDeletable()
    {
        return deletable;
    }
}
