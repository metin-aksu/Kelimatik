// src/screens/HomeScreen.tsx
import React, { useEffect, useState } from 'react';
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
  ScrollView,
  Keyboard,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Picker } from '@react-native-picker/picker';
import { databaseConnection, Word, SearchType } from '../db/database';
import header_icon from '../assets/icon/header_icon.png';
import info_icon from '../assets/icon/info_icon.png';
import question_icon from '../assets/icon/question_icon.png';
import arrow_down from '../assets/icon/arrow_down.png';

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
  const [helpModalVisible, setHelpModalVisible] = useState<boolean>(false);
  const [pickerModalVisible, setPickerModalVisible] = useState<boolean>(false);
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

  const getSearchTypeLabel = (type: SearchType) => {
    switch (type) {
      case SearchType.EXACT:
        return 'Bu harflerden oluşan kelimeleri';
      case SearchType.START:
        return 'Bu harflerle başlayan kelimeleri';
      case SearchType.END:
        return 'Bu harflerle biten kelimeleri';
      case SearchType.CONTAIN:
        return 'Bu harf öbeğini içeren kelimeleri';
      default:
        return '';
    }
  };

  const renderWord = ({ item }: { item: Word }) => (
    <View style={styles.wordItem}>
      <Text style={styles.wordText}>{item?.kelime}</Text>
    </View>
  );

  const groupWordsBySize = (words: Word[]): Section[] => {
    if (!words || words.length === 0) {
      return [];
    }
    setTotalWords(words.length);
    const groupedWords: { [key: number]: Word[] } = {};

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
    Keyboard.dismiss();
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
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
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
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setModalVisible(false)}>
              <Text style={styles.buttonText}>TAMAM</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="slide"
        transparent={true}
        visible={helpModalVisible}
        onRequestClose={() => setHelpModalVisible(false)}>
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { width: '90%' }]}>
            <Text style={styles.modalTitle}>Nasıl Kullanılır?</Text>
            <ScrollView style={{ maxHeight: 400 }}>
              <Text style={styles.aboutText}>
                1. Arama kutusuna elinizdeki harfleri veya aramak istediğiniz kelime parçasını girin.
              </Text>
              <Text style={styles.aboutText}>
                2. Arama tipini seçin:
              </Text>
              <Text style={styles.bulletText}>• Bu harflerden oluşan: Girilen harflerle yazılabilecek kelimeleri bulur.</Text>
              <Text style={styles.bulletText}>• Bu harflerle başlayan: Girilen harflerle başlayan kelimeleri bulur.</Text>
              <Text style={styles.bulletText}>• Bu harflerle biten: Girilen harflerle biten kelimeleri bulur.</Text>
              <Text style={styles.bulletText}>• İçeren: Girilen harf öbeğini herhangi bir yerinde barındıran kelimeleri bulur.</Text>

              <Text style={[styles.aboutText, { fontWeight: 'bold', marginTop: 10 }]}>
                Joker Karakterler (* veya ?)
              </Text>
              <Text style={styles.aboutText}>
                Bilmediğiniz harfler yerine '*' veya '?' kullanabilirsiniz. Her joker karakter bir harf yerine geçer.
              </Text>
              <Text style={[styles.aboutText, { marginTop: 5 }]}>
                Örnekler:
              </Text>
              <Text style={styles.bulletText}>• "k*t*p" → kitap, katip, kütüp...</Text>
              <Text style={styles.bulletText}>• "a*ya" → arya, ayna...</Text>
            </ScrollView>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setHelpModalVisible(false)}>
              <Text style={styles.buttonText}>ANLADIM</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="slide"
        transparent={true}
        visible={pickerModalVisible}
        onRequestClose={() => setPickerModalVisible(false)}>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setPickerModalVisible(false)}
        >
          <View style={styles.pickerModalContent}>
            {[
              { label: 'Bu harflerden oluşan kelimeleri', value: SearchType.EXACT },
              { label: 'Bu harflerle başlayan kelimeleri', value: SearchType.START },
              { label: 'Bu harflerle biten kelimeleri', value: SearchType.END },
              { label: 'Bu harf öbeğini içeren kelimeleri', value: SearchType.CONTAIN },
            ].map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.pickerOption,
                  searchType === option.value && styles.pickerOptionSelected
                ]}
                onPress={() => {
                  setSearchType(option.value);
                  setPickerModalVisible(false);
                }}>
                <Text style={[
                  styles.pickerOptionText,
                  searchType === option.value && styles.pickerOptionTextSelected
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.pickerCancelButton}
              onPress={() => setPickerModalVisible(false)}>
              <Text style={styles.pickerCancelText}>İptal</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <View style={styles.headerContainer}>
        <View style={styles.titleContainer}>
          <Image source={header_icon} style={styles.titleIcon} />
          <Text style={styles.titleText}>Kelimatik</Text>
        </View>
        <View style={styles.headerRightContainer}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => setHelpModalVisible(true)}>
            <Image source={question_icon} style={styles.headerIcon} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => setModalVisible(true)}>
            <Image source={info_icon} style={styles.headerIcon} />
          </TouchableOpacity>
        </View>
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
            <TouchableOpacity
              style={styles.iosPickerButton}
              onPress={() => setPickerModalVisible(true)}>
              <Text style={styles.iosPickerText} numberOfLines={1}>
                {getSearchTypeLabel(searchType)}
              </Text>
              <Image source={arrow_down} style={styles.arrowIcon} />
            </TouchableOpacity>
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
                renderSectionHeader={({ section: { title } }) => (
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
    </SafeAreaView >
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#D0D0D0',
  },
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
  headerRightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    marginLeft: 12,
  },
  headerIcon: {
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
    fontSize: 20,
    backgroundColor: '#fff',
    color: '#000',
  },
  iosPickerButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  iosPickerText: {
    fontSize: 14,
    color: '#000',
    flex: 1,
  },
  arrowIcon: {
    width: 16,
    height: 16,
    marginLeft: 8,
    tintColor: '#666',
    resizeMode: 'contain',
    transform: [{ rotate: '-90deg' }],
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  pickerModalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 40, // Home indicator için ekstra boşluk
    paddingTop: 8,
  },
  pickerOption: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  pickerOptionSelected: {
    backgroundColor: '#f8f9fa',
  },
  pickerOptionText: {
    fontSize: 18,
    color: '#333',
  },
  pickerOptionTextSelected: {
    color: '#007AFF',
    fontWeight: '600',
  },
  pickerCancelButton: {
    marginTop: 8,
    paddingVertical: 16,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  pickerCancelText: {
    color: '#dc3545',
    fontSize: 18,
    fontWeight: 'bold',
  },
  picker: {
    // height: Platform.OS === 'ios' ? 150 : 50,
    color: '#000',
    paddingTop: 0,
  },
  actionContainer: {
    flexDirection: 'row',
    marginBottom: 8,
    gap: 8,
  },
  pickerContainer: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    backgroundColor: '#f8f8f8',
    justifyContent: 'center',
  },
  button: {
    backgroundColor: '#007AFF',
    width: 80,
    height: 48,
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
    // marginBottom: Platform.OS === 'ios' ? 20 : 16, // iOS'ta bottom padding ekledik
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
    marginBottom: 5,
  },
  modalButton: {
    marginTop: 5,
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
  bulletText: {
    fontSize: 14,
    marginVertical: 2,
    marginLeft: 10,
    color: '#333',
  },
});
