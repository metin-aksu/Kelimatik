// src/screens/HomeScreen.tsx
import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SectionList,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {databaseConnection, Word} from '../db/database';

interface Section {
  title: string;
  data: Word[];
}

export const HomeScreen: React.FC = () => {
  const [searchText, setSearchText] = useState<string>('');
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [dbInitialized, setDbInitialized] = useState<boolean>(false);

  useEffect(() => {
    const initDB = async () => {
      try {
        setLoading(true);
        await databaseConnection.initDatabase();
        setDbInitialized(true);
      } catch (error) {
        Alert.alert('Hata', 'Veritabanı başlatılamadı: ' + error);
      } finally {
        setLoading(false);
      }
    };

    initDB();
  }, []);

  const groupWordsBySize = (words: Word[]): Section[] => {
    const groupedWords: {[key: number]: Word[]} = {};

    // Kelimeleri boyutlarına göre grupla
    words.forEach(word => {
      if (!groupedWords[word.boyut]) {
        groupedWords[word.boyut] = [];
      }
      groupedWords[word.boyut].push(word);
    });

    // Section'ları oluştur ve boyuta göre sırala
    return Object.entries(groupedWords)
      .map(([size, words]) => ({
        title: `${size} harfli kelimeler`,
        data: words,
      }))
      .sort(
        (a, b) =>
          parseInt(b.data[0].boyut.toString()) -
          parseInt(a.data[0].boyut.toString()),
      );
  };

  const handleSearch = async () => {
    if (searchText.trim() === '') return;
    if (!dbInitialized) {
      Alert.alert('Hata', 'Veritabanı henüz hazır değil');
      return;
    }

    setLoading(true);
    try {
      const results = await databaseConnection.searchWords(searchText);
      setSections(groupWordsBySize(results));
    } catch (error) {
      Alert.alert('Hata', 'Arama sırasında bir hata oluştu: ' + error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.input}
          value={searchText}
          onChangeText={setSearchText}
          placeholder="Harfleri girin..."
          placeholderTextColor="#666"
        />
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSearch}
          disabled={loading || !dbInitialized}>
          <Text style={styles.buttonText}>Ara</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={item => item.id.toString()}
          renderItem={({item}) => (
            <View style={styles.wordItem}>
              <Text style={styles.wordText}>{item.kelime}</Text>
            </View>
          )}
          renderSectionHeader={({section: {title}}) => (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionHeaderText}>{title}</Text>
            </View>
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  searchContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  input: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 16,
    marginRight: 8,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#007AFF',
    height: 48,
    paddingHorizontal: 24,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  wordItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
  },
  wordText: {
    fontSize: 16,
  },
  sectionHeader: {
    padding: 8,
    backgroundColor: '#f0f0f0',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  sectionHeaderText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
  },
});
