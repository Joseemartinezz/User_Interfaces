import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  profileButton: {
    width: 48,
    height: 48,
    borderRadius: 24, // Circular
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    overflow: 'hidden', // Asegura que la imagen no se salga del círculo
  },
  avatarContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 24,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
});

