export const colors = {
  // Brand Colors
  primary: '#3B82F6',       
  primaryDark: '#1D4ED8',
  primaryLight: '#EFF6FF',  

  // Background & Surfaces
  background: '#F9FAFB',    
  surface: '#FFFFFF',       
  
  // Text Colors
  textMain: '#111827',      
  textMuted: '#6B7280',     
  textLight: '#9CA3AF',     
  textWhite: '#FFFFFF',     
  
  // State Colors
  danger: '#EF4444',        
  dangerLight: '#FEF2F2',
  success: '#10B981',       
  successLight: '#ECFDF5',
  warning: '#F59E0B',       
  warningLight: '#FEF3C7',

  // Borders
  border: '#E5E7EB',        
};

// Centralized shadows to ensure consistent depth across Android (elevation) and iOS (shadows)
export const shadows = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  }
};