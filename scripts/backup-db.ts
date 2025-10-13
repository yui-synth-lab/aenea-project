/**
 * Database Backup Script
 * データベースファイルを日付付きでバックアップ
 *
 * Usage: npm run db:backup
 * Output: data/aenea_consciousness_YYYYMMDD.db
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.resolve(__dirname, '../data');
const DB_FILE = path.join(DATA_DIR, 'aenea_consciousness.db');

/**
 * フォーマットされた日付文字列を取得 (YYYYMMDD)
 */
function getDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

/**
 * データベースをバックアップ
 */
async function backupDatabase(): Promise<void> {
  try {
    // データベースファイルの存在確認
    if (!fs.existsSync(DB_FILE)) {
      console.error(`❌ データベースファイルが見つかりません: ${DB_FILE}`);
      process.exit(1);
    }

    // バックアップファイル名を生成
    const dateString = getDateString();
    const backupFile = path.join(DATA_DIR, `aenea_consciousness_${dateString}.db`);

    // バックアップファイルが既に存在する場合は確認
    if (fs.existsSync(backupFile)) {
      console.log(`⚠️  バックアップファイルが既に存在します: ${backupFile}`);

      // タイムスタンプ付きで別名を作成
      const timestamp = Date.now();
      const backupFileWithTimestamp = path.join(
        DATA_DIR,
        `aenea_consciousness_${dateString}_${timestamp}.db`
      );

      console.log(`📝 タイムスタンプ付きでバックアップします: ${backupFileWithTimestamp}`);
      fs.copyFileSync(DB_FILE, backupFileWithTimestamp);

      const stats = fs.statSync(backupFileWithTimestamp);
      const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);

      console.log(`✅ バックアップ完了: ${path.basename(backupFileWithTimestamp)}`);
      console.log(`   サイズ: ${sizeInMB} MB`);
      console.log(`   パス: ${backupFileWithTimestamp}`);
    } else {
      // ファイルをコピー
      fs.copyFileSync(DB_FILE, backupFile);

      const stats = fs.statSync(backupFile);
      const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);

      console.log(`✅ バックアップ完了: ${path.basename(backupFile)}`);
      console.log(`   サイズ: ${sizeInMB} MB`);
      console.log(`   パス: ${backupFile}`);
    }
  } catch (error) {
    console.error('❌ バックアップ中にエラーが発生しました:', error);
    process.exit(1);
  }
}

// スクリプト実行
backupDatabase();
