# SyncWrite - Real-Time Collaborative Editor

SyncWrite is a modern, feature-rich Google Docs clone built with React, Node.js, and Yjs. It offers seamless real-time collaboration, document outlining, multi-tab support, and a robust invitation system.

## 🚀 Features

- **Real-Time Collaboration**: Edit documents simultaneously with multiple users with live cursors and instant syncing using Yjs and WebSockets.
- **Rich Text Editing**: Powered by Tiptap, supporting advanced formatting, headings, and alignments.
- **Document Outline**: Automatically generates a clickable outline in the sidebar based on your document's headings, just like Google Docs.
- **Multi-Tab Documents**: Create and manage multiple tabs within a single document workspace.
- **GitHub-Style Invites**: Strict collaboration flow where users receive an invite (with email simulation) and must explicitly accept it before accessing the document.
- **Commenting & Suggesting**: Highlight text to add comments, reply, and resolve them.
- **Version History**: Track changes and see a history of modifications.
- **Advanced Menus**: Fully functional File, Edit, View, and Insert dropdown menus.
- **Export Options**: Download your documents as Microsoft Word (`.docx`), PDF (`.pdf`), or plain text.
- **Modern Dashboard**: Manage your documents with sections for Recent, Owned, Shared, and Pending Invites.

## 📸 Screenshots

### Dashboard & Pending Invites
<img width="637" height="418" alt="image" src="https://github.com/user-attachments/assets/b1ba8256-1b6f-4664-b26a-49101ccab5e2" />


### Real-Time Editor & Document Outline
<img width="1920" height="928" alt="image" src="https://github.com/user-attachments/assets/81845706-35e5-4e85-b920-e9e2d6ff114e" />



## 🛠️ Tech Stack

- **Frontend**: React, Vite, Zustand, Tiptap, Lucide React, React Router
- **Backend**: Node.js, Express, Socket.IO, Yjs (y-websocket), Prisma
- **Database**: PostgreSQL

## ⚙️ Installation & Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd challenge3
   ```

2. **Setup the Backend**
   ```bash
   cd backend
   npm install
   # Configure your .env file with DATABASE_URL
   npx prisma generate
   npx prisma db push
   npm run dev
   ```

3. **Setup the Frontend**
   ```bash
   cd ../frontend
   npm install
   npm run dev
   ```

4. **Access the application**
   Open your browser and navigate to `http://localhost:5173`.

## 🤝 Collaboration Flow

1. The owner clicks the **Share** button and enters an email.
2. The invited user's status is set to `PENDING`.
3. An invite link is generated (simulated in the backend console).
4. The invited user clicks the link or views their **Pending Invites** on the Dashboard.
5. The user clicks **Accept Invitation** and is granted access to collaborate!

## 📝 License

This project is open-source and available under the MIT License.
