// src/db/database.ts
import SQLite from 'react-native-sqlite-storage';

SQLite.enablePromise(true);

export interface Word {
  id: number;
  word: string;
  boyut: number;
}

export class DatabaseConnection {
  private database: SQLite.SQLiteDatabase | null = null;

  async initDatabase(): Promise<void> {
    try {
      const db = await SQLite.openDatabase({
        name: 'Kelimeler.db',
        location: 'default',
        createFromLocation: 1,
      });

      this.database = db;
      console.log('Database connected successfully!');

      // Test query
      const [results] = await this.database.executeSql(
        'SELECT * FROM kelimeler LIMIT 1',
      );
      console.log(
        'Database test query successful, found',
        results.rows.length,
        'rows',
      );
    } catch (error) {
      console.error('Database connection error:', error);
      throw error;
    }
  }

  async searchWords(letters: string): Promise<Word[]> {
    if (!this.database) {
      await this.initDatabase();
    }

    try {
      const [results] = await this.database!.executeSql(
        'SELECT * FROM kelimeler WHERE kelime LIKE ? ORDER BY boyut DESC, kelime ASC',
        [`%${letters}%`],
      );

      const words: Word[] = [];
      for (let i = 0; i < results.rows.length; i++) {
        words.push(results.rows.item(i));
      }
      return words;
    } catch (error) {
      console.error('Error searching words:', error);
      return [];
    }
  }
}

export const databaseConnection = new DatabaseConnection();
