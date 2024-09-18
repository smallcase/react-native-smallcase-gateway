/* eslint-disable react-native/no-inline-styles */
import React, {useState} from 'react';
import {Text, View} from 'react-native';
import {SmartButton} from '../screens/HoldingsScreen';
import Clipboard from '@react-native-clipboard/clipboard';
import {copyToClipboard} from '../apis/Functions';

function getPrettyJsonString(object: object) {
  return JSON.stringify(object, null, 3);
}
const SIJsonViewer: React.FC<any> = ({
  title,
  object,
}: {
  title: string;
  object: Object;
}) => {
  const [show, setShow] = useState(false);
  return (
    <>
      <View
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
        }}>
        <Text style={{fontWeight: 'bold', fontSize: 16}}>{title}</Text>
        <SmartButton
          title={show ? 'Hide' : 'Show'}
          onPress={() => {
            setShow(!show);
          }}
        />
      </View>
      {show && <Text>{getPrettyJsonString(object)}</Text>}
      {show && (
        <SmartButton
          title="Copy"
          onPress={() => {
            copyToClipboard(getPrettyJsonString(object));
          }}
        />
      )}
    </>
  );
};

export {SIJsonViewer};
