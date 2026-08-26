import React from 'react';
import { View, Text, TouchableOpacity, Linking, Platform } from 'react-native';
import { ExternalLink, MessageCircle } from 'lucide-react-native';

interface DetailsBottomBarProps {
  detailsUrl?: string;
  whatsappNumber?: string;
  whatsappMessage?: string;
}

const barShadow = Platform.select({
  ios: { shadowColor: '#000', shadowOffset: { width: 0, height: -3 }, shadowOpacity: 0.1, shadowRadius: 8 },
  android: { elevation: 12 },
  default: {},
});

export default function DetailsBottomBar({ 
  detailsUrl = 'https://campusifyplus.in/online-classes/', 
  whatsappNumber = '917977675291',
  whatsappMessage = 'Hi, I\'m interested in Campusify Online Classes 👋'
}: DetailsBottomBarProps) {
  const handleDetails = () => {
    Linking.openURL(detailsUrl).catch(() => {});
  };

  const handleWhatsApp = () => {
    const encodedMsg = encodeURIComponent(whatsappMessage);
    Linking.openURL(`https://wa.me/${whatsappNumber}?text=${encodedMsg}`).catch(() => {});
  };

  return (
    <View 
      className="bg-white border-t border-[#e5e7eb] px-4 py-3"
      style={barShadow}
    >
      <View className="flex-row items-center gap-3">
        {/* WhatsApp Button */}
        <TouchableOpacity 
          onPress={handleWhatsApp}
          className="w-[44px] h-[44px] rounded-xl bg-[#25D366] items-center justify-center active:scale-95"
          style={{ elevation: 3 }}
        >
          <MessageCircle color="#ffffff" size={20} fill="#ffffff" />
        </TouchableOpacity>

        {/* Get More Details Button */}
        <TouchableOpacity 
          onPress={handleDetails}
          className="flex-1 bg-[#2563eb] rounded-xl py-3 px-5 flex-row items-center justify-center active:bg-[#1d4ed8] active:scale-[0.98]"
          style={{ elevation: 3 }}
        >
          <ExternalLink color="#ffffff" size={16} />
          <Text className="text-white font-bold text-[14px] ml-2">Get More Details</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
