import React, { useState, useEffect } from 'react';
import { ansibleRolesAPI } from '../../services/api';

const AnsibleRoleNames = () => {
  const [roles, setRoles] = useState([]);
  const [filteredRoles, setFilteredRoles] = useState([]);
  const [selectedOsPlatform, setSelectedOsPlatform] = useState('Linux');
  const [formData, setFormData] = useState({
    role_name: '',
    os_platform: 'Linux',
    requires_ldap: false
  });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadRoles = async () => {
    try {
      const response = await ansibleRolesAPI.getAll();
      setRoles(response.data);
    } catch (err) {
      setError('Failed to load roles');
    }
  };

  const filterRoles = () => {
    const filtered = roles.filter(role => role.os_platform === selectedOsPlatform);
    setFilteredRoles(filtered);
  };

  useEffect(() => {
    loadRoles();
  }, []);

  useEffect(() => {
    filterRoles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roles, selectedOsPlatform]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (editingId) {
        await ansibleRolesAPI.update(editingId, formData);
        setSuccess('Role updated successfully!');
      } else {
        await ansibleRolesAPI.create(formData);
        setSuccess('Role created successfully!');
      }
      
      resetForm();
      await loadRoles();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save role');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (role) => {
    setFormData({
      role_name: role.role_name,
      os_platform: role.os_platform,
      requires_ldap: role.requires_ldap === 1
    });
    setEditingId(role.id);
    setError('');
    setSuccess('');
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this role?')) {
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await ansibleRolesAPI.delete(id);
      setSuccess('Role deleted successfully!');
      await loadRoles();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete role');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      role_name: '',
      os_platform: 'Linux',
      requires_ldap: false
    });
    setEditingId(null);
  };

  return (
    <div className="admin-section">
      <h2>Ansible Role Names</h2>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <form onSubmit={handleSubmit} style={{ marginBottom: '30px', background: '#f9f9f9', padding: '20px', borderRadius: '8px' }}>
        <h3>{editingId ? 'Edit Role' : 'Add New Role'}</h3>
        
        <div className="form-group">
          <label htmlFor="role_name">Role Name *</label>
          <input
            type="text"
            id="role_name"
            name="role_name"
            value={formData.role_name}
            onChange={handleInputChange}
            disabled={loading}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="os_platform">OS Platform *</label>
          <select
            id="os_platform"
            name="os_platform"
            value={formData.os_platform}
            onChange={handleInputChange}
            disabled={loading}
            required
          >
            <option value="Linux">Linux</option>
            <option value="Windows">Windows</option>
          </select>
        </div>

        <div className="form-group">
          <label>
            <input
              type="checkbox"
              name="requires_ldap"
              checked={formData.requires_ldap}
              onChange={handleInputChange}
              disabled={loading}
              style={{ width: 'auto', marginRight: '10px' }}
            />
            Requires LDAP
          </label>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Saving...' : editingId ? 'Update Role' : 'Add Role'}
          </button>
          {editingId && (
            <button type="button" className="btn btn-secondary" onClick={resetForm} disabled={loading}>
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="form-group">
        <label htmlFor="filterPlatform">Filter by OS Platform</label>
        <select
          id="filterPlatform"
          value={selectedOsPlatform}
          onChange={(e) => setSelectedOsPlatform(e.target.value)}
        >
          <option value="Linux">Linux</option>
          <option value="Windows">Windows</option>
        </select>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Role Name</th>
              <th>OS Platform</th>
              <th>Requires LDAP</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredRoles.length === 0 ? (
              <tr>
                <td colSpan="4" style={{ textAlign: 'center', color: '#666' }}>
                  No roles found
                </td>
              </tr>
            ) : (
              filteredRoles.map(role => (
                <tr key={role.id}>
                  <td>{role.role_name}</td>
                  <td>{role.os_platform}</td>
                  <td>{role.requires_ldap ? 'Yes' : 'No'}</td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn btn-small btn-secondary"
                        onClick={() => handleEdit(role)}
                        disabled={loading}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-small btn-danger"
                        onClick={() => handleDelete(role.id)}
                        disabled={loading}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AnsibleRoleNames;
