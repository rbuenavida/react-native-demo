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

import SmsListener from 'react-native-android-sms-listener'
import Store from './db/store';

export default class SmartLendDemo extends Component {
  constructor(props) {
    super(props)
    this.state = {
      progress: []
    }
    this.subscription = null;
  }

  componentWillMount () {
    this.subscription = SmsListener.addListener(message => {
      console.info(message)
    })
  }

  componentWillUnmount () {
    this.subscription.remove()
  }

  updateProgress = (text) => {
    let progress = [...this.state.progress]
    progress.push(text);
    this.setState({
      progress
    })
  }

  getConfig = () => {
    this.setState({
      progress: ["Starting Demo"]
    })
    Store.getEmployees().then((result) => {
      console.log(result)
      Array.apply(null, {length: result.rows.length}).map(
        (Number, idx) => this.updateProgress(result.rows.item(idx).name)
      )
    })
  }

  renderProgressEntry = (entry) => {
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
            title="Get Config"
            />
        </View>  
        <ListView
          enableEmptySections={true}
          dataSource={ds.cloneWithRows(this.state.progress)}
          renderRow={this.renderProgressEntry}
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


