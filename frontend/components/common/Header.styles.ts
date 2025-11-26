import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerContent: {
    flex: 1,
  },
  headerContentCentered: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
  },
  headerTitleSmall: {
    fontSize: 20,
  },
  headerTitleMedium: {
    fontSize: 24,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'white',
    marginTop: 4,
    opacity: 0.9,
  },
  headerSubtitleSmall: {
    fontSize: 13,
    marginTop: 2,
  },
  profileContainer: {
    marginLeft: 16,
  },
  placeholder: {
    width: 48, // Mismo ancho que los botones para mantener el balance
  },
});

