import React from 'react';
import {Button, TextInput, View} from 'react-native';
import {launchSmallPlug} from '../apis/Functions';
import {SCGatewayEventManager} from 'react-native-smallcase-gateway';

const SmtScreen = () => {
  const [targetEndpoint, onChangeTargetEndpoint] = React.useState<
    string | null
  >(null);
  const [params, onChangeParams] = React.useState<string | null>(null);
  const [headerColor, onChangeHeaderColor] = React.useState<string | null>(
    null,
  );
  const [headerOpacity, onChangeHeaderOpacity] = React.useState<string | null>(
    null,
  );
  const [backIconColor, onChangeBackIconColor] = React.useState<string | null>(
    null,
  );
  const [backIconOpacity, onChangeBackIconOpacity] = React.useState<
    string | null
  >(null);
  return (
    <View>
      <TextInput
        placeholder="Enter target end point"
        onChange={event => {
          onChangeTargetEndpoint(event.nativeEvent.text);
        }}
      />
      <TextInput
        placeholder="Enter params"
        onChange={event => {
          onChangeParams(event.nativeEvent.text);
        }}
      />
      <TextInput
        placeholder="Enter header color"
        onChange={event => {
          onChangeHeaderColor(event.nativeEvent.text);
        }}
      />
      <TextInput
        placeholder="Enter header opacity"
        onChange={event => {
          onChangeHeaderOpacity(event.nativeEvent.text);
        }}
      />
      <TextInput
        placeholder="Enter backIconColor color"
        onChange={event => {
          onChangeBackIconColor(event.nativeEvent.text);
        }}
      />
      <TextInput
        placeholder="Enter backIcon opacity"
        onChange={event => {
          onChangeBackIconOpacity(event.nativeEvent.text);
        }}
      />
      <Button
        onPress={async () => {
          console.log(`SmtScreen - ${headerColor} ${headerOpacity}`);
          let ho = getFloatFromString(headerOpacity, 1);
          let bo = getFloatFromString(backIconOpacity, 1);
          console.log(`SMT Screen - ho-${ho}, bo-${bo}`);
          const config = {
            headerColor: headerColor,
            headerOpacity: ho,
            backIconColor: backIconColor,
            backIconOpacity: bo,
          };

          const smallplugSub = SCGatewayEventManager.subscribeToSmallplugEvents(
            event => {
              console.log('[SmallPlug Event]:', event);
            },
          );

          try {
            const result = await launchSmallPlug(
              targetEndpoint,
              params,
              config,
            );
            console.log('✅ Smallplug Success:', result);
            if (result?.data?.userInfo) {
              console.log(' User Info:', result.data.userInfo);
            }
          } catch (error: any) {
            console.error(' Smallplug Error:', error);
            if (error?.data?.userInfo) {
              console.log(' User Info from error:', error.data.userInfo);
            }
          } finally {
            smallplugSub?.remove();
          }
        }}
        title={'SmallPlug'}
        accessibilityLabel="Learn more about this purple button"
      />
    </View>
  );
};

function getFloatFromString(value: string | null, defaultValue: number) {
  try {
    if (typeof value !== 'string') {
      return defaultValue;
    }
    const parsedValue = parseFloat(value);
    if (Number.isNaN(parsedValue)) {
      return defaultValue;
    }
    return parsedValue;
  } catch (error) {
    return defaultValue;
  }
}

export {SmtScreen};
