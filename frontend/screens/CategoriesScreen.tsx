import React, { useCallback, useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Modal,
  TextInput,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Timestamp } from 'firebase/firestore';
import Header from '../components/common/Header';
import { useTheme } from '../context/ThemeContext';
import { useUser } from '../context/UserContext';
import { useToast } from '../context/ToastContext';
import { RootStackParamList } from '../types/navigation';
import { UserCategory } from '../types/user';
import { styles } from './CategoriesScreen.styles';
import { createCategoryWithPictograms } from '../api';

type CategoriesParams = {
  selectedColor?: string;
};

// Predefined categories with emojis (default categories)
const DEFAULT_CATEGORIES = [
  { name: 'Food', emoji: '🍕' },
  { name: 'Games', emoji: '🎮' },
  { name: 'School', emoji: '🏫' },
  { name: 'Family', emoji: '👨‍👩‍👧‍👦' },
  { name: 'Sports', emoji: '⚽' },
  { name: 'Music', emoji: '🎵' },
  { name: 'Animals', emoji: '🐾' },
  { name: 'Transport', emoji: '🚗' },
];

/**
 * Categories management screen
 * Allows users to manage their categories: add new ones and remove custom ones
 * Optimized with useCallback and useMemo for better performance
 */
const CategoriesScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<{ params: CategoriesParams }, 'params'>>();
  const { theme } = useTheme();
  const { user, updatePreferences } = useUser();
  const { showSuccess, showError, showWarning } = useToast();
  const params = route.params;
  const selectedColor = params?.selectedColor || theme.primary;

  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryEmoji, setNewCategoryEmoji] = useState('📁');
  const [isSaving, setIsSaving] = useState(false);
  const [includeStandardSymbols, setIncludeStandardSymbols] = useState(false);
  const [categoryDescription, setCategoryDescription] = useState('');

  // Get list of hidden/default categories that user has removed
  const hiddenCategories = useMemo(() => {
    return user?.preferences.hiddenCategories || [];
  }, [user?.preferences.hiddenCategories]);

  // Combine default categories with user's custom categories
  // Include hidden categories but mark them as hidden
  // Sort to show hidden categories at the end
  const allCategories = useMemo(() => {
    const userCategories = (user?.preferences.categories || []).map(cat => ({
      name: cat.name,
      emoji: cat.emoji || '📁',
      isCustom: true,
      id: cat.id,
      isHidden: hiddenCategories.includes(cat.name),
    }));

    // Include all default categories (both visible and hidden)
    const defaultCats = DEFAULT_CATEGORIES.map(cat => ({
      name: cat.name,
      emoji: cat.emoji,
      isCustom: false,
      id: cat.name,
      isHidden: hiddenCategories.includes(cat.name),
    }));

    const all = [...defaultCats, ...userCategories];

    // Sort: visible categories first, hidden categories at the end
    return all.sort((a, b) => {
      if (a.isHidden === b.isHidden) return 0;
      return a.isHidden ? 1 : -1;
    });
  }, [user?.preferences.categories, hiddenCategories]);

  const handleCategoryPress = useCallback((category: { id: string; name: string; emoji: string; isCustom: boolean; isHidden?: boolean }) => {
    // Navigate to category detail screen
    navigation.navigate('CategoryDetail', {
      categoryId: category.id,
      categoryName: category.name,
      categoryEmoji: category.emoji,
      isCustom: category.isCustom,
      selectedColor,
    });
  }, [navigation, selectedColor]);


  const handleAddCategory = useCallback(async () => {
    if (!newCategoryName.trim()) {
      showError('Please enter a category name');
      return;
    }

    // Validate description if including standard symbols
    if (includeStandardSymbols) {
      if (!categoryDescription.trim()) {
        showError('Please enter a description of what this category will include');
        return;
      }
    }

    const finalCategoryName = newCategoryName.trim();

    // Check if category already exists
    const exists = allCategories.some(cat =>
      cat.name.toLowerCase() === finalCategoryName.toLowerCase()
    );

    if (exists) {
      showError('This category already exists');
      return;
    }

    setIsSaving(true);
    try {

      // If including standard symbols, create category in backend first
      if (includeStandardSymbols) {
        try {
          await createCategoryWithPictograms(
            finalCategoryName,
            categoryDescription.trim(),
            50,
            user?.id // Pass current user's userId
          );
        } catch (backendError: any) {
          // If backend creation fails, still allow creating the category in Firebase
          // but warn the user
          console.warn('⚠️ Failed to create category in backend:', backendError);
          showWarning('Could not add standard symbols. The category will be created without them.');
        }
      }

      // Create category in Firebase
      const currentCategories = user?.preferences.categories || [];
      const newCategory: UserCategory = {
        id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: finalCategoryName,
        emoji: newCategoryEmoji,
        createdAt: Timestamp.now(),
      };

      await updatePreferences({
        categories: [...currentCategories, newCategory]
      });

      showSuccess(
        includeStandardSymbols
          ? 'Category added successfully with standard symbols'
          : 'Category added successfully. You can add custom symbols manually.'
      );

      // Reset form
      setShowAddCategoryModal(false);
      setNewCategoryName('');
      setNewCategoryEmoji('📁');
      setIncludeStandardSymbols(false);
      setCategoryDescription('');
    } catch (error: any) {
      showError(error.message || 'Error adding category');
    } finally {
      setIsSaving(false);
    }
  }, [
    newCategoryName,
    newCategoryEmoji,
    allCategories,
    user?.preferences.categories,
    updatePreferences,
    includeStandardSymbols,
    categoryDescription
  ]);

  const handleOpenAddModal = useCallback(() => {
    setShowAddCategoryModal(true);
    setNewCategoryName('');
    setNewCategoryEmoji('📁');
    setIncludeStandardSymbols(false);
    setCategoryDescription('');
  }, []);

  const handleCloseModal = useCallback(() => {
    if (!isSaving) {
      setShowAddCategoryModal(false);
      setNewCategoryName('');
      setNewCategoryEmoji('📁');
      setIncludeStandardSymbols(false);
      setCategoryDescription('');
    }
  }, [isSaving]);

  return (
    <View style={[styles.rootWrapper, { backgroundColor: theme.background }]}>
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <StatusBar style="auto" />

        {/* Header */}
        <Header title="Categories" backgroundColor={selectedColor} showProfile={false} />

        {/* Main content */}
        <View style={[styles.content, { backgroundColor: theme.background }]}>
          {/* Categories grid */}
          <ScrollView
            style={styles.categoriesContainer}
            contentContainerStyle={styles.categoriesGrid}
            showsVerticalScrollIndicator={false}
          >
            {allCategories.map((category) => {
              const isHidden = category.isHidden || false;
              return (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryButton,
                    {
                      backgroundColor: isHidden ? '#f5f5f5' : 'white',
                      borderColor: isHidden ? '#d0d0d0' : selectedColor,
                    },
                    isHidden && styles.hiddenCategoryButton,
                  ]}
                  onPress={() => handleCategoryPress(category)}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.categoryEmoji,
                    isHidden && styles.hiddenCategoryEmoji
                  ]}>{category.emoji}</Text>
                  <Text style={[
                    styles.categoryText,
                    { color: isHidden ? '#999999' : selectedColor },
                    isHidden && styles.hiddenCategoryText
                  ]}>{category.name}</Text>
                </TouchableOpacity>
              );
            })}

            {/* Button to add new category */}
            <TouchableOpacity
              style={[
                styles.addCategoryButton,
                {
                  backgroundColor: theme.secondary,
                  borderColor: selectedColor,
                  borderWidth: 2,
                  borderStyle: 'dashed',
                }
              ]}
              onPress={handleOpenAddModal}
              activeOpacity={0.7}
            >
              <Text style={styles.addIcon}>➕</Text>
              <Text style={[styles.addText, { color: selectedColor }]}>Add Category</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </SafeAreaView>

      {/* Modal to add category */}
      <Modal
        visible={showAddCategoryModal}
        transparent={true}
        animationType="slide"
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.white }]}>
            <Text style={[styles.modalTitle, { color: theme.primary }]}>
              Add New Category
            </Text>

            {/* Name input */}
            <TextInput
              style={[styles.modalInput, { borderColor: theme.primary, color: theme.primary }]}
              placeholder="Category name"
              placeholderTextColor="#999"
              value={newCategoryName}
              onChangeText={setNewCategoryName}
              editable={!isSaving}
            />

            {/* Emoji input */}
            <TextInput
              style={[styles.modalInput, { borderColor: theme.primary, color: theme.primary }]}
              placeholder="Emoji (optional)"
              placeholderTextColor="#999"
              value={newCategoryEmoji}
              onChangeText={setNewCategoryEmoji}
              editable={!isSaving}
              maxLength={2}
            />

            {/* Toggle to include standard PCS symbols */}
            <View style={styles.switchContainer}>
              <Text style={[styles.switchLabel, { color: theme.primary }]}>
                Include standard PCS symbols
              </Text>
              <Switch
                value={includeStandardSymbols}
                onValueChange={setIncludeStandardSymbols}
                disabled={isSaving}
                trackColor={{ false: theme.accent, true: theme.primary }}
                thumbColor="white"
              />
            </View>

            {/* Conditional fields for standard symbols */}
            {includeStandardSymbols && (
              <TextInput
                style={[
                  styles.modalInput,
                  styles.modalTextArea,
                  { borderColor: theme.primary, color: theme.primary }
                ]}
                placeholder="Description of this category (e.g. Feelings and emotional states like happy, sad, angry, excited)"
                placeholderTextColor="#999"
                value={categoryDescription}
                onChangeText={setCategoryDescription}
                editable={!isSaving}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            )}

            {/* Action buttons */}
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton, { borderColor: theme.accent }]}
                onPress={handleCloseModal}
                disabled={isSaving}
              >
                <Text style={[styles.modalButtonText, { color: theme.primary }]}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.modalSaveButton,
                  {
                    backgroundColor: theme.primary,
                    opacity: (
                      !newCategoryName.trim() ||
                      isSaving ||
                      (includeStandardSymbols && !categoryDescription.trim())
                    ) ? 0.5 : 1
                  }
                ]}
                onPress={handleAddCategory}
                disabled={
                  !newCategoryName.trim() ||
                  isSaving ||
                  (includeStandardSymbols && !categoryDescription.trim())
                }
              >
                {isSaving ? (
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
export default React.memo(CategoriesScreen);

