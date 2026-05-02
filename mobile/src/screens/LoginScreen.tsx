import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, SafeAreaView, KeyboardAvoidingView, Platform, Image } from 'react-native';
import tw from 'twrnc';
import { Mail, Lock, LogIn, Sparkles } from 'lucide-react-native';

export const LoginScreen = ({ navigation }: any) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <SafeAreaView style={tw`flex-1 bg-[#020617]`}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={tw`flex-1 px-8 justify-center`}
      >
        <View style={tw`items-center mb-12`}>
          <View style={tw`w-20 h-20 bg-primary-500 rounded-3xl items-center justify-center mb-6 shadow-lg`}>
            <Sparkles color="white" size={40} />
          </View>
          <Text style={tw`text-4xl font-black text-white tracking-tighter`}>Scholara</Text>
          <Text style={tw`text-primary-200/40 font-bold uppercase tracking-widest mt-2 text-xs`}>Mobile Intelligence</Text>
        </View>

        <View style={tw`space-y-4`}>
          <View style={tw`relative mb-4`}>
            <View style={tw`absolute left-4 top-4 z-10`}>
              <Mail color="#94a3b8" size={20} />
            </View>
            <TextInput
              style={tw`bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white font-medium`}
              placeholder="Email Address"
              placeholderTextColor="#475569"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
            />
          </View>

          <View style={tw`relative mb-8`}>
            <View style={tw`absolute left-4 top-4 z-10`}>
              <Lock color="#94a3b8" size={20} />
            </View>
            <TextInput
              style={tw`bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white font-medium`}
              placeholder="Password"
              placeholderTextColor="#475569"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <TouchableOpacity 
            onPress={() => navigation.navigate('Dashboard')}
            style={tw`bg-primary-500 rounded-3xl py-5 flex-row items-center justify-center shadow-lg`}
          >
            <Text style={tw`text-white font-black text-xl mr-3`}>Sign In</Text>
            <LogIn color="white" size={24} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={tw`mt-8 items-center`}>
          <Text style={tw`text-primary-200/40 font-bold`}>Forgot Password?</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};
