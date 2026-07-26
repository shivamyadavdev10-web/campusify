import React from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { Search, X } from 'lucide-react-native';
import { colors } from '../../theme/colors.theme';
import { typography } from '../../theme/typography.theme';

export default function SearchBar({ value, onChangeText, placeholder = "Search..." }) {
  return (
    <View style={styles.searchContainer}>
      <Search color={colors.textLight} size={20} style={styles.searchIcon} />
      <TextInput
        style={styles.searchInput}
        placeholder={placeholder}
        placeholderTextColor={colors.textLight}
        value={value}
        onChangeText={onChangeText}
        returnKeyType="search"
        autoCorrect={false}
      />
      {/* Show clear button only if text exists */}
      {value?.length > 0 && (
        <TouchableOpacity onPress={() => onChangeText('')} style={styles.clearBtn}>
          <X color={colors.textLight} size={20} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  searchContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: colors.surface, 
    width: '100%',     
    height: '100%',    
    borderRadius: 12, 
    paddingHorizontal: 16, 
    borderWidth: 1, 
    borderColor: colors.border,
    // 🗑️ marginHorizontal aur marginBottom HATA DIYA HAI (Ye hi culprit the!)
  },
  searchIcon: { 
    marginRight: 12 
  },
  searchInput: { 
    flex: 1, 
    fontSize: typography.size.md, 
    color: colors.textMain,
    fontFamily: typography.fontFamily.regular 
  },
  clearBtn: {
    padding: 4,
  }
});