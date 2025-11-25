import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ansibleRolesAPI, templateAPI } from '../services/api';
import './TemplateGenerator.css';

const TemplateGenerator = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    environment: 'dev',
    os_platform: 'Linux',
    mettaApplication: '',
    mettaComponent: '',
    shieldTeam: '',
    appContextSubscriptionName: '',
    appContextName: '',
    armSubscriptionId: '',
    sourcePath: '',
    targetIdentifier: '',
    assignmentGroup: '',
  });

  const [vmGroups, setVmGroups] = useState([
    { groupNumber: 1, region: '', hostnames: [''], roles: [], os_platform: 'Linux' }
  ]);

  const [availableRoles, setAvailableRoles] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadRoles = async () => {
    try {
      const params = { os_platform: formData.os_platform };
      if (searchTerm) {
        params.search = searchTerm;
      }
      const response = await ansibleRolesAPI.getAll(params);
      setAvailableRoles(response.data);
    } catch (err) {
      console.error('Failed to load roles:', err);
    }
  };

  useEffect(() => {
    loadRoles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.os_platform, searchTerm]);

  useEffect(() => {
    // Reset VM groups when environment changes
    if (['dev', 'it'].includes(formData.environment)) {
      setVmGroups([{ groupNumber: 1, region: '', hostnames: [''], roles: [], os_platform: formData.os_platform }]);
    } else {
      setVmGroups([
        { groupNumber: 1, region: 'cus', hostnames: [''], roles: [], os_platform: formData.os_platform },
        { groupNumber: 1, region: 'eus', hostnames: [''], roles: [], os_platform: formData.os_platform }
      ]);
    }
  }, [formData.environment, formData.os_platform]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setError('');
  };

  const handleVMGroupChange = (groupIndex, field, value) => {
    const updatedGroups = [...vmGroups];
    updatedGroups[groupIndex][field] = value;
    
    // Update os_platform for all groups
    if (field === 'os_platform') {
      updatedGroups.forEach(group => {
        group.os_platform = value;
      });
      setFormData({ ...formData, os_platform: value });
    }
    
    setVmGroups(updatedGroups);
  };

  const handleHostnameChange = (groupIndex, hostnameIndex, value) => {
    const updatedGroups = [...vmGroups];
    updatedGroups[groupIndex].hostnames[hostnameIndex] = value;
    setVmGroups(updatedGroups);
  };

  const addHostname = (groupIndex) => {
    const updatedGroups = [...vmGroups];
    updatedGroups[groupIndex].hostnames.push('');
    setVmGroups(updatedGroups);
  };

  const removeHostname = (groupIndex, hostnameIndex) => {
    const updatedGroups = [...vmGroups];
    if (updatedGroups[groupIndex].hostnames.length > 1) {
      updatedGroups[groupIndex].hostnames.splice(hostnameIndex, 1);
      setVmGroups(updatedGroups);
    }
  };

  const handleRoleToggle = (groupIndex, roleId) => {
    const updatedGroups = [...vmGroups];
    const roles = updatedGroups[groupIndex].roles;
    
    if (roles.includes(roleId)) {
      updatedGroups[groupIndex].roles = roles.filter(id => id !== roleId);
    } else {
      updatedGroups[groupIndex].roles = [...roles, roleId];
    }
    
    setVmGroups(updatedGroups);
  };

  const addVMGroup = () => {
    const env = formData.environment;
    
    if (['dev', 'it'].includes(env)) {
      const maxGroupNum = Math.max(...vmGroups.map(g => g.groupNumber));
      setVmGroups([
        ...vmGroups,
        { groupNumber: maxGroupNum + 1, region: '', hostnames: [''], roles: [], os_platform: formData.os_platform }
      ]);
    } else {
      // For uat/prod, add both regions
      const centralGroups = vmGroups.filter(g => g.region === 'cus');
      const eastGroups = vmGroups.filter(g => g.region === 'eus');
      const maxCentralNum = centralGroups.length > 0 ? Math.max(...centralGroups.map(g => g.groupNumber)) : 0;
      const maxEastNum = eastGroups.length > 0 ? Math.max(...eastGroups.map(g => g.groupNumber)) : 0;
      const nextGroupNum = Math.max(maxCentralNum, maxEastNum) + 1;
      
      setVmGroups([
        ...vmGroups,
        { groupNumber: nextGroupNum, region: 'cus', hostnames: [''], roles: [], os_platform: formData.os_platform },
        { groupNumber: nextGroupNum, region: 'eus', hostnames: [''], roles: [], os_platform: formData.os_platform }
      ]);
    }
  };

  const removeVMGroup = (groupIndex) => {
    if (vmGroups.length > 1) {
      const updatedGroups = vmGroups.filter((_, index) => index !== groupIndex);
      setVmGroups(updatedGroups);
    }
  };

  const validateForm = () => {
    if (!formData.mettaApplication || !formData.mettaComponent || !formData.shieldTeam ||
        !formData.appContextSubscriptionName || !formData.appContextName || !formData.armSubscriptionId) {
      setError('Please fill in all required fields');
      return false;
    }

    for (const group of vmGroups) {
      const validHostnames = group.hostnames.filter(h => h.trim() !== '');
      if (validHostnames.length === 0) {
        setError('Each VM group must have at least one hostname');
        return false;
      }
      if (group.roles.length === 0) {
        setError('Each VM group must have at least one ansible role selected');
        return false;
      }
    }

    // Check if any role requires LDAP
    const requiresLdap = vmGroups.some(group => 
      group.roles.some(roleId => {
        const role = availableRoles.find(r => r.id === roleId);
        return role && role.requires_ldap;
      })
    );

    if (requiresLdap && (!formData.sourcePath || !formData.targetIdentifier)) {
      setError('SOURCE_PATH and TARGET_IDENTIFIER are required when using roles that need LDAP');
      return false;
    }

    if (['uat', 'prod'].includes(formData.environment) && requiresLdap && !formData.assignmentGroup) {
      setError('ASSIGNMENT_GROUP is required for UAT/PROD environments with LDAP roles');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Filter out empty hostnames and prepare data
      const preparedVmGroups = vmGroups.map(group => ({
        ...group,
        hostnames: group.hostnames.filter(h => h.trim() !== '')
      }));

      const requestData = {
        ...formData,
        vmGroups: preparedVmGroups
      };

      const response = await templateAPI.generate(requestData);
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'Ansible-Template.zip');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setSuccess('Template generated and downloaded successfully!');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to generate template');
    } finally {
      setLoading(false);
    }
  };

  const renderVMGroup = (group, groupIndex) => {
    const env = formData.environment;
    const isMultiRegion = ['uat', 'prod'].includes(env);
    const regionLabel = group.region === 'cus' ? 'Central' : group.region === 'eus' ? 'East' : '';
    const groupLabel = isMultiRegion 
      ? `${regionLabel} VM Group ${group.groupNumber}`
      : `VM Group ${group.groupNumber}`;

    return (
      <div key={groupIndex} className="vm-group">
        <div className="vm-group-header">
          <h3>{groupLabel}</h3>
          {vmGroups.length > 1 && (
            <button 
              type="button" 
              className="btn-remove" 
              onClick={() => removeVMGroup(groupIndex)}
            >
              Remove Group
            </button>
          )}
        </div>

        <div className="form-group">
          <label>Hostnames *</label>
          {group.hostnames.map((hostname, hostnameIndex) => (
            <div key={hostnameIndex} className="hostname-input-group">
              <input
                type="text"
                placeholder="e.g., server1.example.com"
                value={hostname}
                onChange={(e) => handleHostnameChange(groupIndex, hostnameIndex, e.target.value)}
                required
              />
              {group.hostnames.length > 1 && (
                <button
                  type="button"
                  className="btn-remove-small"
                  onClick={() => removeHostname(groupIndex, hostnameIndex)}
                >
                  ✕
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            className="btn-add-small"
            onClick={() => addHostname(groupIndex)}
          >
            + Add Hostname
          </button>
        </div>

        <div className="form-group">
          <label>Ansible Roles *</label>
          <div className="roles-grid">
            {availableRoles.map(role => (
              <label key={role.id} className="role-checkbox">
                <input
                  type="checkbox"
                  checked={group.roles.includes(role.id)}
                  onChange={() => handleRoleToggle(groupIndex, role.id)}
                />
                <span>{role.role_name}</span>
                {role.requires_ldap && <span className="ldap-badge">LDAP</span>}
              </label>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const requiresLdap = vmGroups.some(group => 
    group.roles.some(roleId => {
      const role = availableRoles.find(r => r.id === roleId);
      return role && role.requires_ldap;
    })
  );

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="template-generator">
      <div className="template-header">
        <h1>Ansible Template Generator</h1>
        <div className="template-nav">
          {user ? (
            <>
              <span className="user-welcome">Welcome, {user.username}</span>
              {user.is_admin && (
                <button 
                  className="btn btn-secondary" 
                  onClick={() => navigate('/admin')}
                >
                  Admin Panel
                </button>
              )}
              <button className="btn btn-logout" onClick={handleLogout}>
                Logout
              </button>
            </>
          ) : (
            <button 
              className="btn btn-primary" 
              onClick={() => navigate('/login')}
            >
              Login
            </button>
          )}
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-section">
          <h2>Environment Configuration</h2>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="environment">Environment *</label>
              <select
                id="environment"
                name="environment"
                value={formData.environment}
                onChange={handleInputChange}
                required
              >
                <option value="dev">Development (dev)</option>
                <option value="it">Integration Testing (it)</option>
                <option value="uat">User Acceptance Testing (uat)</option>
                <option value="prod">Production (prod)</option>
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
                <option value="Linux">Linux (RedHat Enterprise Linux)</option>
                <option value="Windows">Windows</option>
              </select>
            </div>
          </div>
        </div>

        <div className="form-section">
          <h2>Application Details</h2>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="mettaApplication">METTA_APPLICATION *</label>
              <input
                type="text"
                id="mettaApplication"
                name="mettaApplication"
                value={formData.mettaApplication}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="mettaComponent">METTA_COMPONENT *</label>
              <input
                type="text"
                id="mettaComponent"
                name="mettaComponent"
                value={formData.mettaComponent}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="shieldTeam">SHIELD_TEAM *</label>
              <input
                type="text"
                id="shieldTeam"
                name="shieldTeam"
                value={formData.shieldTeam}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="appContextSubscriptionName">APP_CONTEXT_SUBSCRIPTION_NAME *</label>
              <input
                type="text"
                id="appContextSubscriptionName"
                name="appContextSubscriptionName"
                value={formData.appContextSubscriptionName}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="appContextName">APP_CONTEXT_NAME *</label>
              <input
                type="text"
                id="appContextName"
                name="appContextName"
                value={formData.appContextName}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="armSubscriptionId">ARM_SUBSCRIPTION_ID *</label>
              <input
                type="text"
                id="armSubscriptionId"
                name="armSubscriptionId"
                value={formData.armSubscriptionId}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>
        </div>

        {requiresLdap && (
          <div className="form-section ldap-section">
            <h2>LDAP Configuration (Required for selected roles)</h2>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="sourcePath">SOURCE_PATH *</label>
                <input
                  type="text"
                  id="sourcePath"
                  name="sourcePath"
                  value={formData.sourcePath}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="targetIdentifier">TARGET_IDENTIFIER *</label>
                <input
                  type="text"
                  id="targetIdentifier"
                  name="targetIdentifier"
                  value={formData.targetIdentifier}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            {['uat', 'prod'].includes(formData.environment) && (
              <div className="form-group">
                <label htmlFor="assignmentGroup">ASSIGNMENT_GROUP *</label>
                <input
                  type="text"
                  id="assignmentGroup"
                  name="assignmentGroup"
                  value={formData.assignmentGroup}
                  onChange={handleInputChange}
                  required
                />
              </div>
            )}
          </div>
        )}

        <div className="form-section">
          <div className="section-header">
            <h2>VM Groups and Ansible Roles</h2>
            <div className="search-box">
              <input
                type="text"
                placeholder="Search ansible roles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {vmGroups.map((group, index) => renderVMGroup(group, index))}

          <button type="button" className="btn btn-secondary" onClick={addVMGroup}>
            + Add VM Group
          </button>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Generating Template...' : 'Generate and Download Template'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TemplateGenerator;
