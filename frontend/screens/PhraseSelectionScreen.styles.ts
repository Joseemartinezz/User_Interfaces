import { StyleSheet, Dimensions } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const styles = StyleSheet.create({
  rootWrapper: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  
  // Flashcard Container
  flashcardContainer: {
    width: SCREEN_WIDTH * 0.9,
    height: SCREEN_HEIGHT * 0.65,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    marginHorizontal: SCREEN_WIDTH * 0.05,
  },
  flashcardContainerSelected: {
    height: SCREEN_HEIGHT * 0.75,
  },
  
  // Flashcard Touchable Wrapper
  flashcardTouchable: {
    width: '100%',
    height: '100%',
  },
  
  // Flashcard
  flashcard: {
    width: '100%',
    height: '95%',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 10,
    overflow: 'hidden',
    borderWidth: 0,
    justifyContent: 'space-between',
  },
  flashcardSelected: {
    height: '95%',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 15,
  },
  
  // Image Container
  imageContainer: {
    width: '100%',
    height: '64%',
    backgroundColor: '#f5f5f5',
    flexShrink: 0,
  },
  phraseImage: {
    width: '100%',
    height: '100%',
  },
  imageLoadingContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  imageLoadingText: {
    fontSize: 16,
    fontWeight: '500',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderEmoji: {
    fontSize: 80,
  },
  
  // Phrase Text
  phraseTextContainer: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 6,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 45,
    flexShrink: 0,
  },
  phraseText: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 32,
  },
  phraseTextLarge: {
    fontSize: 26,
    lineHeight: 36,
  },
  
  // Audio Button
  audioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    marginHorizontal: 20,
    marginTop: 8,
    borderRadius: 12,
    gap: 10,
  },
  audioButtonLarge: {
    paddingVertical: 18,
    marginTop: 12,
  },
  audioIcon: {
    fontSize: 24,
  },
  audioIconLarge: {
    fontSize: 28,
  },
  audioButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  audioButtonTextLarge: {
    fontSize: 18,
  },
  
  // Select Button
  selectButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginHorizontal: 20,
    marginTop: 2,
    marginBottom: 20,
    borderRadius: 12,
    alignItems: 'center',
    flexShrink: 0,
  },
  selectButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Selected View
  selectedFlashcardWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  selectedActionButtons: {
    padding: 16,
    gap: 12,
  },
  deselectButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  deselectButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Action Buttons
  actionButtons: {
    padding: 16,
    gap: 12,
  },
  generateButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  generateButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  homeButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  homeButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Empty State
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
  },
  
  // Carousel Wrapper
  carouselWrapper: {
    position: 'relative',
    flex: 1,
  },
  
  // FlatList Content
  flatListContent: {
    paddingHorizontal: 0,
  },
  
  // Arrow Indicators
  arrowIndicator: {
    position: 'absolute',
    top: '50%',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#808080',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    opacity: 0.4,
    transform: [{ translateY: -16 }],
  },
  arrowLeft: {
    left: 5,
  },
  arrowRight: {
    right: 5,
  },
  arrowText: {
    color: 'white',
    fontSize: 26,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 32,
    includeFontPadding: false,
  },
  
  // Dots Container
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 8,
    marginTop: -8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
