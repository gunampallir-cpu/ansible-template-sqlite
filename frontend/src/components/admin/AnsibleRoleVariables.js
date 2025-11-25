import React, { useState, useEffect } from 'react';
import { ansibleRolesAPI, roleVariablesAPI } from '../../services/api';

const AnsibleRoleVariables = () => {
  const [roles, setRoles] = useState([]);
  const [variables, setVariables] = useState([]);
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedOsPlatform, setSelectedOsPlatform] = useState('Linux');
  const [variableContent, setVariableContent] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadRoles = async () => {
    try {
      const response = await ansibleRolesAPI.getAll({ os_platform: selectedOsPlatform });
      setRoles(response.data);
    } catch (err) {
      console.error('Failed to load roles');
    }
  };

  const loadVariables = async () => {
    try {
      const response = await roleVariablesAPI.getAll();
      setVariables(response.data);
    } catch (err) {
      setError('Failed to load variables');
    }
  };

  const loadExistingVariable = async () => {
    try {
      const response = await roleVariablesAPI.getAll({
        role_id: selectedRole,
        os_platform: selectedOsPlatform
      });
      
      if (response.data.length > 0) {
        setVariableContent(response.data[0].variable_content);
        setEditingId(response.data[0].id);
      } else {
        setVariableContent('');
        setEditingId(null);
      }
    } catch (err) {
      console.error('Failed to load existing variable');
    }
  };

  useEffect(() => {
    loadRoles();
    loadVariables();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedRole && selectedOsPlatform) {
      loadExistingVariable();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRole, selectedOsPlatform]);

  const handleOsPlatformChange = (platform) => {
    setSelectedOsPlatform(platform);
    setSelectedRole('');
    setVariableContent('');
    setEditingId(null);
    loadRoles();
  };

  const handleSave = async (e) => {
    e.preventDefault();
    
    if (!selectedRole) {
      setError('Please select a role');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const data = {
        role_id: parseInt(selectedRole),
        os_platform: selectedOsPlatform,
        variable_content: variableContent
      };

      if (editingId) {
        await roleVariablesAPI.update(editingId, data);
        setSuccess('Role variables updated successfully!');
      } else {
        await roleVariablesAPI.create(data);
        setSuccess('Role variables created successfully!');
      }
      
      await loadVariables();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save variables');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete these variables?')) {
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await roleVariablesAPI.delete(id);
      setSuccess('Variables deleted successfully!');
      setVariableContent('');
      setEditingId(null);
      await loadVariables();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete variables');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-section">
      <h2>Ansible Role Variables</h2>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <form onSubmit={handleSave}>
        <div className="form-group">
          <label htmlFor="osPlatform">OS Platform *</label>
          <select
            id="osPlatform"
            value={selectedOsPlatform}
            onChange={(e) => handleOsPlatformChange(e.target.value)}
            disabled={loading}
          >
            <option value="Linux">Linux</option>
            <option value="Windows">Windows</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="role">Ansible Role *</label>
          <select
            id="role"
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            disabled={loading}
            required
          >
            <option value="">-- Select a role --</option>
            {roles.map(role => (
              <option key={role.id} value={role.id}>
                {role.role_name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="variableContent">
            Variable Content *
            <br />
            <small style={{ color: '#666', fontWeight: 'normal' }}>
              These variables will be added to environment_groupX.yml files
            </small>
          </label>
          <textarea
            id="variableContent"
            value={variableContent}
            onChange={(e) => setVariableContent(e.target.value)}
            disabled={loading}
            required
            style={{ minHeight: '300px' }}
          />
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={loading || !selectedRole}>
            {loading ? 'Saving...' : editingId ? 'Update Variables' : 'Create Variables'}
          </button>
          {editingId && (
            <button
              type="button"
              className="btn btn-danger"
              onClick={() => handleDelete(editingId)}
              disabled={loading}
            >
              Delete Variables
            </button>
          )}
        </div>
      </form>

      <div className="table-container" style={{ marginTop: '40px' }}>
        <h3>Existing Variables</h3>
        <table>
          <thead>
            <tr>
              <th>Role Name</th>
              <th>OS Platform</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {variables.length === 0 ? (
              <tr>
                <td colSpan="3" style={{ textAlign: 'center', color: '#666' }}>
                  No variables configured
                </td>
              </tr>
            ) : (
              variables.map(variable => (
                <tr key={variable.id}>
                  <td>{variable.role_name}</td>
                  <td>{variable.os_platform}</td>
                  <td>
                    <button
                      className="btn btn-small btn-secondary"
                      onClick={() => {
                        setSelectedRole(variable.role_id.toString());
                        setSelectedOsPlatform(variable.os_platform);
                      }}
                    >
                      View/Edit
                    </button>
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

export default AnsibleRoleVariables;
