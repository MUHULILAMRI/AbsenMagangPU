import { google } from "googleapis";
import path from "path";
import { promises as fs } from "fs";
import { cwd } from "process";

// TODO: Ganti dengan ID Spreadsheet Google Anda
const SPREADSHEET_ID = "1BnsvgLVIrCl7t5N86vmwCiGHFZsngiLPl8Ksr5XbRYw"; 

// Tentukan cakupan (scope) yang diperlukan
const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];

/**
 * Secara cerdas mendapatkan klien otentikasi Google.
 * Di Produksi: Membaca dari variabel lingkungan.
 * Di Pengembangan: Membaca dari file credentials.json.
 */
async function getGoogleAuth() {
  if (process.env.NODE_ENV === 'production') {
    // Lingkungan Produksi (misalnya Vercel)
    const credentialsJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
    if (!credentialsJson) {
      throw new Error("Variabel lingkungan GOOGLE_APPLICATION_CREDENTIALS_JSON tidak diatur untuk lingkungan produksi.");
    }
    const credentials = JSON.parse(credentialsJson);
    return new google.auth.GoogleAuth({ credentials, scopes: SCOPES });
  } else {
    // Lingkungan Pengembangan (Lokal)
    const keyFilePath = path.join(cwd(), "credentials.json");
    // Pastikan file ada sebelum melanjutkan
    try {
      await fs.access(keyFilePath);
    } catch (error) {
      throw new Error("File credentials.json tidak ditemukan di root direktori proyek. Harap unduh dari Google Cloud Console.");
    }
    return new google.auth.GoogleAuth({
      keyFile: keyFilePath,
      scopes: SCOPES,
    });
  }
}

// Fungsi untuk menambahkan data ke Google Sheet
export async function appendToSheet(values: (string | number | boolean)[]) {
  console.log("--- appendToSheet function called ---");
  console.log("Values to append:", values);
  try {
    const auth = await getGoogleAuth();
    const sheets = google.sheets({ version: "v4", auth });

    const range = "Sheet1!A1"; // Menambahkan ke baris berikutnya yang kosong

    const response = await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: range,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [values],
      },
    });

    console.log("Data berhasil ditambahkan ke Google Sheet:", response.data);
    return response.data;
  } catch (error: any) {
    console.error("!!! ERROR IN APPENDTOSHEET FUNCTION !!!");
    if (error.code) {
      console.error(`Error Code: ${error.code}`);
    }
    if (error.errors) {
      console.error("Error Details:", JSON.stringify(error.errors, null, 2));
    }
    console.error("Full Error Object:", error);
    throw error; // Melempar objek error asli
  }
}
