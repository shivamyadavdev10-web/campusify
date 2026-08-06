import React from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, TouchableWithoutFeedback } from 'react-native';

interface BranchSelectModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (branch: any) => void;
  branches: any[];
  selectedBranchId?: string | null;
}

export function BranchSelectModal({ visible, onClose, onSelect, branches, selectedBranchId }: BranchSelectModalProps) {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View className="flex-1 justify-center items-center bg-black/40 px-4">
          <TouchableWithoutFeedback>
            <View className="w-full bg-white rounded-xl overflow-hidden max-h-[70%]">
              {/* Header */}
              <View className="bg-[#2563eb] py-4 px-5">
                <Text className="text-white font-semibold text-[15px]">All Branches</Text>
              </View>
              
              {/* List */}
              <ScrollView className="py-2">
                <TouchableOpacity 
                  className={`py-4 px-5 border-b border-gray-100 active:bg-gray-50 ${!selectedBranchId ? 'bg-blue-50/30' : ''}`}
                  onPress={() => onSelect(null)}
                >
                  <Text className={`text-[14px] ${!selectedBranchId ? 'text-[#2563eb] font-medium' : 'text-gray-700'}`}>
                    All Branches
                  </Text>
                </TouchableOpacity>

                {branches?.map((branch) => {
                  const isSelected = branch._id === selectedBranchId;
                  const safeName = branch.name || 'Unknown';
                  const shortName = branch.shortName || '';
                  const displayName = shortName ? `${shortName} - ${safeName}` : safeName;

                  return (
                    <TouchableOpacity 
                      key={branch._id}
                      className={`py-4 px-5 border-b border-gray-100 active:bg-gray-50 ${isSelected ? 'bg-blue-50/30' : ''}`}
                      onPress={() => onSelect(branch)}
                    >
                      <Text className={`text-[14px] ${isSelected ? 'text-[#2563eb] font-medium' : 'text-gray-700'}`}>
                        {displayName}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}
