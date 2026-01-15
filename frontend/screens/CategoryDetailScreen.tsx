import React, { useCallback, useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Modal,
  TextInput,
  Image,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import Header from '../components/common/Header';
import ConfirmModal from '../components/common/ConfirmModal';
import { useTheme } from '../context/ThemeContext';
import { useUser } from '../context/UserContext';
import { useToast } from '../context/ToastContext';
import { RootStackParamList } from '../types/navigation';
import { styles } from './CategoryDetailScreen.styles';
import { deleteCategoryWithPictograms } from '../api';

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
  const { user, updatePreferences, addCustomSymbol, removeCustomSymbol } = useUser();

  const params = route.params;
  const { categoryId, categoryName, categoryEmoji, isCustom, selectedColor = theme.primary } = params;

  const [showAddSymbolModal, setShowAddSymbolModal] = useState(false);
  const [symbolName, setSymbolName] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAddingSymbol, setIsAddingSymbol] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDeleteCategoryConfirm, setShowDeleteCategoryConfirm] = useState(false);
  const [symbolToDelete, setSymbolToDelete] = useState<{ id: string; word: string } | null>(null);
  const [isDeletingSymbol, setIsDeletingSymbol] = useState(false);
  const [isDeletingCategory, setIsDeletingCategory] = useState(false);
  const { showSuccess, showError, showInfo, showWarning } = useToast();

  // Check if category is hidden
  const isHidden = useMemo(() => {
    const hiddenCategories = user?.preferences.hiddenCategories || [];
    return hiddenCategories.includes(categoryName);
  }, [user?.preferences.hiddenCategories, categoryName]);

  // Get custom symbols for this category
  const categorySymbols = useMemo(() => {
    return (user?.preferences.customPCSSymbols || [])
      .filter(symbol => symbol.category === categoryName);
  }, [user?.preferences.customPCSSymbols, categoryName]);

  // Select image for custom symbol
  const handlePickImage = useCallback(async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        showWarning('We need permission to access your photos to add custom symbols.');
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
      showError(error.message || 'Error selecting image');
    }
  }, [showError]);

  // Save custom symbol
  const handleSaveSymbol = useCallback(async () => {
    if (!symbolName.trim()) {
      showError('Please enter a name for the symbol');
      return;
    }

    if (!selectedImage) {
      showError('Please select an image for the symbol');
      return;
    }

    setIsAddingSymbol(true);
    try {
      await addCustomSymbol({
        word: symbolName.trim(),
        imageUrl: selectedImage,
        category: categoryName,
      });

      showSuccess('Custom symbol added successfully');
      setShowAddSymbolModal(false);
      setSymbolName('');
      setSelectedImage(null);
    } catch (error: any) {
      showError(error.message || 'Error saving symbol');
    } finally {
      setIsAddingSymbol(false);
    }
  }, [symbolName, selectedImage, addCustomSymbol, categoryName]);

  // Open modal to add symbol
  const handleAddSymbol = useCallback(() => {
    setShowAddSymbolModal(true);
    setSymbolName('');
    setSelectedImage(null);
  }, []);

  // Close modal
  const handleCloseModal = useCallback(() => {
    if (!isAddingSymbol) {
      setShowAddSymbolModal(false);
      setSymbolName('');
      setSelectedImage(null);
    }
  }, [isAddingSymbol]);

  // Hide/show category
  const handleToggleVisibility = useCallback(async () => {
    try {
      const currentHidden = user?.preferences.hiddenCategories || [];

      if (isHidden) {
        // Show category (remove from hidden list)
        const updatedHidden = currentHidden.filter(name => name !== categoryName);
        await updatePreferences({
          hiddenCategories: updatedHidden
        });
        showSuccess('Category is now visible in PCS Screen');
      } else {
        // Hide category (add to hidden list)
        await updatePreferences({
          hiddenCategories: [...currentHidden, categoryName]
        });
        showSuccess('Category is now hidden from PCS Screen');
      }
    } catch (error: any) {
      showError(error.message || 'Error updating category visibility');
    }
  }, [isHidden, categoryName, user?.preferences.hiddenCategories, updatePreferences, showSuccess, showError]);

  // Open confirmation modal to delete symbol
  const handleDeleteSymbol = useCallback((symbolId: string, symbolWord: string) => {
    setSymbolToDelete({ id: symbolId, word: symbolWord });
    setShowDeleteModal(true);
  }, []);

  // Confirm symbol deletion
  const handleConfirmDeleteSymbol = useCallback(async () => {
    if (!symbolToDelete) return;

    setIsDeletingSymbol(true);
    try {
      await removeCustomSymbol(symbolToDelete.id);
      setShowDeleteModal(false);
      setSymbolToDelete(null);
      showSuccess('Symbol deleted successfully');
    } catch (error: any) {
      showError(error.message || 'Error deleting symbol');
    } finally {
      setIsDeletingSymbol(false);
    }
  }, [symbolToDelete, removeCustomSymbol]);

  // Cancel symbol deletion
  const handleCancelDeleteSymbol = useCallback(() => {
    if (!isDeletingSymbol) {
      setShowDeleteModal(false);
      setSymbolToDelete(null);
    }
  }, [isDeletingSymbol]);

  // Delete category
  const handleDeleteCategory = useCallback(() => {
    if (!isCustom) {
      showInfo('Default categories cannot be deleted, but you can hide them.');
      return;
    }
    setShowDeleteCategoryConfirm(true);
  }, [isCustom, showInfo]);

  const performDeleteCategory = useCallback(async () => {
    setShowDeleteCategoryConfirm(false);
    setIsDeletingCategory(true);
    try {
      // Step 1: Delete from backend (JSON file with pictograms)
      // This ensures the category's pictogram mappings are removed from the user's file
      try {
        await deleteCategoryWithPictograms(categoryName, user?.id);
        console.log(`✅ Category "${categoryName}" removed from backend`);
      } catch (backendError: any) {
        // Log warning but continue - category might not exist in backend yet
        console.warn(`⚠️ Could not delete from backend: ${backendError.message}`);
        // Don't throw - we still want to remove from Firebase
      }

      // Step 2: Delete from Firebase (user preferences)
      const currentCategories = user?.preferences.categories || [];
      const updatedCategories = currentCategories.filter(cat => cat.id !== categoryId);

      await updatePreferences({
        categories: updatedCategories
      });

      // Step 3: Remove custom symbols associated with this category
      const currentSymbols = user?.preferences.customPCSSymbols || [];
      const updatedSymbols = currentSymbols.filter(symbol => symbol.category !== categoryName);

      if (updatedSymbols.length !== currentSymbols.length) {
        await updatePreferences({
          customPCSSymbols: updatedSymbols
        });
        console.log(`🗑️ Removed ${currentSymbols.length - updatedSymbols.length} custom symbols from category "${categoryName}"`);
      }

      showSuccess('Category deleted successfully');
      navigation.goBack();
    } catch (error: any) {
      console.error('❌ Error deleting category:', error);
      showError(error.message || 'Error deleting category');
    } finally {
      setIsDeletingCategory(false);
    }
  }, [categoryId, categoryName, user?.id, user?.preferences.categories, user?.preferences.customPCSSymbols, updatePreferences, navigation, showSuccess, showError]);

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

        {/* Main content */}
        <ScrollView
          style={[styles.content, { backgroundColor: theme.background }]}
          contentContainerStyle={styles.contentContainer}
        >
          {/* Category info */}
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

          {/* Custom symbols */}
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
                    <TouchableOpacity
                      style={[styles.deleteSymbolButton, { backgroundColor: '#e74c3c' }]}
                      onPress={() => handleDeleteSymbol(symbol.id, symbol.word)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.deleteSymbolButtonText}>×</Text>
                    </TouchableOpacity>
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
                No custom symbols yet.
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

          {/* Category actions */}
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

      {/* Modal to add custom symbol */}
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

            {/* Name input */}
            <TextInput
              style={[styles.modalInput, { borderColor: theme.primary, color: theme.primary }]}
              placeholder="Symbol name"
              placeholderTextColor="#999"
              value={symbolName}
              onChangeText={setSymbolName}
              editable={!isAddingSymbol}
            />

            {/* Select image button */}
            <TouchableOpacity
              style={[styles.imagePickerButton, { borderColor: theme.primary }]}
              onPress={handlePickImage}
              disabled={isAddingSymbol}
            >
              <Text style={[styles.imagePickerText, { color: theme.primary }]}>
                {selectedImage ? 'Change Image' : 'Select Image'}
              </Text>
            </TouchableOpacity>

            {/* Image preview */}
            {selectedImage && (
              <View style={styles.imagePreviewContainer}>
                <Image
                  source={{ uri: selectedImage }}
                  style={styles.imagePreview}
                  resizeMode="contain"
                />
              </View>
            )}

            {/* Action buttons */}
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

      {/* Confirmation modal to delete symbol */}
      <Modal
        visible={showDeleteModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCancelDeleteSymbol}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.white }]}>
            <Text style={[styles.modalTitle, { color: theme.primary }]}>
              Delete Symbol
            </Text>
            <Text style={[styles.modalSubtitle, { color: theme.accent }]}>
              Are you sure you want to delete "{symbolToDelete?.word}"? This action cannot be undone.
            </Text>

            {/* Action buttons */}
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton, { borderColor: theme.accent }]}
                onPress={handleCancelDeleteSymbol}
                disabled={isDeletingSymbol}
              >
                <Text style={[styles.modalButtonText, { color: theme.primary }]}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.modalDeleteButton,
                  {
                    backgroundColor: '#e74c3c',
                    opacity: isDeletingSymbol ? 0.5 : 1
                  }
                ]}
                onPress={handleConfirmDeleteSymbol}
                disabled={isDeletingSymbol}
              >
                {isDeletingSymbol ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.modalDeleteButtonText}>Delete</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Confirmation Modal for Category Deletion */}
      <ConfirmModal
        visible={showDeleteCategoryConfirm}
        title="Delete Category"
        message={`Are you sure you want to delete "${categoryName}"? This action cannot be undone.`}
        icon="🗑️"
        buttons={[
          { text: 'Cancel', onPress: () => setShowDeleteCategoryConfirm(false), style: 'cancel' },
          { text: 'Delete', onPress: performDeleteCategory, style: 'destructive' },
        ]}
        onDismiss={() => setShowDeleteCategoryConfirm(false)}
      />
    </View>
  );
};

// Memoize component to avoid unnecessary re-renders
export default React.memo(CategoryDetailScreen);

