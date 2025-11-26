import React, { useCallback, useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Modal,
  TextInput,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import Header from '../components/common/Header';
import { useTheme } from '../context/ThemeContext';
import { useUser } from '../context/UserContext';
import { RootStackParamList } from '../types/navigation';
import { styles } from './CategoryDetailScreen.styles';

type CategoryDetailParams = {
  categoryId: string;
  categoryName: string;
  categoryEmoji: string;
  isCustom: boolean;
  selectedColor?: string;
};

/**
 * Category detail screen
 * Allows users to manage a specific category:
 * - Add custom PCS symbols to the category
 * - Hide the category from PCSScreen
 * - Delete the category (if custom)
 */
const CategoryDetailScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<{ params: CategoryDetailParams }, 'params'>>();
  const { theme } = useTheme();
  const { user, updatePreferences, addCustomSymbol } = useUser();
  
  const params = route.params;
  const { categoryId, categoryName, categoryEmoji, isCustom, selectedColor = theme.primary } = params;

  const [showAddSymbolModal, setShowAddSymbolModal] = useState(false);
  const [symbolName, setSymbolName] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAddingSymbol, setIsAddingSymbol] = useState(false);

  // Verificar si la categoría está oculta
  const isHidden = useMemo(() => {
    const hiddenCategories = user?.preferences.hiddenCategories || [];
    return hiddenCategories.includes(categoryName);
  }, [user?.preferences.hiddenCategories, categoryName]);

  // Obtener símbolos personalizados de esta categoría
  const categorySymbols = useMemo(() => {
    return (user?.preferences.customPCSSymbols || [])
      .filter(symbol => symbol.category === categoryName);
  }, [user?.preferences.customPCSSymbols, categoryName]);

  // Seleccionar imagen para símbolo personalizado
  const handlePickImage = useCallback(async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'We need permission to access your photos to add custom symbols.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0].uri);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Error selecting image');
    }
  }, []);

  // Guardar símbolo personalizado
  const handleSaveSymbol = useCallback(async () => {
    if (!symbolName.trim()) {
      Alert.alert('Error', 'Please enter a name for the symbol');
      return;
    }

    if (!selectedImage) {
      Alert.alert('Error', 'Please select an image for the symbol');
      return;
    }

    setIsAddingSymbol(true);
    try {
      await addCustomSymbol({
        word: symbolName.trim(),
        imageUrl: selectedImage,
        category: categoryName,
      });

      Alert.alert('Success', 'Custom symbol added successfully');
      setShowAddSymbolModal(false);
      setSymbolName('');
      setSelectedImage(null);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Error saving symbol');
    } finally {
      setIsAddingSymbol(false);
    }
  }, [symbolName, selectedImage, addCustomSymbol, categoryName]);

  // Abrir modal para añadir símbolo
  const handleAddSymbol = useCallback(() => {
    setShowAddSymbolModal(true);
    setSymbolName('');
    setSelectedImage(null);
  }, []);

  // Cerrar modal
  const handleCloseModal = useCallback(() => {
    if (!isAddingSymbol) {
      setShowAddSymbolModal(false);
      setSymbolName('');
      setSelectedImage(null);
    }
  }, [isAddingSymbol]);

  // Ocultar/mostrar categoría
  const handleToggleVisibility = useCallback(async () => {
    try {
      const currentHidden = user?.preferences.hiddenCategories || [];
      
      if (isHidden) {
        // Mostrar categoría (eliminar de la lista de ocultas)
        const updatedHidden = currentHidden.filter(name => name !== categoryName);
        await updatePreferences({
          hiddenCategories: updatedHidden
        });
        Alert.alert('Success', 'Category is now visible in PCS Screen');
      } else {
        // Ocultar categoría (añadir a la lista de ocultas)
        await updatePreferences({
          hiddenCategories: [...currentHidden, categoryName]
        });
        Alert.alert('Success', 'Category is now hidden from PCS Screen');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Error updating category visibility');
    }
  }, [isHidden, categoryName, user?.preferences.hiddenCategories, updatePreferences]);

  // Eliminar categoría
  const handleDeleteCategory = useCallback(() => {
    Alert.alert(
      'Delete Category',
      `Are you sure you want to delete "${categoryName}"? This action cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              if (isCustom) {
                // Eliminar categoría personalizada
                const currentCategories = user?.preferences.categories || [];
                const updatedCategories = currentCategories.filter(cat => cat.id !== categoryId);
                
                await updatePreferences({
                  categories: updatedCategories
                });
                
                Alert.alert('Success', 'Category deleted successfully');
                navigation.goBack();
              } else {
                // Las categorías predeterminadas no se pueden eliminar, solo ocultar
                Alert.alert('Info', 'Default categories cannot be deleted, but you can hide them.');
              }
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Error deleting category');
            }
          },
        },
      ]
    );
  }, [categoryId, categoryName, isCustom, user?.preferences.categories, updatePreferences, navigation]);

  return (
    <View style={[styles.rootWrapper, { backgroundColor: theme.background }]}>
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <StatusBar style="auto" />
        
        {/* Header */}
        <Header 
          title={categoryName}
          backgroundColor={selectedColor}
          showBackButton={true}
        />

        {/* Contenido principal */}
        <ScrollView 
          style={[styles.content, { backgroundColor: theme.background }]}
          contentContainerStyle={styles.contentContainer}
        >
          {/* Información de la categoría */}
          <View style={[styles.categoryInfoCard, { backgroundColor: theme.white }]}>
            <Text style={styles.categoryEmojiLarge}>{categoryEmoji}</Text>
            <Text style={[styles.categoryNameLarge, { color: theme.primary }]}>{categoryName}</Text>
            <Text style={[styles.categoryType, { color: theme.accent }]}>
              {isCustom ? 'Custom Category' : 'Default Category'}
            </Text>
            <Text style={[styles.visibilityStatus, { color: isHidden ? theme.accent : theme.tertiary }]}>
              {isHidden ? '👁️‍🗨️ Hidden from PCS Screen' : '👁️ Visible in PCS Screen'}
            </Text>
          </View>

          {/* Símbolos personalizados */}
          <View style={[styles.section, { backgroundColor: theme.white }]}>
            <Text style={[styles.sectionTitle, { color: theme.primary }]}>
              Custom Symbols ({categorySymbols.length})
            </Text>
            
            {categorySymbols.length > 0 ? (
              <View style={styles.symbolsGrid}>
                {categorySymbols.map((symbol) => (
                  <View 
                    key={symbol.id} 
                    style={[styles.symbolCard, { borderColor: theme.accent }]}
                  >
                    <Image
                      source={{ uri: symbol.imageUrl }}
                      style={styles.symbolImage}
                      resizeMode="contain"
                    />
                    <Text style={[styles.symbolText, { color: theme.primary }]}>{symbol.word}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={[styles.emptyText, { color: theme.accent }]}>
                No custom symbols yet. Add one below!
              </Text>
            )}

            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: theme.primary }]}
              onPress={handleAddSymbol}
              activeOpacity={0.7}
            >
              <Text style={styles.actionButtonText}>➕ Add Custom Symbol</Text>
            </TouchableOpacity>
          </View>

          {/* Acciones de categoría */}
          <View style={[styles.section, { backgroundColor: theme.white }]}>
            <Text style={[styles.sectionTitle, { color: theme.primary }]}>Category Actions</Text>
            
            <TouchableOpacity
              style={[
                styles.actionButton, 
                { 
                  backgroundColor: isHidden ? theme.tertiary : theme.secondary,
                  borderWidth: 2,
                  borderColor: isHidden ? theme.tertiary : theme.primary,
                }
              ]}
              onPress={handleToggleVisibility}
              activeOpacity={0.7}
            >
              <Text style={[styles.actionButtonText, { color: theme.primary }]}>
                {isHidden ? '👁️ Show Category' : '👁️‍🗨️ Hide Category'}
              </Text>
            </TouchableOpacity>

            {isCustom && (
              <TouchableOpacity
                style={[styles.actionButton, styles.deleteButton, { backgroundColor: '#e74c3c' }]}
                onPress={handleDeleteCategory}
                activeOpacity={0.7}
              >
                <Text style={styles.actionButtonText}>🗑️ Delete Category</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* Modal para añadir símbolo personalizado */}
      <Modal
        visible={showAddSymbolModal}
        transparent={true}
        animationType="slide"
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.white }]}>
            <Text style={[styles.modalTitle, { color: theme.primary }]}>
              Add Custom Symbol
            </Text>
            <Text style={[styles.modalSubtitle, { color: theme.accent }]}>
              to {categoryName}
            </Text>

            {/* Input para el nombre */}
            <TextInput
              style={[styles.modalInput, { borderColor: theme.primary, color: theme.primary }]}
              placeholder="Symbol name"
              placeholderTextColor="#999"
              value={symbolName}
              onChangeText={setSymbolName}
              editable={!isAddingSymbol}
            />

            {/* Botón para seleccionar imagen */}
            <TouchableOpacity
              style={[styles.imagePickerButton, { borderColor: theme.primary }]}
              onPress={handlePickImage}
              disabled={isAddingSymbol}
            >
              <Text style={[styles.imagePickerText, { color: theme.primary }]}>
                {selectedImage ? 'Change Image' : 'Select Image'}
              </Text>
            </TouchableOpacity>

            {/* Vista previa de la imagen */}
            {selectedImage && (
              <View style={styles.imagePreviewContainer}>
                <Image
                  source={{ uri: selectedImage }}
                  style={styles.imagePreview}
                  resizeMode="contain"
                />
              </View>
            )}

            {/* Botones de acción */}
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton, { borderColor: theme.accent }]}
                onPress={handleCloseModal}
                disabled={isAddingSymbol}
              >
                <Text style={[styles.modalButtonText, { color: theme.primary }]}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.modalSaveButton,
                  { 
                    backgroundColor: theme.primary,
                    opacity: (!symbolName.trim() || !selectedImage || isAddingSymbol) ? 0.5 : 1
                  }
                ]}
                onPress={handleSaveSymbol}
                disabled={!symbolName.trim() || !selectedImage || isAddingSymbol}
              >
                {isAddingSymbol ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.modalSaveButtonText}>Add</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

// Memoize component to avoid unnecessary re-renders
export default React.memo(CategoryDetailScreen);

