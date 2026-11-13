'use client';

import { useEffect, useMemo, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function MissionAttendanceFormsPage() {
  const params = useParams();
  const router = useRouter();
  const missionId = String(params?.missionId || '');
  const { user } = useAuth();
  const isPrivileged = useMemo(() => ['admin', 'sre', 'mentor', 'developer'].includes(user?.role || ''), [user]);

  const [forms, setForms] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);
  const notificationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const load = async () => {
      const res = await fetch(`/api/v2/attendance/forms?missionId=${missionId}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setForms(data.data || []);
      }
    };
    if (missionId) load();
  }, [missionId]);

  // Auto-hide notification after 3 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Handle click outside notification to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notification && notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setNotification(null);
      }
    };

    if (notification) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [notification]);

  if (!isPrivileged) return <div className="p-4 text-xs">Insufficient permissions.</div>;

  const deleteForm = async (formId: string) => {
    if (!confirm('Are you sure you want to delete this form? This action cannot be undone.')) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/v2/attendance/forms/${formId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        setNotification({ type: 'success', message: 'Form deleted successfully!' });
        setForms(forms.filter(form => form._id !== formId));
      } else {
        setNotification({ type: 'error', message: result.error || 'Failed to delete form' });
      }
    } catch (error) {
      console.error('Error deleting form:', error);
      setNotification({ type: 'error', message: 'Failed to delete form' });
    } finally {
      setLoading(false);
    }
  };

  const toggleFormStatus = async (formId: string, newStatus: boolean) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/v2/attendance/forms/${formId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ active: newStatus }),
      });

      const result = await response.json();

      if (result.success) {
        setNotification({ 
          type: 'success', 
          message: `Form ${newStatus ? 'activated' : 'deactivated'} successfully!` 
        });
        setForms(forms.map(form => 
          form._id === formId ? { ...form, active: newStatus } : form
        ));
      } else {
        setNotification({ type: 'error', message: result.error || 'Failed to update form status' });
      }
    } catch (error) {
      console.error('Error updating form status:', error);
      setNotification({ type: 'error', message: 'Failed to update form status' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 text-xs">
      {/* Custom Notification */}
      {notification && (
        <div 
          ref={notificationRef}
          className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg ${
            notification.type === 'success'
              ? 'bg-green-500 text-white'
              : 'bg-red-500 text-white'
          }`}
        >
          <div className="flex items-center gap-2">
            <span>{notification.type === 'success' ? '✓' : '✕'}</span>
            <span>{notification.message}</span>
            <button
              onClick={() => setNotification(null)}
              className="ml-2 text-white hover:text-gray-200"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Header and Create Button */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 flex justify-between items-center">
        <div>
          <h1 className="text-lg font-bold text-black">Attendance Forms</h1>
          <p className="text-xs text-gray-600 mt-1">Manage dynamic attendance forms for this mission.</p>
        </div>
        <button
          onClick={() => router.push(`/mission-hub/missions/${missionId}/attendance/forms/create`)}
          className="px-3 py-2 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Create New Form
        </button>
      </div>

      {/* Forms Table */}
      <div className="table-container">
        {forms.length === 0 ? (
          <div className="p-6 text-center text-gray-500 bg-white rounded-lg border border-gray-200">
            No attendance forms created yet. Click "Create New Form" to get started.
          </div>
        ) : (
          <div className="table-responsive">
          <table className="table-compact">
            <thead>
              <tr>
                <th>
                  Form Title
                </th>
                <th>
                  Questions
                </th>
                <th>
                  Status
                </th>
                <th>
                  Created
                </th>
                <th className="actions">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {forms.map((form) => (
                <tr key={form._id}>
                  <td>
                    {form.title}
                  </td>
                  <td className="text-gray-500">
                    {form.questions.length}
                  </td>
                  <td>
                    <button
                      onClick={() => toggleFormStatus(form._id, !form.active)}
                      disabled={loading}
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold transition-colors ${
                        form.active 
                          ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                          : 'bg-red-100 text-red-800 hover:bg-red-200'
                      } ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                      title={`Click to ${form.active ? 'deactivate' : 'activate'} this form`}
                    >
                      {form.active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="text-gray-500">
                    {new Date(form.createdAt).toLocaleDateString()}
                  </td>
                  <td className="actions">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => router.push(`/mission-hub/missions/${missionId}/attendance/forms/${form._id}/view`)}
                        className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50"
                      >
                        View
                      </button>
                      <button
                        onClick={() => router.push(`/mission-hub/missions/${missionId}/attendance/forms/${form._id}/edit`)}
                        className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteForm(form._id)}
                        className="px-2 py-1 text-xs border border-red-300 text-red-700 rounded hover:bg-red-50"
                      >
                        Delete
                      </button>
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
  );
}