import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function useLocalAuth(){
  const [user, setUser] = useState<any>(null);
  useEffect(()=>{ AsyncStorage.getItem('user').then((u: string | null) => { if(u) setUser(JSON.parse(u)); }); },[]);
  async function login(name:string){ const u={name}; await AsyncStorage.setItem('user', JSON.stringify(u)); setUser(u); }
  async function logout(){ await AsyncStorage.removeItem('user'); setUser(null); }
  return { user, login, logout };
}
