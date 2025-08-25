import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Clock, Check, Trash2, ArrowLeft, Calendar, User } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { groupsAPI, remindersAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import Layout from '../components/Layout';

const Reminders = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [group, setGroup] = useState(null);
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newReminder, setNewReminder] = useState({
    title: '',
    description: '',
    due_date: '',
  });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchGroupAndReminders();
  }, [groupId]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchGroupAndReminders = async () => {
    try {
      const [groupResponse, remindersResponse] = await Promise.all([
        groupsAPI.getById(groupId),
        groupsAPI.getReminders(groupId)
      ]);
      
      setGroup(groupResponse.data);
      setReminders(remindersResponse.data);
    } catch (error) {
      toast.error('Failed to fetch data');
      navigate('/groups');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateReminder = async (e) => {
    e.preventDefault();
    if (!newReminder.title.trim()) return;

    setCreating(true);
    try {
      const reminderData = {
        title: newReminder.title,
        description: newReminder.description,
        due_date: newReminder.due_date ? new Date(newReminder.due_date).toISOString() : null,
      };

      const response = await groupsAPI.createReminder(groupId, reminderData);
      setReminders([response.data, ...reminders]);
      setNewReminder({ title: '', description: '', due_date: '' });
      setShowCreateModal(false);
      toast.success('Reminder created successfully!');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to create reminder');
    } finally {
      setCreating(false);
    }
  };

  const handleToggleComplete = async (reminder) => {
    try {
      const response = await remindersAPI.update(reminder.id, {
        completed: !reminder.completed
      });
      
      setReminders(reminders.map(r => 
        r.id === reminder.id ? response.data : r
      ));
      
      toast.success(reminder.completed ? 'Reminder marked as incomplete' : 'Reminder completed!');
    } catch (error) {
      toast.error('Failed to update reminder');
    }
  };

  const handleDeleteReminder = async (reminderId) => {
    if (!window.confirm('Are you sure you want to delete this reminder?')) return;

    try {
      await remindersAPI.delete(reminderId);
      setReminders(reminders.filter(r => r.id !== reminderId));
      toast.success('Reminder deleted successfully');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to delete reminder');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const isOverdue = (dateString) => {
    if (!dateString) return false;
    return new Date(dateString) < new Date();
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/groups')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            >
              <ArrowLeft size={20} className="text-gray-600" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{group?.name}</h1>
              <p className="text-gray-600 mt-1">
                {reminders.length} reminder{reminders.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>

        {reminders.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <Clock size={64} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">No reminders yet</h3>
            <p className="text-gray-600 mb-6">Add your first reminder to get started</p>
          </motion.div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {reminders.map((reminder, index) => (
                <motion.div
                  key={reminder.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ delay: index * 0.05 }}
                  className={`card ${reminder.completed ? 'opacity-75' : ''}`}
                >
                  <div className="flex items-start space-x-4">
                    <button
                      onClick={() => handleToggleComplete(reminder)}
                      className={`mt-1 p-1 rounded-full transition-colors duration-200 ${
                        reminder.completed 
                          ? 'bg-green-100 text-green-600' 
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-400'
                      }`}
                    >
                      <Check size={16} />
                    </button>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className={`font-medium ${
                            reminder.completed ? 'line-through text-gray-500' : 'text-gray-900'
                          }`}>
                            {reminder.title}
                          </h3>
                          {reminder.description && (
                            <p className="text-gray-600 mt-1 text-sm">
                              {reminder.description}
                            </p>
                          )}
                          
                          <div className="flex items-center space-x-4 mt-3 text-sm text-gray-500">
                            <div className="flex items-center space-x-1">
                              <User size={14} />
                              <span>{reminder.creator?.username}</span>
                            </div>
                            {reminder.due_date && (
                              <div className={`flex items-center space-x-1 ${
                                isOverdue(reminder.due_date) && !reminder.completed
                                  ? 'text-red-600' 
                                  : ''
                              }`}>
                                <Calendar size={14} />
                                <span>{formatDate(reminder.due_date)}</span>
                                {isOverdue(reminder.due_date) && !reminder.completed && (
                                  <span className="text-red-600 font-medium">(Overdue)</span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <button
                          onClick={() => handleDeleteReminder(reminder.id)}
                          className="p-2 text-gray-400 hover:text-red-600 transition-colors duration-200"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </motion.div>

      {/* Floating Add Button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setShowCreateModal(true)}
        className="floating-button"
      >
        <Plus size={24} />
      </motion.button>

      {/* Create Reminder Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl p-6 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Add New Reminder</h2>
              
              <form onSubmit={handleCreateReminder} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={newReminder.title}
                    onChange={(e) => setNewReminder({...newReminder, title: e.target.value})}
                    className="input-field"
                    placeholder="Enter reminder title"
                    required
                    autoFocus
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={newReminder.description}
                    onChange={(e) => setNewReminder({...newReminder, description: e.target.value})}
                    className="input-field resize-none"
                    rows={3}
                    placeholder="Add a description (optional)"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Due Date
                  </label>
                  <input
                    type="datetime-local"
                    value={newReminder.due_date}
                    onChange={(e) => setNewReminder({...newReminder, due_date: e.target.value})}
                    className="input-field"
                  />
                </div>
                
                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating || !newReminder.title.trim()}
                    className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {creating ? 'Adding...' : 'Add Reminder'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Layout>
  );
};

export default Reminders;
