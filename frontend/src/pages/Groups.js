import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Users, Trash2 } from 'lucide-react';
import { groupsAPI } from '../utils/api';
import Layout from '../components/Layout';

const Groups = () => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [creating, setCreating] = useState(false);
  
  const navigate = useNavigate();

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      const response = await groupsAPI.getAll();
      setGroups(response.data);
    } catch (error) {
      console.error('Error fetching groups:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;

    setCreating(true);
    try {
      const response = await groupsAPI.create({ name: newGroupName.trim() });
      setGroups([...groups, response.data]);
      setNewGroupName('');
      setShowCreateModal(false);
    } catch (error) {
      console.error('Error creating group:', error);
    } finally {
      setCreating(false);
    }
  };


  const handleDeleteGroup = async (groupId) => {
    if (!window.confirm('Are you sure you want to delete this group? This will also delete all reminders in this group.')) {
      return;
    }

    try {
      await groupsAPI.delete(groupId);
      setGroups(groups.filter(group => group.id !== groupId));
    } catch (error) {
      console.error('Error deleting group:', error);
    }
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
      <div className="space-y-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
        >
          <div>
            <h2 className="text-3xl font-bold gradient-text">Your Groups</h2>
            <p className="text-white/80 mt-2">Organize your reminders into groups</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowCreateModal(true)}
            className="btn-primary flex items-center space-x-2 w-full sm:w-auto"
          >
            <Plus size={20} />
            <span>Create Group</span>
          </motion.button>
        </motion.div>

        {groups.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <Users size={64} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">No groups yet</h3>
            <p className="text-gray-600 mb-6">Create your first group to start organizing reminders</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary"
            >
              Create Your First Group
            </button>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            <AnimatePresence>
              {groups.map((group, index) => (
                <motion.div
                  key={group.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: -20 }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  whileHover={{ y: -8, scale: 1.02 }}
                  className="card group relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-tokyo-blue to-tokyo-cyan"></div>
                  
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-bold text-tokyo-fg truncate pr-2">{group.name}</h3>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleDeleteGroup(group.id);
                      }}
                      className="btn-danger p-2 opacity-0 group-hover:opacity-100 transition-all duration-300 flex-shrink-0"
                    >
                      <Trash2 size={16} />
                    </motion.button>
                  </div>
                  
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center space-x-2 text-sm text-tokyo-fgDark">
                      <div className="w-2 h-2 bg-tokyo-green rounded-full"></div>
                      <span>Created by <span className="font-medium text-tokyo-fg">{group.creator?.username || 'Unknown'}</span></span>
                    </div>
                  </div>

                  <Link
                    to={`/groups/${group.id}/reminders`}
                    className="block w-full"
                  >
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="bg-gradient-to-r from-tokyo-blue/10 to-tokyo-cyan/10 hover:from-tokyo-blue/20 hover:to-tokyo-cyan/20 border border-tokyo-blue/20 hover:border-tokyo-blue/40 text-tokyo-blue hover:text-tokyo-blue px-4 py-3 rounded-2xl text-center font-medium transition-all duration-300 backdrop-blur-sm"
                    >
                      <div className="flex items-center justify-center space-x-2">
                        <Users size={18} />
                        <span>View Reminders</span>
                      </div>
                    </motion.div>
                  </Link>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      {/* Create Group Modal */}
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
              className="glass-card w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-2xl font-bold text-tokyo-fg mb-6">Create New Group</h2>
              
              <form onSubmit={handleCreateGroup} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Group Name
                  </label>
                  <input
                    type="text"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    className="input-field"
                    placeholder="Enter group name"
                    required
                    autoFocus
                  />
                </div>
                
                <div className="flex space-x-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={creating}
                    className="btn-primary flex-1"
                  >
                    {creating ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="loading-spinner w-4 h-4"></div>
                        <span>Creating...</span>
                      </div>
                    ) : (
                      'Create Group'
                    )}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Layout>
  );
};

export default Groups;
