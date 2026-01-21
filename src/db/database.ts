import SQLite from 'react-native-sqlite-storage';
import { Platform } from 'react-native';

SQLite.enablePromise(true);

export interface Word {
  id: number;
  kelime: string;
  boyut: number;
}

export enum SearchType {
  EXACT = '1',
  START = '2',
  END = '3',
  CONTAIN = '4',
}

export class DatabaseConnection {
  private database: SQLite.SQLiteDatabase | null = null;

  async initDatabase(): Promise<void> {
    try {
      const db = await SQLite.openDatabase({
        name: 'Kelimeler.db',
        location: 'default',
        createFromLocation: Platform.OS === 'ios' ? '~Kelimeler.db' : 1,
      });

      this.database = db;
      console.log('Database connected successfully!');
    } catch (error) {
      console.error('Database connection error:', error);
      throw error;
    }
  }

  async searchWords(letters: string, searchType: SearchType): Promise<Word[]> {
    if (!this.database) {
      await this.initDatabase();
    }

    try {
      let query = 'SELECT * FROM kelimeler WHERE ';
      let searchPattern: string;
      const processedLetters = letters.replace(/[*?]/g, '_');

      switch (searchType) {
        case SearchType.EXACT:
          query = createSqlForExact(letters);
          searchPattern = `${letters}%`;
          break;
        case SearchType.START:
          query += 'kelime LIKE ?';
          searchPattern = `${processedLetters}%`;
          break;
        case SearchType.END:
          query += 'kelime LIKE ?';
          searchPattern = `%${processedLetters}`;
          break;
        case SearchType.CONTAIN:
          query += 'kelime LIKE ?';
          searchPattern = `%${processedLetters}%`;
          break;
        default:
          throw new Error('Geçersiz arama tipi');
      }

      query += ' ORDER BY boyut DESC, kelime ASC';

      let res;
      if (searchType === SearchType.EXACT) {
        res = await this.database!.executeSql(query);
      } else {
        res = await this.database!.executeSql(query, [searchPattern]);
      }
      const [results] = res;

      const words: Word[] = [];
      for (let i = 0; i < results.rows.length; i++) {
        let word = results.rows.item(i).kelime;
        if (word.length > 2) {
          if (searchType === SearchType.EXACT) {
            if (canFormWord(word, letters)) {
              words.push(results.rows.item(i));
            }
          } else {
            words.push(results.rows.item(i));
          }
        }
      }
      return words;
    } catch (error) {
      console.error('Error searching words:', error);
      return [];
    }
  }
}

function createSqlForExact(inputLetters) {
  const formattedLetters = inputLetters.toLowerCase().trim();
  const hasWildcard = formattedLetters.includes('*') || formattedLetters.includes('?');

  if (hasWildcard) {
    return `SELECT * FROM kelimeler WHERE length(kelime) <= ${formattedLetters.length}`;
  }

  const alphabet = 'abcçdefgğhıijklmnoöprsştuüvyz';
  let sqlConditions = [];

  for (let i = 0; i < alphabet.length; i++) {
    const currentLetter = alphabet[i];
    if (!formattedLetters.includes(currentLetter)) {
      sqlConditions.push(`kelime NOT LIKE '%${currentLetter}%'`);
    }
  }

  if (sqlConditions.length === 0) {
    return 'SELECT * FROM kelimeler';
  }

  const sql = `SELECT * FROM kelimeler WHERE ${sqlConditions.join(' AND ')}`;
  return sql;
}

function canFormWord(word, availableLetters) {
  word = word.toLowerCase().trim();
  availableLetters = availableLetters.toLowerCase().trim();

  let availableArray = availableLetters.split('');

  for (let i = 0; i < word.length; i++) {
    const letterOfTheWord = word[i];
    const index = availableArray.indexOf(letterOfTheWord);

    if (index !== -1) {
      availableArray.splice(index, 1);
    } else {
      const wildIndex1 = availableArray.indexOf('*');
      const wildIndex2 = availableArray.indexOf('?');

      if (wildIndex1 !== -1) {
        availableArray.splice(wildIndex1, 1);
      } else if (wildIndex2 !== -1) {
        availableArray.splice(wildIndex2, 1);
      } else {
        return false;
      }
    }
  }
  return true;
}

export const databaseConnection = new DatabaseConnection();
