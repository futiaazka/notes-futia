import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  RefreshControl,
  ActivityIndicator,
  Modal,
} from 'react-native';

// Interfaces
interface Note {
  id: number;
  title: string;
  description: string;
  timestamp: string;
}

interface Quote {
  id: number;
  quote: string;
  author: string;
}

const BASE_URL = 'http://110.239.71.90:5836/api';

const NotesScreen: React.FC = () => {
  // State for notes
  const [notes, setNotes] = useState<Note[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  // State for quote
  const [quote, setQuote] = useState<Quote | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);

  // State for edit modal
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');

  // Fetch quote
  const fetchQuote = async (): Promise<void> => {
    try {
      setQuoteLoading(true);
      const response = await fetch(`${BASE_URL}/quote`);
      const data = await response.json();
      setQuote(data);
    } catch (error) {
      console.error('Error fetching quote:', error);
      Alert.alert('Error', 'Failed to fetch quote');
    } finally {
      setQuoteLoading(false);
    }
  };

  // Fetch notes
  const fetchNotes = async (): Promise<void> => {
    try {
      setLoading(true);
      const response = await fetch(`${BASE_URL}/notes`);
      const data = await response.json();
      setNotes(data);
    } catch (error) {
      console.error('Error fetching notes:', error);
      Alert.alert('Error', 'Failed to fetch notes');
    } finally {
      setLoading(false);
    }
  };

  // Add note
  const handleAddNote = async (): Promise<void> => {
    if (!title.trim() || !description.trim()) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${BASE_URL}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title, description }),
      });
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      setTitle('');
      setDescription('');
      fetchNotes();
      Alert.alert('Success', 'Note added successfully');
    } catch (error) {
      console.error('Error adding note:', error);
      Alert.alert('Error', 'Failed to add note');
    } finally {
      setLoading(false);
    }
  };

  // Open edit modal
  const handleEditPress = (note: Note) => {
    setEditingNote(note);
    setEditTitle(note.title);
    setEditDescription(note.description);
    setIsEditModalVisible(true);
  };

  // Update note
  const handleUpdateNote = async (): Promise<void> => {
    if (!editTitle.trim() || !editDescription.trim()) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${BASE_URL}/notes/${editingNote?.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: editTitle,
          description: editDescription,
        }),
      });
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      setIsEditModalVisible(false);
      setEditingNote(null);
      fetchNotes();
      Alert.alert('Success', 'Note updated successfully');
    } catch (error) {
      console.error('Error updating note:', error);
      Alert.alert('Error', 'Failed to update note');
    } finally {
      setLoading(false);
    }
  };

  // Delete note
  const handleDeleteNote = async (noteId: number): Promise<void> => {
    try {
      setLoading(true);
      const response = await fetch(`${BASE_URL}/notes/${noteId}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      fetchNotes();
      Alert.alert('Success', 'Note deleted successfully');
    } catch (error) {
      console.error('Error deleting note:', error);
      Alert.alert('Error', 'Failed to delete note');
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchQuote();
    fetchNotes();
  }, []);

  // Render quote section
  const renderQuoteSection = () => (
    <View style={styles.quoteContainer}>
      {quoteLoading ? (
        <ActivityIndicator size="small" color="#007AFF" />
      ) : quote ? (
        <>
          <Text style={styles.quoteText}>"{quote.quote}"</Text>
          <Text style={styles.quoteAuthor}>- {quote.author}</Text>
        </>
      ) : (
        <Text style={styles.quoteError}>Failed to load quote</Text>
      )}
      <TouchableOpacity 
        style={styles.refreshButton} 
        onPress={fetchQuote}
        disabled={quoteLoading}
      >
        <Text style={styles.refreshButtonText}>Refresh Quote</Text>
      </TouchableOpacity>
    </View>
  );

  // Edit Modal
  const renderEditModal = () => (
    <Modal
      visible={isEditModalVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setIsEditModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Edit Note</Text>
          <TextInput
            style={styles.input}
            placeholder="Title"
            value={editTitle}
            onChangeText={setEditTitle}
            editable={!loading}
          />
          <TextInput
            style={[styles.input, styles.descriptionInput]}
            placeholder="Description"
            value={editDescription}
            onChangeText={setEditDescription}
            multiline
            editable={!loading}
          />
          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => setIsEditModalVisible(false)}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.saveButton]}
              onPress={handleUpdateNote}
              disabled={loading}
            >
              <Text style={styles.saveButtonText}>
                {loading ? 'Saving...' : 'Save Changes'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  // Render note item
  const renderItem = ({ item }: { item: Note }) => (
    <View style={styles.noteItem}>
      <View style={styles.noteContent}>
        <Text style={styles.noteTitle}>{item.title}</Text>
        <Text style={styles.noteDescription}>{item.description}</Text>
        <Text style={styles.noteTimestamp}>{item.timestamp}</Text>
      </View>
      <TouchableOpacity
          onPress={() => handleEditPress(item)}
          style={styles.editButton}
        >
          <Text style={styles.editButtonText}>Edit</Text>
        </TouchableOpacity>
      <TouchableOpacity
        onPress={() => handleDeleteNote(item.id)}
        style={styles.deleteButton}
      >
        <Text style={styles.deleteButtonText}>Delete</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Quote Section */}
      {renderQuoteSection()}

      {/* Form Section */}
      <View style={styles.formContainer}>
        <Text style={styles.formTitle}>Add New Note</Text>
        <TextInput
          style={styles.input}
          placeholder="Title"
          value={title}
          onChangeText={setTitle}
          editable={!loading}
        />
        <TextInput
          style={[styles.input, styles.descriptionInput]}
          placeholder="Description"
          value={description}
          onChangeText={setDescription}
          multiline
          editable={!loading}
        />
        <TouchableOpacity
          style={[styles.addButton, loading && styles.disabledButton]}
          onPress={handleAddNote}
          disabled={loading}
        >
          <Text style={styles.addButtonText}>
            {loading ? 'Adding...' : 'Add Note'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Notes List Section */}
      <View style={styles.notesContainer}>
        <Text style={styles.notesTitle}>Your Notes</Text>
        <FlatList
          data={notes}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          style={styles.notesList}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={fetchNotes}
            />
          }
          ListEmptyComponent={
            <Text style={styles.emptyText}>No notes yet. Add your first note above!</Text>
          }
        />
      </View>
      {/* Edit Modal */}
      {renderEditModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  // Quote Styles
  quoteContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  quoteText: {
    fontSize: 16,
    fontStyle: 'italic',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  quoteAuthor: {
    fontSize: 14,
    color: '#666',
    textAlign: 'right',
    marginBottom: 12,
  },
  quoteError: {
    color: '#FF3B30',
    textAlign: 'center',
  },
  refreshButton: {
    backgroundColor: '#f0f0f0',
    padding: 8,
    borderRadius: 4,
    alignItems: 'center',
  },
  refreshButtonText: {
    color: '#007AFF',
    fontSize: 14,
  },
  // Form Styles
  formContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    backgroundColor: '#fff',
  },
  descriptionInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  addButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  // Notes List Styles
  notesContainer: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  notesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  notesList: {
    flex: 1,
  },
  noteItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  noteContent: {
    flex: 1,
    marginRight: 12,
  },
  noteTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  noteDescription: {
    marginTop: 4,
    color: '#666',
  },
  noteTimestamp: {
    marginTop: 4,
    fontSize: 12,
    color: '#999',
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
    padding: 8,
    borderRadius: 6,
  },
  deleteButtonText: {
    color: '#fff',
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 24,
  },
  // New styles for edit functionality
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
  },
  modalButton: {
    padding: 12,
    borderRadius: 6,
    minWidth: 80,
    alignItems: 'center',
    marginLeft: 8,
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  saveButton: {
    backgroundColor: '#007AFF',
  },
  cancelButtonText: {
    color: '#666',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  noteActions: {
    flexDirection: 'row',
  },
  editButton: {
    backgroundColor: '#4CAF50',
    padding: 8,
    borderRadius: 6,
    marginRight: 8,
  },
  editButtonText: {
    color: '#fff',
  },
});

export default NotesScreen;