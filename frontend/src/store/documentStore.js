import { create } from 'zustand';
import { api } from '../api';

export const useDocumentStore = create((set, get) => ({
  documents: [],
  sharedDocuments: [],
  
  fetchDocuments: async () => {
    try {
      const data = await api.get('/documents');
      set({ documents: data.owned, sharedDocuments: data.shared });
    } catch (e) {
      console.error(e);
    }
  },

  createDocument: async (owner) => {
    try {
      const newDoc = await api.post('/documents', { title: 'Untitled Document' });
      set({ documents: [newDoc, ...get().documents] });
      return newDoc.id;
    } catch (e) {
      console.error(e);
      return null;
    }
  },

  deleteDocument: async (id) => {
    try {
      await api.delete(`/documents/${id}`);
      set({ documents: get().documents.filter((doc) => doc.id !== id) });
    } catch (e) { console.error(e); }
  },

  renameDocument: async (id, newTitle) => {
    try {
      await api.put(`/documents/${id}`, { title: newTitle });
      set({
        documents: get().documents.map((doc) =>
          doc.id === id ? { ...doc, title: newTitle, updatedAt: new Date().toISOString() } : doc
        )
      });
    } catch (e) { console.error(e); }
  },

  duplicateDocument: async (id, owner) => {
    try {
      const newDoc = await api.post(`/documents/${id}/duplicate`);
      set({ documents: [newDoc, ...get().documents] });
      return newDoc.id;
    } catch (e) {
      console.error(e);
      return null;
    }
  },
  
  updateTimestamp: () => {}, // Handled by backend y-websocket persistence

  addComment: async (docId, user, text) => {
    try {
      return await api.post(`/documents/${docId}/comments`, { text });
    } catch (e) { console.error(e); return null; }
  },

  resolveComment: async (docId, commentId) => {
    try {
      return await api.put(`/documents/${docId}/comments/${commentId}/resolve`);
    } catch (e) { console.error(e); return null; }
  }
}));
