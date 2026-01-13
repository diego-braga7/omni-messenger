
import * as XLSX from 'xlsx';
import axios from 'axios';

const FILE_PATH = '/home/diego/projetos/omni-messenger/lista_de_convidados_Chá.xlsx';
const API_URL = 'http://localhost:3000/users';

async function main() {
  console.log('Starting user import...');

  // 1. Read Excel file
  const workbook = XLSX.readFile(FILE_PATH);
  const targetSheets = ['usar essa', 'SOMENTE PADRINHOS'];

  // 2. Fetch existing users to check for duplicates
  let existingUsersMap = new Map<string, string>(); // phone -> id
  try {
    console.log('Fetching existing users...');
    const response = await axios.get(API_URL);
    const users = response.data;
    if (Array.isArray(users)) {
      users.forEach((u: any) => {
        if (u.phone) existingUsersMap.set(u.phone, u.id);
      });
    }
    console.log(`Found ${existingUsersMap.size} existing users.`);
  } catch (error) {
    console.error('Error fetching users. Is the server running?');
    if (axios.isAxiosError(error)) {
        console.error(error.message);
    }
    process.exit(1);
  }

  // 3. Process sheets
  for (const sheetName of targetSheets) {
    if (!workbook.Sheets[sheetName]) {
      console.warn(`Sheet "${sheetName}" not found. Skipping.`);
      continue;
    }

    console.log(`\nProcessing sheet: ${sheetName}`);
    const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 }) as any[][];

    // Headers are at index 0.
    // Row 1 is garbage (nulls).
    // Data starts at index 2.
    
    // Validate headers (optional, but good for sanity)
    const headers = data[0];
    const nameIdx = headers.indexOf('Nome');
    const ddiIdx = headers.indexOf('DDI');
    const dddIdx = headers.indexOf('DDD');
    const whatsappIdx = headers.indexOf('Número de WhatsApp');

    if (nameIdx === -1 || ddiIdx === -1 || dddIdx === -1 || whatsappIdx === -1) {
      console.error(`Missing required columns in sheet ${sheetName}. Skipping.`);
      console.error('Headers found:', headers);
      continue;
    }

    for (let i = 2; i < data.length; i++) {
      const row = data[i];
      if (!row || row.length === 0) continue;

      const name = row[nameIdx];
      const ddi = row[ddiIdx];
      const ddd = row[dddIdx];
      const whatsapp = row[whatsappIdx];

      if (!name || !whatsapp) {
        // Skip empty rows or rows without essential data
        continue;
      }

      // Normalize phone
      // Ensure strings, remove non-digits
      const cleanDDI = String(ddi || '').replace(/\D/g, '');
      const cleanDDD = String(ddd || '').replace(/\D/g, '');
      const cleanWhatsapp = String(whatsapp || '').replace(/\D/g, '');

      // Construct phone. Assuming format DDI + DDD + Number
      // If DDI is missing, default to 55? The sample shows 55.
      // If data is just numbers, we concatenate.
      
      const phone = `${cleanDDI}${cleanDDD}${cleanWhatsapp}`;

      if (phone.length < 10) {
        console.warn(`Invalid phone number for ${name}: ${phone}. Skipping.`);
        continue;
      }

      const userData = {
        name: String(name).trim(),
        phone: phone,
        // email is optional, not present in excel
      };

      try {
        if (existingUsersMap.has(phone)) {
          // Update
          const id = existingUsersMap.get(phone);
          console.log(`Updating user: ${name} (${phone}) [ID: ${id}]`);
          await axios.put(`${API_URL}/${id}`, userData);
        } else {
          // Create
          console.log(`Creating user: ${name} (${phone})`);
          const createRes = await axios.post(API_URL, userData);
          // Add to map in case of duplicates within the file
          if (createRes.data && createRes.data.id) {
             existingUsersMap.set(phone, createRes.data.id);
          }
        }
      } catch (err) {
        console.error(`Failed to process user ${name} (${phone})`);
        if (axios.isAxiosError(err)) {
            console.error('Status:', err.response?.status);
            console.error('Data:', err.response?.data);
        } else {
            console.error(err);
        }
      }
    }
  }
  console.log('\nImport completed.');
}

main();
