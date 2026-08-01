import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useDocumentStore = create(
  persist(
    (set, get) => ({
      documents: [],
      
      createDocument: (owner) => {
        const id = Date.now().toString();
        const newDoc = {
          id,
          title: 'Untitled Document',
          owner,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          role: 'owner', // Simplification for mock backend
          history: [],
          comments: []
        };
        set({ documents: [...get().documents, newDoc] });
        return id;
      },

      deleteDocument: (id) => {
        set({ documents: get().documents.filter((doc) => doc.id !== id) });
      },

      renameDocument: (id, newTitle) => {
        set({
          documents: get().documents.map((doc) =>
            doc.id === id ? { ...doc, title: newTitle, updatedAt: new Date().toISOString() } : doc
          )
        });
      },

      duplicateDocument: (id, owner) => {
        const docToDuplicate = get().documents.find(doc => doc.id === id);
        if (docToDuplicate) {
          const newId = Date.now().toString();
          const newDoc = {
            ...docToDuplicate,
            id: newId,
            title: `${docToDuplicate.title} (Copy)`,
            owner,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            role: 'owner',
            history: [],
            comments: []
          };
          set({ documents: [...get().documents, newDoc] });
          return newId;
        }
        return null;
      },
      
      updateTimestamp: (id) => {
        set({
          documents: get().documents.map((doc) => {
            if (doc.id === id) {
              const now = new Date().toISOString();
              const history = doc.history || [];
              
              // Add a history entry if it's been more than 60s since last entry, or if history is empty
              let newHistory = history;
              if (history.length === 0 || (new Date(now) - new Date(history[history.length-1].timestamp) > 60000)) {
                 const historyEntry = {
                   id: Date.now().toString(),
                   timestamp: now,
                   author: doc.owner, // mock author
                   message: 'Autosave'
                 };
                 newHistory = [...history, historyEntry].slice(-20); // Keep last 20 revisions
              }
              return { ...doc, updatedAt: now, history: newHistory };
            }
            return doc;
          })
        });
      },

      addComment: (docId, user, text) => {
        set({
          documents: get().documents.map(doc => {
            if (doc.id === docId) {
              const newComment = {
                id: Date.now().toString(),
                user,
                text,
                timestamp: new Date().toISOString(),
                resolved: false,
                replies: []
              };
              return { ...doc, comments: [...(doc.comments || []), newComment] };
            }
            return doc;
          })
        });
      },

      resolveComment: (docId, commentId) => {
        set({
          documents: get().documents.map(doc => {
            if (doc.id === docId) {
              return {
                ...doc,
                comments: (doc.comments || []).map(c => 
                  c.id === commentId ? { ...c, resolved: true } : c
                )
              };
            }
            return doc;
          })
        });
      }
    }),
    {
      name: 'syncwrite-documents',
    }
  )
);
