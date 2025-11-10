package com.enonic.app.contentstudio.json.form;

import java.util.ArrayList;
import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonInclude;

import com.enonic.app.contentstudio.rest.resource.schema.content.LocaleMessageResolver;
import com.enonic.xp.data.Value;
import com.enonic.xp.form.Input;
import com.enonic.xp.inputtype.InputTypeConfig;
import com.enonic.xp.inputtype.InputTypeName;
import com.enonic.xp.inputtype.InputTypeProperty;

import static com.google.common.base.Strings.nullToEmpty;

public class InputJson
    extends FormItemJson<Input>
{
    private final Input input;

    private final OccurrencesJson occurrences;

    private final String inputType;

    private final LocaleMessageResolver localeMessageResolver;

    private Value defaultValue;

    public InputJson( final Input input, final LocaleMessageResolver localeMessageResolver )
    {
        this.localeMessageResolver = localeMessageResolver;

        this.input = input;
        this.occurrences = new OccurrencesJson( input.getOccurrences() );
        this.inputType = input.getInputType().toString();
    }

    @JsonIgnore
    @Override
    public Input getFormItem()
    {
        return input;
    }

    @Override
    public String getName()
    {
        return input.getName();
    }

    public String getLabel()
    {
        if ( localeMessageResolver != null && !nullToEmpty( input.getLabelI18nKey() ).isBlank() )
        {
            return localeMessageResolver.localizeMessage( input.getLabelI18nKey(), input.getLabel() );
        }
        else
        {
            return input.getLabel();
        }
    }

    public boolean isImmutable()
    {
        return input.isImmutable();
    }

    public boolean isIndexed()
    {
        return input.isIndexed();
    }

    public boolean isMaximizeUIInputWidth()
    {
        return input.isMaximizeUIInputWidth();
    }

    public String getCustomText()
    {
        return input.getCustomText();
    }

    public String getHelpText()
    {
        if ( localeMessageResolver != null && !nullToEmpty( input.getHelpTextI18nKey() ).isBlank() )
        {
            return localeMessageResolver.localizeMessage( input.getHelpTextI18nKey(), input.getHelpText() );
        }
        else
        {
            return input.getHelpText();
        }
    }

    public String getValidationRegexp()
    {
        return input.getValidationRegexp();
    }

    public OccurrencesJson getOccurrences()
    {
        return occurrences;
    }

    public String getInputType()
    {
        return this.inputType;
    }

    public Map<String, List<Map<String, String>>> getConfig()
    {
        final InputTypeConfig config = this.input.getInputTypeConfig();

        final Map<String, List<Map<String, String>>> json = new LinkedHashMap<>();
        for ( final String name : config.getNames() )
        {

            json.put( name, toJson( config.getProperties( name ) ) );
        }

        return json;
    }

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public PropertyValueJson getDefaultValue()
    {
        return defaultValue != null ? new PropertyValueJson( defaultValue ) : null;
    }

    public void setDefaultValue( final Value defaultValue )
    {
        this.defaultValue = defaultValue;
    }

    private List<Map<String, String>> toJson( final Collection<InputTypeProperty> properties )
    {
        final List<Map<String, String>> json = new ArrayList<>( );
        for ( final InputTypeProperty property : properties )
        {
            json.add( toJson( property ) );
        }

        return json;
    }

    private Map<String, String> toJson( final InputTypeProperty property )
    {
        final Map<String, String> json = new LinkedHashMap<>();

        String propertyValue = property.getValue();

        for ( final Map.Entry<String, String> attribute : property.getAttributes().entrySet() )
        {
            if ( InputTypeName.RADIO_BUTTON.equals( this.input.getInputType() ) && "i18n".equals( attribute.getKey() ) )
            {
                propertyValue = this.localeMessageResolver.localizeMessage( attribute.getValue(), propertyValue );
            }
            json.put( "@" + attribute.getKey(), attribute.getValue() );
        }

        json.put( "value", propertyValue );

        return json;
    }
}
