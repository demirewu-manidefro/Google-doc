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
          role: 'owner' // Simplification for mock backend
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
            role: 'owner'
          };
          set({ documents: [...get().documents, newDoc] });
          return newId;
        }
        return null;
      },
      
      updateTimestamp: (id) => {
        set({
          documents: get().documents.map((doc) =>
            doc.id === id ? { ...doc, updatedAt: new Date().toISOString() } : doc
          )
        });
      }
    }),
    {
      name: 'syncwrite-documents',
    }
  )
);
