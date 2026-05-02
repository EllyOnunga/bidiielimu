import React from 'react';
import { View, Text, ScrollView, SafeAreaView, TouchableOpacity } from 'react-native';
import tw from 'twrnc';
import { Bell, GraduationCap, Calendar, CreditCard, User, ChevronRight, Activity } from 'lucide-react-native';

export const DashboardScreen = () => {
  return (
    <SafeAreaView style={tw`flex-1 bg-[#020617]`}>
      <ScrollView style={tw`px-6 pt-6`}>
        <View style={tw`flex-row justify-between items-center mb-10`}>
          <View>
            <Text style={tw`text-3xl font-black text-white tracking-tighter`}>Dashboard</Text>
            <Text style={tw`text-primary-200/40 font-bold uppercase tracking-widest text-[10px] mt-1`}>Welcome back, John</Text>
          </View>
          <TouchableOpacity style={tw`w-12 h-12 bg-white/5 rounded-2xl items-center justify-center border border-white/5`}>
            <Bell color="#94a3b8" size={24} />
          </TouchableOpacity>
        </View>

        {/* Quick Stats */}
        <View style={tw`flex-row gap-4 mb-10`}>
          <View style={tw`flex-1 bg-primary-500 rounded-[32px] p-6 shadow-lg`}>
            <GraduationCap color="white" size={24} />
            <Text style={tw`text-white/60 font-bold text-xs uppercase mt-4`}>Mean Score</Text>
            <Text style={tw`text-white text-3xl font-black mt-1`}>84%</Text>
          </View>
          <View style={tw`flex-1 bg-white/5 rounded-[32px] p-6 border border-white/10`}>
            <Activity color="#10b981" size={24} />
            <Text style={tw`text-primary-200/40 font-bold text-xs uppercase mt-4`}>Attendance</Text>
            <Text style={tw`text-white text-3xl font-black mt-1`}>96%</Text>
          </View>
        </View>

        {/* Menu Items */}
        <View style={tw`space-y-4 mb-20`}>
          <Text style={tw`text-primary-200/40 font-black uppercase tracking-widest text-[10px] ml-2 mb-2`}>Main Menu</Text>
          
          {[
            { title: 'Academic Reports', icon: GraduationCap, color: '#6366f1' },
            { title: 'Fee Statement', icon: CreditCard, color: '#10b981' },
            { title: 'School Calendar', icon: Calendar, color: '#f59e0b' },
            { title: 'Student Profile', icon: User, color: '#ec4899' },
          ].map((item, i) => (
            <TouchableOpacity 
              key={i}
              style={tw`bg-white/[0.03] border border-white/5 rounded-3xl p-5 flex-row items-center justify-between mb-3`}
            >
              <View style={tw`flex-row items-center`}>
                <View style={[tw`w-10 h-10 rounded-xl items-center justify-center mr-4`, { backgroundColor: `${item.color}20` }]}>
                  <item.icon color={item.color} size={20} />
                </View>
                <Text style={tw`text-white font-bold text-base`}>{item.title}</Text>
              </View>
              <ChevronRight color="#475569" size={20} />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
