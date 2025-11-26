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
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Timestamp } from 'firebase/firestore';
import Header from '../components/common/Header';
import { useTheme } from '../context/ThemeContext';
import { useUser } from '../context/UserContext';
import { RootStackParamList } from '../types/navigation';
import { UserCategory } from '../types/user';
import { styles } from './CategoriesScreen.styles';

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
  const params = route.params;
  const selectedColor = params?.selectedColor || theme.primary;

  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryEmoji, setNewCategoryEmoji] = useState('📁');
  const [isSaving, setIsSaving] = useState(false);

  // Get list of hidden/default categories that user has removed
  const hiddenCategories = useMemo(() => {
    return user?.preferences.hiddenCategories || [];
  }, [user?.preferences.hiddenCategories]);

  // Combine default categories with user's custom categories
  const allCategories = useMemo(() => {
    const userCategories = (user?.preferences.categories || []).map(cat => ({
      name: cat.name,
      emoji: cat.emoji || '📁',
      isCustom: true,
      id: cat.id,
    }));

    // Filter out hidden default categories
    const defaultCats = DEFAULT_CATEGORIES
      .filter(cat => !hiddenCategories.includes(cat.name))
      .map(cat => ({
        name: cat.name,
        emoji: cat.emoji,
        isCustom: false,
        id: cat.name,
      }));

    return [...defaultCats, ...userCategories];
  }, [user?.preferences.categories, hiddenCategories]);

  const handleCategoryPress = useCallback((category: { id: string; name: string; emoji: string; isCustom: boolean }) => {
    // Navegar a la pantalla de detalle de categoría
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
      Alert.alert('Error', 'Please enter a category name');
      return;
    }

    // Check if category already exists
    const exists = allCategories.some(cat => 
      cat.name.toLowerCase() === newCategoryName.trim().toLowerCase()
    );

    if (exists) {
      Alert.alert('Error', 'This category already exists');
      return;
    }

    setIsSaving(true);
    try {
      const currentCategories = user?.preferences.categories || [];
      const newCategory: UserCategory = {
        id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: newCategoryName.trim(),
        emoji: newCategoryEmoji,
        createdAt: Timestamp.now(),
      };

      await updatePreferences({
        categories: [...currentCategories, newCategory]
      });

      Alert.alert('Success', 'Category added successfully');
      setShowAddCategoryModal(false);
      setNewCategoryName('');
      setNewCategoryEmoji('📁');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Error adding category');
    } finally {
      setIsSaving(false);
    }
  }, [newCategoryName, newCategoryEmoji, allCategories, user?.preferences.categories, updatePreferences]);

  const handleOpenAddModal = useCallback(() => {
    setShowAddCategoryModal(true);
    setNewCategoryName('');
    setNewCategoryEmoji('📁');
  }, []);

  const handleCloseModal = useCallback(() => {
    if (!isSaving) {
      setShowAddCategoryModal(false);
      setNewCategoryName('');
      setNewCategoryEmoji('📁');
    }
  }, [isSaving]);

  return (
    <View style={[styles.rootWrapper, { backgroundColor: theme.background }]}>
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <StatusBar style="auto" />
        
        {/* Header */}
        <Header title="Categories" backgroundColor={selectedColor} />

        {/* Contenido principal */}
        <View style={[styles.content, { backgroundColor: theme.background }]}>
          {/* Grid de categorías */}
          <ScrollView 
            style={styles.categoriesContainer}
            contentContainerStyle={styles.categoriesGrid}
            showsVerticalScrollIndicator={false}
          >
            {allCategories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryButton,
                  { 
                    backgroundColor: 'white',
                    borderColor: selectedColor,
                  }
                ]}
                onPress={() => handleCategoryPress(category)}
                activeOpacity={0.7}
              >
                <Text style={styles.categoryEmoji}>{category.emoji}</Text>
                <Text style={[styles.categoryText, { color: selectedColor }]}>{category.name}</Text>
              </TouchableOpacity>
            ))}

            {/* Botón para añadir nueva categoría */}
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

      {/* Modal para añadir categoría */}
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

            {/* Input para el nombre */}
            <TextInput
              style={[styles.modalInput, { borderColor: theme.primary, color: theme.primary }]}
              placeholder="Category name"
              placeholderTextColor="#999"
              value={newCategoryName}
              onChangeText={setNewCategoryName}
              editable={!isSaving}
            />

            {/* Input para el emoji */}
            <TextInput
              style={[styles.modalInput, { borderColor: theme.primary, color: theme.primary }]}
              placeholder="Emoji (optional)"
              placeholderTextColor="#999"
              value={newCategoryEmoji}
              onChangeText={setNewCategoryEmoji}
              editable={!isSaving}
              maxLength={2}
            />

            {/* Botones de acción */}
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
                    opacity: (!newCategoryName.trim() || isSaving) ? 0.5 : 1
                  }
                ]}
                onPress={handleAddCategory}
                disabled={!newCategoryName.trim() || isSaving}
              >
                <Text style={styles.modalSaveButtonText}>Add</Text>
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

