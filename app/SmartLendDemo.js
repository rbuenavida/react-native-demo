/*
 * sqlite.ios.promise.js
 *
 * Created by Andrzej Porebski on 10/29/15.
 * Copyright (c) 2015 Andrzej Porebski.
 *
 * Test App using Promise for react-naive-sqlite-storage
 *
 * This library is available under the terms of the MIT License (2008).
 * See http://opensource.org/licenses/alphabetical for full text.
 */
'use strict';

import React, { Component } from 'react';
import {
  AppRegistry,
  StyleSheet,
  Text,
  View,
  ListView,
  Button
} from 'react-native';

import SmsListener from 'react-native-android-sms-listener';
import SendSmsAndroid from 'react-native-sms-android';
import Store from './db/store';

const onSms = (message) => {
  let wordsRegex = /\s*\s/
  let messageWords = message.body.split(wordsRegex)

  // check received phone number
  let originator = message.originator;
  // console.info(messageWords, message)

  if (messageWords[0] === "ping") {
    SendSmsAndroid.sms(
      message.originatingAddress, // phone number to send sms to
      'pong', // sms body
      'sendDirect', // sendDirect or sendIndirect
      (err, message) => {
        if (err){
          console.log("error");
        } else {
          console.log(message); // callback message
        }
      }
    );
  }

  if (messageWords[0] === "config") {
    let [key, value] = messageWords[1].split(':')
    Store.upsertSetting(key, value).catch((error) => console.log(error));
  }
}

// register only once, otherwise everytime the component get's mounted
// it will add another listener. Lifecycle hooks don't seem to work
const subscription = SmsListener.addListener(onSms)

const setConfigRows = (result) => (prevState) => {
  let rows = [];
  for (let i = 0; i < result.rows.length; i++) {
    rows.push(result.rows.item(i).name + ' : ' + result.rows.item(i).value)
  }
  return { rows: rows }
}

export default class SmartLendDemo extends Component {
  constructor(props) {
    super(props)
    this.state = {
      rows: []
    }
  }

  getConfig = () => {
    Store.getSettings().then((result) => {
      this.setState(setConfigRows(result))
    })
  }

  renderRow = (entry) => {
    return (
      <View style={listStyles.li}>
        <View>
          <Text style={listStyles.liText}>{entry}</Text>
        </View>
      </View>
    )
  }

  render() {
    var ds = new ListView.DataSource({ rowHasChanged: (row1, row2) => { row1 !== row2; } });
    return (
      <View style={styles.mainContainer}>
        <View style={styles.toolbar}>
          <Button 
            color="#1e93f6" 
            onPress={this.getConfig} 
            title="Show Config"
            />
        </View>  
        <ListView
          enableEmptySections={true}
          dataSource={ds.cloneWithRows(this.state.rows)}
          renderRow={this.renderRow}
          style={listStyles.liContainer} />  
      </View>
    )
  }
}

var styles = StyleSheet.create({
  mainContainer: {
    flex:1,
    flexDirection: 'column',
    alignSelf: 'stretch',
  },
  toolbar: {
    flexDirection: 'row',
    justifyContent:'center'
  },
});

var listStyles = StyleSheet.create({
  li: {
    borderBottomColor: '#c8c7cc',
    borderBottomWidth: 0.5,
    paddingTop: 15,
    paddingRight: 15,
    paddingBottom: 15,
  },

  liText: {
    color: '#333',
    fontSize: 17,
    fontWeight: '400',
    marginBottom: -3.5,
    marginTop: -3.5,
  },
  liContainer: {
    alignSelf: 'stretch',
  }
});


