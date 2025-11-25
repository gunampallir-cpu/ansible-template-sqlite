import React, { useState, useEffect } from 'react';
import { gitlabCIAPI, ansibleRolesAPI } from '../../services/api';

const GitLabCIYaml = () => {
  const [activeTab, setActiveTab] = useState('common');
  const [configs, setConfigs] = useState([]);
  const [roles, setRoles] = useState([]);
  const [formData, setFormData] = useState({
    config_type: 'common',
    environment: '',
    os_platform: '',
    role_id: '',
    config_content: ''
  });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadConfigs = async () => {
    try {
      const response = await gitlabCIAPI.getAll({ config_type: activeTab });
      setConfigs(response.data);
    } catch (err) {
      console.error('Failed to load configs');
    }
  };

  const loadRoles = async () => {
    try {
      const response = await ansibleRolesAPI.getAll();
      setRoles(response.data);
    } catch (err) {
      console.error('Failed to load roles');
    }
  };

  const resetForm = () => {
    setFormData({
      config_type: activeTab,
      environment: '',
      os_platform: '',
      role_id: '',
      config_content: ''
    });
    setEditingId(null);
  };

  useEffect(() => {
    loadConfigs();
    loadRoles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadConfigs();
    resetForm();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const data = {
        ...formData,
        role_id: formData.role_id ? parseInt(formData.role_id) : null
      };

      if (editingId) {
        await gitlabCIAPI.update(editingId, data);
        setSuccess('Configuration updated successfully!');
      } else {
        await gitlabCIAPI.create(data);
        setSuccess('Configuration created successfully!');
      }
      
      resetForm();
      await loadConfigs();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (config) => {
    setFormData({
      config_type: config.config_type,
      environment: config.environment || '',
      os_platform: config.os_platform || '',
      role_id: config.role_id || '',
      config_content: config.config_content
    });
    setEditingId(config.id);
    setError('');
    setSuccess('');
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this configuration?')) {
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await gitlabCIAPI.delete(id);
      setSuccess('Configuration deleted successfully!');
      await loadConfigs();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete configuration');
    } finally {
      setLoading(false);
    }
  };

  const renderFormFields = () => {
    switch (activeTab) {
      case 'common':
        return (
          <p style={{ color: '#666', marginBottom: '20px' }}>
            Common configuration that is included in all .gitlab-ci.yml files (variables, includes, etc.)
          </p>
        );
      
      case 'environment':
        return (
          <>
            <div className="form-group">
              <label htmlFor="environment">Environment *</label>
              <select
                id="environment"
                name="environment"
                value={formData.environment}
                onChange={handleInputChange}
                required
              >
                <option value="">-- Select --</option>
                <option value="dev">Development</option>
                <option value="it">Integration Testing</option>
                <option value="uat">User Acceptance Testing</option>
                <option value="prod">Production</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="os_platform">OS Platform *</label>
              <select
                id="os_platform"
                name="os_platform"
                value={formData.os_platform}
                onChange={handleInputChange}
                required
              >
                <option value="">-- Select --</option>
                <option value="Linux">Linux</option>
                <option value="Windows">Windows</option>
              </select>
            </div>
          </>
        );
      
      case 'role':
        return (
          <>
            <div className="form-group">
              <label htmlFor="role_id">Ansible Role *</label>
              <select
                id="role_id"
                name="role_id"
                value={formData.role_id}
                onChange={handleInputChange}
                required
              >
                <option value="">-- Select --</option>
                {roles.map(role => (
                  <option key={role.id} value={role.id}>
                    {role.role_name} ({role.os_platform})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="environment">Environment (Optional)</label>
              <select
                id="environment"
                name="environment"
                value={formData.environment}
                onChange={handleInputChange}
              >
                <option value="">All Environments</option>
                <option value="dev">Development</option>
                <option value="it">Integration Testing</option>
                <option value="uat">User Acceptance Testing</option>
                <option value="prod">Production</option>
              </select>
            </div>
          </>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="admin-section">
      <h2>GitLab CI YAML Configuration</h2>

      <div style={{ marginBottom: '20px', borderBottom: '2px solid #eee' }}>
        <button
          className={`tab-btn ${activeTab === 'common' ? 'active' : ''}`}
          onClick={() => setActiveTab('common')}
          style={{
            padding: '10px 20px',
            border: 'none',
            background: activeTab === 'common' ? '#667eea' : 'transparent',
            color: activeTab === 'common' ? 'white' : '#333',
            cursor: 'pointer',
            borderRadius: '5px 5px 0 0'
          }}
        >
          Common Config
        </button>
        <button
          className={`tab-btn ${activeTab === 'environment' ? 'active' : ''}`}
          onClick={() => setActiveTab('environment')}
          style={{
            padding: '10px 20px',
            border: 'none',
            background: activeTab === 'environment' ? '#667eea' : 'transparent',
            color: activeTab === 'environment' ? 'white' : '#333',
            cursor: 'pointer',
            borderRadius: '5px 5px 0 0'
          }}
        >
          Environment Config
        </button>
        <button
          className={`tab-btn ${activeTab === 'role' ? 'active' : ''}`}
          onClick={() => setActiveTab('role')}
          style={{
            padding: '10px 20px',
            border: 'none',
            background: activeTab === 'role' ? '#667eea' : 'transparent',
            color: activeTab === 'role' ? 'white' : '#333',
            cursor: 'pointer',
            borderRadius: '5px 5px 0 0'
          }}
        >
          Role-Specific Config
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <form onSubmit={handleSubmit} style={{ marginBottom: '30px', background: '#f9f9f9', padding: '20px', borderRadius: '8px' }}>
        <h3>{editingId ? 'Edit Configuration' : 'Add New Configuration'}</h3>
        
        {renderFormFields()}

        <div className="form-group">
          <label htmlFor="config_content">
            YAML Configuration Content *
            <br />
            <small style={{ color: '#666', fontWeight: 'normal' }}>
              GitLab CI job definition
            </small>
          </label>
          <textarea
            id="config_content"
            name="config_content"
            value={formData.config_content}
            onChange={handleInputChange}
            disabled={loading}
            required
            style={{ minHeight: '300px' }}
          />
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Saving...' : editingId ? 'Update Config' : 'Add Config'}
          </button>
          {editingId && (
            <button type="button" className="btn btn-secondary" onClick={resetForm} disabled={loading}>
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="table-container">
        <h3>Existing Configurations</h3>
        <table>
          <thead>
            <tr>
              <th>Type</th>
              <th>Environment</th>
              <th>OS Platform</th>
              <th>Role</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {configs.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', color: '#666' }}>
                  No configurations found
                </td>
              </tr>
            ) : (
              configs.map(config => (
                <tr key={config.id}>
                  <td>{config.config_type}</td>
                  <td>{config.environment || '-'}</td>
                  <td>{config.os_platform || '-'}</td>
                  <td>{config.role_id || '-'}</td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn btn-small btn-secondary"
                        onClick={() => handleEdit(config)}
                        disabled={loading}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-small btn-danger"
                        onClick={() => handleDelete(config.id)}
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

export default GitLabCIYaml;
