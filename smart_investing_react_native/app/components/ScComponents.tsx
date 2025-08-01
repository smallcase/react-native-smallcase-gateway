/* eslint-disable react-native/no-inline-styles */
import React from 'react';
import {
  ActivityIndicator,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TouchableHighlight,
  ViewStyle,
} from 'react-native';

interface ScButtonProps {
  isDark?: boolean;
  style?: StyleProp<ViewStyle>;
  onPress: () => void;
  title: string;
}
interface ScTextInputProps {
  value?: string;
  style?: StyleProp<ViewStyle>;
  onChanged?: (value: string) => void;
  onFocus?: () => void;
  placeholder?: string;
}
interface ScSelectorChipProps {
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  title: string;
  isActive: Boolean;
}

class ScButton extends React.Component<ScButtonProps, {}> {
  constructor(props: ScButtonProps) {
    super(props);
  }

  render() {
    return (
      <>
        <TouchableHighlight
          style={[
            styles.scButton,
            this.props.style,
            {
              borderColor: '#2685EF',
              borderWidth: this.props.isDark === true ? 1 : undefined,
              backgroundColor: this.props.isDark === true ? 'white' : '#2685EF',
            },
          ]}
          underlayColor={this.props.isDark === true ? 'white' : '#2685EF'}
          onPress={this.props.onPress}>
          <Text
            style={{color: this.props.isDark === true ? '#2685EF' : 'white'}}>
            {this.props.title}
          </Text>
        </TouchableHighlight>
      </>
    );
  }
}

const ScTextInput = (props: ScTextInputProps) => {
  return (
    <TextInput
      value={props.value}
      style={[styles.scTextInput, props.style]}
      onChangeText={props.onChanged}
      placeholder={props.placeholder}
      placeholderTextColor="white"
      selectionColor="#2685EF"
      onTouchStart={props.onFocus}
      autoCapitalize={'none'}
      onFocus={_ => {
        props.onFocus?.();
      }}
    />
  );
};

const ScSelectorChip = (props: ScSelectorChipProps) => {
  return (
    <TouchableHighlight
      onPress={props.onPress}
      style={[
        styles.scSelectorChip,
        props.style,
        {backgroundColor: props.isActive ? 'green' : 'rgba(70, 70, 70, .76)'},
      ]}>
      <Text style={{color: 'white'}}>{props.title}</Text>
    </TouchableHighlight>
  );
};

const ScLoader = () => {
  return <ActivityIndicator />;
};

const styles = StyleSheet.create({
  scButton: {
    marginVertical: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 4,
    textAlign: 'center',
    alignItems: 'center',
    alignContent: 'center',
  },
  scTextInput: {
    padding: 0,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 4,
    borderColor: '#838383',
    borderWidth: 2,
    backgroundColor: 'rgba(0, 0, 0, 0.36)',
    textAlign: 'center',
    fontSize: 14,
    color: 'white',
  },
  scSelectorChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(70, 70, 70, .76)',
    color: 'white',
  },
});

export {ScButton, ScTextInput, ScSelectorChip, ScLoader};
