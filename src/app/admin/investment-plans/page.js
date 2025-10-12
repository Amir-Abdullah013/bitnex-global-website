'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminAuth } from '../../../lib/admin-auth';
import Layout from '../../../components/Layout';
import Card, { CardContent, CardHeader, CardTitle } from '../../../components/Card';
import Button from '../../../components/Button';
import Input from '../../../components/Input';
import { useToast, ToastContainer } from '../../../components/Toast';

export default function AdminInvestmentPlansPage() {
  const { adminUser, isLoading, isAuthenticated } = useAdminAuth();
  const router = useRouter();
  const { success, error, toasts, removeToast } = useToast();
  const [mounted, setMounted] = useState(false);
  
  const [plans, setPlans] = useState([]);
  const [filteredPlans, setFilteredPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  const [formData, setFormData] = useState({
    planName: '',
    minimumInvestment: '',
    maximumInvestment: '',
    profitPercentage: '',
    duration: '',
    description: ''
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !isLoading) {
      if (!isAuthenticated) {
        router.push('/auth/signin');
      } else {
        loadPlans();
      }
    }
  }, [mounted, isLoading, isAuthenticated, router]);

  const loadPlans = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/investment-plans');
      const data = await response.json();
      
      if (data.success) {
        setPlans(data.data);
        setFilteredPlans(data.data);
      } else {
        error('Failed to load investment plans');
      }
    } catch (err) {
      console.error('Error loading plans:', err);
      error('Failed to load investment plans');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const url = editingPlan ? `/api/investment-plans/${editingPlan.id}` : '/api/investment-plans';
      const method = editingPlan ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      
      if (data.success) {
        success(editingPlan ? 'Plan updated successfully' : 'Plan created successfully');
        setShowForm(false);
        setEditingPlan(null);
        setFormData({
          planName: '',
          minimumInvestment: '',
          maximumInvestment: '',
          profitPercentage: '',
          duration: '',
          description: ''
        });
        loadPlans();
      } else {
        error(data.error || 'Failed to save plan');
      }
    } catch (err) {
      console.error('Error saving plan:', err);
      error('Failed to save plan');
    }
  };

  const handleEdit = (plan) => {
    setEditingPlan(plan);
    setFormData({
      planName: plan.planName,
      minimumInvestment: plan.minimumInvestment.toString(),
      maximumInvestment: plan.maximumInvestment.toString(),
      profitPercentage: plan.profitPercentage.toString(),
      duration: plan.duration.toString(),
      description: plan.description || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (planId) => {
    if (!confirm('Are you sure you want to delete this plan?')) return;
    
    try {
      const response = await fetch(`/api/investment-plans/${planId}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (data.success) {
        success('Plan deleted successfully');
        loadPlans();
      } else {
        error(data.error || 'Failed to delete plan');
      }
    } catch (err) {
      console.error('Error deleting plan:', err);
      error('Failed to delete plan');
    }
  };

  const togglePlanStatus = async (planId, currentStatus) => {
    try {
      const response = await fetch(`/api/investment-plans/${planId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus })
      });
      
      const data = await response.json();
      
      if (data.success) {
        success(`Plan ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
        loadPlans();
      } else {
        error(data.error || 'Failed to update plan status');
      }
    } catch (err) {
      console.error('Error updating plan status:', err);
      error('Failed to update plan status');
    }
  };

  // Filter and search functionality
  useEffect(() => {
    let filtered = plans;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(plan =>
        plan.planName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        plan.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(plan =>
        statusFilter === 'active' ? plan.isActive : !plan.isActive
      );
    }

    setFilteredPlans(filtered);
  }, [plans, searchTerm, statusFilter]);

  if (!mounted || isLoading) {
    return (
      <div className="min-h-screen bg-binance-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-binance-primary mx-auto mb-4"></div>
          <p className="text-binance-textSecondary">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <Layout showSidebar={true}>
      <div className="min-h-screen bg-binance-background p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-binance-textPrimary">Investment Plans</h1>
                <p className="text-binance-textSecondary mt-1">Manage investment plans for users</p>
              </div>
              <Button
                onClick={() => {
                  setShowForm(true);
                  setEditingPlan(null);
                  setFormData({
                    planName: '',
                    minimumInvestment: '',
                    maximumInvestment: '',
                    profitPercentage: '',
                    duration: '',
                    description: ''
                  });
                }}
                className="bg-binance-primary hover:bg-binance-primary/90"
              >
                + Add New Plan
              </Button>
            </div>
          </div>

          {/* Form Modal */}
          {showForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-binance-surface p-6 rounded-lg w-full max-w-md">
                <h2 className="text-xl font-bold text-binance-textPrimary mb-4">
                  {editingPlan ? 'Edit Plan' : 'Add New Plan'}
                </h2>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <Input
                    label="Plan Name"
                    name="planName"
                    value={formData.planName}
                    onChange={handleInputChange}
                    required
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Min Investment ($)"
                      name="minimumInvestment"
                      type="number"
                      value={formData.minimumInvestment}
                      onChange={handleInputChange}
                      required
                    />
                    <Input
                      label="Max Investment ($)"
                      name="maximumInvestment"
                      type="number"
                      value={formData.maximumInvestment}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Profit Percentage (%)"
                      name="profitPercentage"
                      type="number"
                      step="0.01"
                      value={formData.profitPercentage}
                      onChange={handleInputChange}
                      required
                    />
                    <Input
                      label="Duration (Days)"
                      name="duration"
                      type="number"
                      value={formData.duration}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-binance-textPrimary mb-2">
                      Description
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-binance-border rounded-md bg-binance-background text-binance-textPrimary focus:outline-none focus:ring-2 focus:ring-binance-primary"
                      rows="3"
                    />
                  </div>
                  
                  <div className="flex space-x-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowForm(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1 bg-binance-primary hover:bg-binance-primary/90"
                    >
                      {editingPlan ? 'Update Plan' : 'Create Plan'}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Search and Filter */}
          <div className="mb-6 bg-binance-surface p-4 rounded-lg">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search plans by name or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-binance-border rounded-lg bg-binance-background text-binance-textPrimary focus:outline-none focus:ring-2 focus:ring-binance-primary"
                />
              </div>
              <div className="flex gap-4">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 border border-binance-border rounded-lg bg-binance-background text-binance-textPrimary focus:outline-none focus:ring-2 focus:ring-binance-primary"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
                <Button
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                  }}
                  variant="outline"
                  className="whitespace-nowrap"
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          </div>

          {/* Plans Table */}
          <div className="bg-binance-surface rounded-lg overflow-hidden">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-binance-primary mx-auto mb-4"></div>
                <p className="text-binance-textSecondary">Loading plans...</p>
              </div>
            ) : filteredPlans.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-binance-textSecondary">
                  {plans.length === 0 ? 'No investment plans found' : 'No plans match your search criteria'}
                </p>
                {plans.length === 0 && (
                  <Button
                    onClick={() => setShowForm(true)}
                    className="mt-4 bg-binance-primary hover:bg-binance-primary/90"
                  >
                    Create First Plan
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-binance-background border-b border-binance-border">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-medium text-binance-textSecondary uppercase tracking-wider">
                        Plan Name
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-binance-textSecondary uppercase tracking-wider">
                        Investment Range
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-binance-textSecondary uppercase tracking-wider">
                        Profit %
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-binance-textSecondary uppercase tracking-wider">
                        Duration
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-binance-textSecondary uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-binance-textSecondary uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-binance-border">
                    {filteredPlans.map((plan) => (
                      <tr key={plan.id} className="hover:bg-binance-background/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-binance-textPrimary">
                              {plan.planName}
                            </div>
                            {plan.description && (
                              <div className="text-xs text-binance-textSecondary mt-1">
                                {plan.description.length > 50 
                                  ? `${plan.description.substring(0, 50)}...` 
                                  : plan.description
                                }
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-binance-textPrimary">
                            ${plan.minimumInvestment.toLocaleString()} - ${plan.maximumInvestment.toLocaleString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-binance-green/10 text-binance-green">
                            {plan.profitPercentage}%
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-binance-textPrimary">
                          {plan.duration} days
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            plan.isActive 
                              ? 'bg-binance-green/10 text-binance-green' 
                              : 'bg-binance-red/10 text-binance-red'
                          }`}>
                            {plan.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEdit(plan)}
                              className="text-binance-primary hover:text-binance-primary/80"
                            >
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => togglePlanStatus(plan.id, plan.isActive)}
                              className={plan.isActive ? 'text-red-500 hover:text-red-700' : 'text-green-500 hover:text-green-700'}
                            >
                              {plan.isActive ? 'Deactivate' : 'Activate'}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDelete(plan.id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
        
        <ToastContainer toasts={toasts} removeToast={removeToast} />
      </div>
    </Layout>
  );
}
