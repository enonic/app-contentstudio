package com.enonic.xp.app.contentstudio.json.form;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.google.common.collect.ImmutableList;

import com.enonic.xp.app.contentstudio.rest.resource.schema.content.LocaleMessageResolver;
import com.enonic.xp.data.Value;
import com.enonic.xp.form.Input;
import com.enonic.xp.inputtype.InputTypeName;
import com.enonic.xp.util.GenericValue;

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

    public OccurrencesJson getOccurrences()
    {
        return occurrences;
    }

    public String getInputType()
    {
        return this.inputType;
    }

    public Map<String, List<Map<String, Object>>> getConfig()
    {
        final GenericValue config = this.input.getInputTypeConfig();

        final Map<String, List<Map<String, Object>>> json = new LinkedHashMap<>();

        config.getProperties().forEach( entry -> {
            final String name = entry.getKey();
            final GenericValue value = entry.getValue();

            if ( "option".equals( entry.getKey() ) && ( InputTypeName.RADIO_BUTTON.equals( this.input.getInputType() ) ||
                InputTypeName.COMBO_BOX.equals( this.input.getInputType() ) ) )
            {
                json.put( name, doHandleRadioButtonOrComboBox( value ) );
            }
            else
            {
                json.put( name, toJsonAsList( value ) );
            }
        } );

        return json;
    }

    private List<Map<String, Object>> doHandleRadioButtonOrComboBox( final GenericValue value )
    {
        final List<Map<String, Object>> result = new ArrayList<>();

        value.asList().forEach( item -> {
            final Map<String, Object> json = new LinkedHashMap<>();

            final String optionValue = item.optional( "value" ).map( GenericValue::asString ).orElse( null );

            json.put( "@value", optionValue );

            final Optional<GenericValue> label = item.optional( "label" );
            if ( label.isPresent() )
            {
                final GenericValue labelValue = label.get();

                String labelText = labelValue.optional( "text" ).map( GenericValue::asString ).orElse( null );
                if ( labelValue.optional( "i18n" ).isPresent() )
                {
                    final String i18nKey = labelValue.property( "i18n" ).asString();
                    json.put( "@i18n", i18nKey );

                    if ( InputTypeName.RADIO_BUTTON.equals( this.input.getInputType() ) )
                    {
                        labelText = this.localeMessageResolver.localizeMessage( i18nKey, labelText );
                    }
                }

                json.put( "value", labelText );
            }

            result.add( json );
        } );

        return result;
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

    private List<Map<String, Object>> toJsonAsList( final GenericValue value )
    {
        final List<Map<String, Object>> json = new ArrayList<>( );
        for ( final GenericValue property : value.asList() )
        {
            json.add( toJson( property ) );
        }

        return json;
    }

    private Map<String, Object> toJson( final GenericValue property )
    {
        final Map<String, Object> json = new LinkedHashMap<>();

        switch ( property.getType() ) {
            case STRING:
                json.put( "value", property.asString() );
                break;
            case NUMBER:
                json.put( "value", property.asDouble() );
                break;
            case BOOLEAN:
                json.put( "value", property.asBoolean() );
                break;
            case LIST:
                json.put( "value", property.asList().stream().map( this::toJson ).collect( ImmutableList.toImmutableList() ) );
                break;
            case OBJECT:
                property.getProperties().forEach( entry -> json.put( entry.getKey(), toJson( entry.getValue() ) ) );
                break;
            default:
                throw new AssertionError( property.getType() );
        }

        return json;
    }
}
