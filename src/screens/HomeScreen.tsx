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
  Image,
  Linking,
  Modal,
  Button,
} from 'react-native';
import {Picker} from '@react-native-picker/picker';
import {databaseConnection, Word, SearchType} from '../db/database';
import header_icon from '../assets/icon/header_icon.png';
import info_icon from '../assets/icon/info_icon.png';

import {
  version as appVersion,
  name as appName,
  author as appAuthor,
  website as appWebsite,
} from '../../app.json';

interface Section {
  title: string;
  data: Word[];
}

export const HomeScreen: React.FC = () => {
  const [searchText, setSearchText] = useState<string>('');
  const [searchType, setSearchType] = useState<SearchType>(SearchType.EXACT);
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [dbInitialized, setDbInitialized] = useState<boolean>(false);
  const [isError, setIsError] = useState<string>('');
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [totalWords, setTotalWords] = useState<number>(0);

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
    if (!words || words.length === 0) {
      return [];
    }
    setTotalWords(words.length);
    const groupedWords: {[key: number]: Word[]} = {};

    words.forEach(word => {
      if (!groupedWords[word.boyut]) {
        groupedWords[word.boyut] = [];
      }
      groupedWords[word.boyut].push(word);
    });

    return Object.entries(groupedWords)
      .map(([size, words2]) => ({
        title: `${size} harfli kelimeler (${words2.length})`,
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
    setTotalWords(0);
  };

  const handleLinkPress = () => {
    Linking.openURL(appWebsite).catch(err =>
      console.error('Failed to open URL:', err),
    );
  };

  return (
    <>
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Hakkında</Text>
            <Text style={styles.aboutText}>
              {appName} {appVersion}
            </Text>
            <Text style={styles.aboutText}>{appAuthor}</Text>
            <TouchableOpacity onPress={handleLinkPress}>
              <Text style={[styles.aboutText, styles.linkText]}>
                {appWebsite}
              </Text>
            </TouchableOpacity>
            <Button style={styles.modalButton} title="TAMAM" onPress={() => setModalVisible(false)} />
          </View>
        </View>
      </Modal>

      <View style={styles.headerContainer}>
        <View style={styles.titleContainer}>
          <Image source={header_icon} style={styles.titleIcon} />
          <Text style={styles.titleText}>Kelimatik</Text>
        </View>
        <TouchableOpacity onPress={() => setModalVisible(true)}>
          <Image source={info_icon} style={styles.questionIcon} />
        </TouchableOpacity>
      </View>
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
              onValueChange={itemValue =>
                setSearchType(itemValue as SearchType)
              }
              mode="dropdown"
              style={styles.picker}>
              <Picker.Item
                label="Bu harflerden oluşan kelimeleri"
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
            <Text style={styles.buttonText}>BUL</Text>
          </TouchableOpacity>
        </View>
        {loading ? (
          <ActivityIndicator
            size="large"
            color="#0000ff"
            style={styles.loader}
          />
        ) : (
          <>
            {isError ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{isError}</Text>
              </View>
            ) : (<>
              {totalWords > 0 && (
                <View style={styles.totalWordsContainer}>
                  <Text style={styles.totalWordsText}>
                    Toplam {totalWords} kelime bulundu
                  </Text>
                </View>
              )}
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
            </>)}
            {sections.length > 0 && (
              <TouchableOpacity
                style={[styles.clearButton]}
                onPress={handleClear}>
                <Text style={styles.buttonText}>Temizle</Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    marginBottom: 2,
    backgroundColor: '#D0D0D0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#03a9f4',
  },
  titleIcon: {
    width: 24,
    height: 24,
    marginRight: 8,
  },
  questionIcon: {
    width: 24,
    height: 24,
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#fff',
  },
  searchContainer: {
    marginBottom: 12,
  },
  header: {
    height: 48,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
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
    // height: Platform.OS === 'ios' ? 150 : 50,
    color: '#000',
    paddingTop: 0,
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
    width: 80,
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
  totalWordsContainer: {
    marginBottom: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  totalWordsText: {
    color: '#666',
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
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: 300,
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  modalButton: {
    marginTop: 10,
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 5,
  },
  aboutText: {
    fontSize: 16,
    marginVertical: 5,
  },
  linkText: {
    textDecorationLine: 'underline',
    color: '#007AFF',
    marginBottom: 25,
  },
});
