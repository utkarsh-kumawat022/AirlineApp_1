import { Image } from 'expo-image';
import { Platform, StyleSheet } from 'react-native';
import React, {useEffect, useState} from 'react';
import {View, Text, FlatList, TouchableOpacity, Alert} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';


export default function ExploreTab(){
  const [saved, setSaved] = useState<any[]>([]);
  useEffect(()=>{ load(); },[]);
  async function load(){ const s = await AsyncStorage.getItem('savedSearches') || '[]'; setSaved(JSON.parse(s)); }
  async function remove(id:any){ const s = await AsyncStorage.getItem('savedSearches') || '[]'; const arr=JSON.parse(s).filter((x:any)=>x.id!==id); await AsyncStorage.setItem('savedSearches', JSON.stringify(arr)); setSaved(arr); }

  return (
    <View style={{flex:1,padding:16, marginTop:40}}>
      <Text style={{fontSize:20,fontWeight:'700', marginBottom:10}}>Saved Searches</Text>
      <FlatList data={saved} keyExtractor={i=>i.id.toString()} renderItem={({item})=> (
        <TouchableOpacity onPress={()=>Alert.alert('Run search', `Origin: ${item.origin} - Dest: ${item.destination} - Date: ${item.departDate}`)} style={{padding:12,borderWidth:1,marginVertical:6,borderRadius:8}}>
          <Text>{item.origin} → {item.destination} • {item.departDate}</Text>
          <TouchableOpacity onPress={()=>remove(item.id)}><Text style={{color:'red'}}>Remove</Text></TouchableOpacity>
        </TouchableOpacity>
      )} />
    </View>
  );
}

// end of explore tab
