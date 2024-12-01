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
  Platform,
} from 'react-native';
import {Picker} from '@react-native-picker/picker';
import {databaseConnection, Word, SearchType} from '../db/database';

interface Section {
  title: string;
  data: Word[];
}

export const HomeScreen: React.FC = () => {
  const [searchText, setSearchText] = useState<string>('');
  const [searchType, setSearchType] = useState<SearchType>(SearchType.CONTAIN);
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [dbInitialized, setDbInitialized] = useState<boolean>(false);
  const [isError, setIsError] = useState<string>('');

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

  const renderWord = ({item}: {item: Word}) => (
    <View style={styles.wordItem}>
      <Text style={styles.wordText}>{item?.kelime}</Text>
    </View>
  );

  const groupWordsBySize = (words: Word[]): Section[] => {
    const groupedWords: {[key: number]: Word[]} = {};

    words.forEach(word => {
      if (!groupedWords[word.boyut]) {
        groupedWords[word.boyut] = [];
      }
      groupedWords[word.boyut].push(word);
    });

    return Object.entries(groupedWords)
      .map(([size, words2]) => ({
        title: `${size} harfli kelimeler`,
        data: words2,
      }))
      .sort(
        (a, b) =>
          parseInt(b.data[0].boyut.toString(), 10) -
          parseInt(a.data[0].boyut.toString(), 10),
      );
  };

  const handleSearch = async () => {
    if (searchText.trim() === '') {
      setIsError('Henüz harf girmediniz');
      return;
    }
    if (!dbInitialized) {
      Alert.alert('Hata', 'Veritabanı henüz hazır değil');
      return;
    }

    setLoading(true);
    try {
      const results = await databaseConnection.searchWords(
        searchText,
        searchType,
      );
      setSections(groupWordsBySize(results));
    } catch (error) {
      Alert.alert('Hata', 'Arama sırasında bir hata oluştu: ' + error);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setSearchText('');
    setSections([]);
    setIsError('');
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.input}
          value={searchText}
          onChangeText={text => {
            setSearchText(text);
            setIsError('');
          }}
          autoCapitalize="none"
          onFocus={() => setIsError('')}
          placeholder="Harfleri girin..."
          placeholderTextColor="#666"
        />
      </View>
      <View style={styles.actionContainer}>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={searchType}
            onValueChange={itemValue => setSearchType(itemValue as SearchType)}
            style={styles.picker}>
            <Picker.Item
              label="Sadece bu harflerden oluşan kelimeleri"
              value={SearchType.EXACT}
            />
            <Picker.Item
              label="Bu harflerle başlayan kelimeleri"
              value={SearchType.START}
            />
            <Picker.Item
              label="Bu harflerle biten kelimeleri"
              value={SearchType.END}
            />
            <Picker.Item
              label="Bu harf öbeğini içeren kelimeleri"
              value={SearchType.CONTAIN}
            />
          </Picker>
        </View>
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSearch}
          disabled={loading || !dbInitialized}>
          <Text style={styles.buttonText}>Bul</Text>
        </TouchableOpacity>
      </View>
      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" style={styles.loader} />
      ) : (
        <>
          {isError ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{isError}</Text>
            </View>
          ) : (
            <SectionList
              sections={sections}
              keyExtractor={item => item?.id?.toString()}
              renderItem={renderWord}
              renderSectionHeader={({section: {title}}) => (
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionHeaderText}>{title}</Text>
                </View>
              )}
              style={styles.list}
            />
          )}
          {sections.length > 0 && (
            <TouchableOpacity
              style={[styles.clearButton]}
              onPress={handleClear}>
              <Text style={styles.buttonText}>Listeyi Temizle</Text>
            </TouchableOpacity>
          )}
        </>
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
    marginBottom: 12,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  picker: {
    height: Platform.OS === 'ios' ? 150 : 48,
  },
  actionContainer: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 8,
  },
  pickerContainer: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    backgroundColor: '#f8f8f8',
  },
  button: {
    backgroundColor: '#007AFF',
    width: 80, // Sabit genişlik
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
  loader: {
    marginTop: 20,
  },
  list: {
    flex: 1,
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
  clearButton: {
    backgroundColor: '#dc3545',
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: Platform.OS === 'ios' ? 20 : 16, // iOS'ta bottom padding ekledik
  },
  errorContainer: {
    flex: 1,
    // justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 20,
  },
  errorText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#dc3545',
    textAlign: 'center',
  },
});
