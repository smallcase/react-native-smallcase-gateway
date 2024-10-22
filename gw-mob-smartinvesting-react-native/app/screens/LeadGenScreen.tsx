/* eslint-disable react-native/no-inline-styles */
import React, {useState} from 'react';
import {Button, ScrollView, Switch, Text, TextInput, View} from 'react-native';
import {leadGen, logout} from '../apis/Functions';
import * as Sentry from '@sentry/react-native';

const LeadGenScreen = () => {
  let name = '';
  let email = '';
  let contact = '';
  let [shouldShowLoginCTA, setShouldShowLoginCTA] = useState(false);
  return (
    <ScrollView>
      <TextInput
        placeholder="Enter Name"
        onChangeText={value => {
          name = value;
        }}
      />
      <TextInput
        placeholder="Enter Email"
        onChangeText={value => {
          email = value;
        }}
      />
      <TextInput
        placeholder="Enter Contact"
        onChangeText={value => {
          contact = value;
        }}
      />
      <Button
        title="Lead Gen"
        onPress={() => {
          leadGen({
            name: name,
            email: email,
            contact: contact,
          });
        }}
      />
      <View
        style={{
          padding: 12,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
        <Text>Show Login CTA</Text>
        <Switch
          value={shouldShowLoginCTA}
          onChange={event => {
            setShouldShowLoginCTA(event.nativeEvent.value);
            console.log(event.nativeEvent);
          }}
        />
      </View>

      <Button
        title="Lead Gen with Login CTA"
        onPress={() => {
          leadGen(
            {
              name: name,
              email: email,
              contact: contact,
            },
            shouldShowLoginCTA,
          );
        }}
      />
      <Button
        title="Logout"
        onPress={async () => {
          try {
            const res = await logout();
            console.log(`Logout res on screen: ${res}`);
          } catch (error) {
            Sentry.captureException(error);
            console.log(`logout error ${error}`);
          }
        }}
      />
    </ScrollView>
  );
};

export {LeadGenScreen};
