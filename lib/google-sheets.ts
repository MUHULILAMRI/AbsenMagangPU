import { google } from "googleapis";
import path from "path";
import { cwd } from "process";

// TODO: Ganti dengan ID Spreadsheet Google Anda
const SPREADSHEET_ID = "1BnsvgLVIrCl7t5N86vmwCiGHFZsngiLPl8Ksr5XbRYw"; 

// TODO: Pastikan file credentials.json Anda ada di root direktori proyek
const KEYFILE_PATH = path.join(cwd(), "credentials.json");

// Tentukan cakupan (scope) yang diperlukan
const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];

// Fungsi untuk menambahkan data ke Google Sheet
export async function appendToSheet(values: (string | number | boolean)[]) {
  console.log("--- appendToSheet function called ---");
  console.log("Values to append:", values);
  try {
    // Buat klien autentikasi
    const auth = new google.auth.GoogleAuth({
      keyFile: KEYFILE_PATH,
      scopes: SCOPES,
    });

    // Dapatkan instance dari Google Sheets API
    const sheets = google.sheets({ version: "v4", auth });

    // Tentukan range tempat data akan ditambahkan (misalnya, Sheet1)
    // 'A1' berarti data akan ditambahkan setelah baris terakhir yang ada di Sheet1
    const range = "Sheet1!A1";

    // Panggil API untuk menambahkan data
    const response = await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: range,
      valueInputOption: "USER_ENTERED", // 'RAW' atau 'USER_ENTERED'
      requestBody: {
        values: [values], // values harus berupa array dari array
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
