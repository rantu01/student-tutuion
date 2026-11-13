"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { useAppSelector } from "@/hooks/useAppSelector";
import { selectSelectedMission } from "@/store/missionHubSlice";
import { Plus, RefreshCw, Trash2, Edit, CheckCircle2, XCircle } from "lucide-react";
import CreateChannelModal from "@/components/mission-communication-hub/CreateChannelModal";
import EditChannelModal from "@/components/mission-communication-hub/EditChannelModal";

interface Channel {
  _id: string;
  missionId: {
    _id: string;
    code: string;
    title: string;
  };
  groupId?: {
    _id: string;
    name: string;
  };
  type: "mentor-messaging" | "group-discussion" | "group-announcement";
  visibility: "non-student" | "group";
  allowedRoles: string[];
  status: "active" | "inactive";
  createdBy: {
    _id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface MigrationResult {
  totalGroups: number;
  groupsProcessed: number;
  channelsCreated: number;
  groupsWithChannels: number;
  errors: Array<{ groupId: string; groupName: string; error: string }>;
  details: Array<{ groupId: string; groupName: string; version: string; channelsCreated: string[] }>;
}

export default function ManageChannelsPage() {
  const { user } = useAuth();
  const mission = useAppSelector(selectSelectedMission);
  const missionId = useMemo(() => mission?._id || "", [mission?._id]);

  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [migrating, setMigrating] = useState(false);
  const [migrationResult, setMigrationResult] = useState<MigrationResult | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editChannel, setEditChannel] = useState<Channel | null>(null);
  const [deleteChannelId, setDeleteChannelId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Check if user has permission
  const isModerator = ['admin', 'developer', 'manager', 'sre', 'mentor'].includes(user?.role?.toLowerCase() || '');

  useEffect(() => {
    if (missionId) {
      loadChannels();
    }
  }, [missionId]);

  const loadChannels = async () => {
    if (!missionId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const res = await fetch(`/api/v2/channels?missionId=${missionId}`);
      const json = await res.json();
      
      if (!res.ok || !json?.success) {
        throw new Error(json?.error || 'Failed to load channels');
      }
      
      setChannels(json.data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load channels');
    } finally {
      setLoading(false);
    }
  };

  const handleMigrateChannels = async () => {
    if (!confirm('This will create missing channels for all mentorship groups. Continue?')) {
      return;
    }

    setMigrating(true);
    setMigrationResult(null);
    setError(null);

    try {
      const res = await fetch('/api/admin/migrate-channels', {
        method: 'POST',
      });
      const json = await res.json();

      if (!res.ok || !json?.success) {
        throw new Error(json?.error || 'Migration failed');
      }

      setMigrationResult(json.data);
      
      // Reload channels
      await loadChannels();
    } catch (err: any) {
      setError(err.message || 'Migration failed');
    } finally {
      setMigrating(false);
    }
  };

  const handleDeleteChannel = async () => {
    if (!deleteChannelId) return;

    setDeleting(true);
    setError(null);

    try {
      const res = await fetch(`/api/v2/channels/${deleteChannelId}`, {
        method: 'DELETE',
      });
      const json = await res.json();

      if (!res.ok || !json?.success) {
        throw new Error(json?.error || 'Failed to delete channel');
      }

      // Reload channels
      await loadChannels();
      setDeleteChannelId(null);
    } catch (err: any) {
      setError(err.message || 'Failed to delete channel');
    } finally {
      setDeleting(false);
    }
  };

  const getChannelTypeColor = (type: string) => {
    switch (type) {
      case 'mentor-messaging':
        return 'bg-blue-100 text-blue-700';
      case 'group-discussion':
        return 'bg-green-100 text-green-700';
      case 'group-announcement':
        return 'bg-purple-100 text-purple-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getVisibilityColor = (visibility: string) => {
    return visibility === 'group' ? 'bg-orange-100 text-orange-700' : 'bg-indigo-100 text-indigo-700';
  };

  const handleToggleStatus = async (channelId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    
    try {
      const res = await fetch(`/api/v2/channels/${channelId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const json = await res.json();

      if (!res.ok || !json?.success) {
        throw new Error(json?.error || 'Failed to update status');
      }

      // Update local state
      setChannels(prev => prev.map(ch => 
        ch._id === channelId ? { ...ch, status: newStatus as 'active' | 'inactive' } : ch
      ));
    } catch (err: any) {
      setError(err.message || 'Failed to update status');
    }
  };

  if (!isModerator) {
    return (
      <div className="p-8 text-center">
        <div className="text-red-600 font-medium">
          Access Denied
        </div>
        <div className="text-gray-600 text-sm mt-2">
          Only moderators can manage channels
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Channel Management</h1>
          <p className="text-sm text-gray-600 mt-1">
            Manage communication channels for {mission?.code || 'all missions'}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleMigrateChannels}
            disabled={migrating}
            className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {migrating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Migrating...</span>
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                <span>Auto-Create Missing Channels</span>
              </>
            )}
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-black hover:bg-gray-800 rounded-lg"
          >
            <Plus className="w-4 h-4" />
            <span>Create Channel</span>
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Migration Result */}
      {migrationResult && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg space-y-3">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <h3 className="font-medium text-green-900">Migration Completed Successfully</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-gray-600">Total Groups</div>
              <div className="text-lg font-semibold">{migrationResult.totalGroups}</div>
            </div>
            <div>
              <div className="text-gray-600">Processed</div>
              <div className="text-lg font-semibold">{migrationResult.groupsProcessed}</div>
            </div>
            <div>
              <div className="text-gray-600">Channels Created</div>
              <div className="text-lg font-semibold text-green-600">{migrationResult.channelsCreated}</div>
            </div>
            <div>
              <div className="text-gray-600">Errors</div>
              <div className="text-lg font-semibold text-red-600">{migrationResult.errors.length}</div>
            </div>
          </div>
          
          {migrationResult.details.length > 0 && (
            <details className="mt-3">
              <summary className="cursor-pointer text-sm font-medium text-green-900">
                View Created Channels ({migrationResult.details.length} groups)
              </summary>
              <div className="mt-2 space-y-1 text-xs">
                {migrationResult.details.map((detail, idx) => (
                  <div key={idx} className="p-2 bg-white rounded border">
                    <div className="font-medium">{detail.groupName}</div>
                    <div className="text-gray-600">
                      Created: {detail.channelsCreated.join(', ')}
                    </div>
                  </div>
                ))}
              </div>
            </details>
          )}

          {migrationResult.errors.length > 0 && (
            <details className="mt-3">
              <summary className="cursor-pointer text-sm font-medium text-red-900">
                View Errors ({migrationResult.errors.length})
              </summary>
              <div className="mt-2 space-y-1 text-xs">
                {migrationResult.errors.map((err, idx) => (
                  <div key={idx} className="p-2 bg-red-100 rounded border border-red-200">
                    <div className="font-medium">{err.groupName}</div>
                    <div className="text-red-700">{err.error}</div>
                  </div>
                ))}
              </div>
            </details>
          )}
        </div>
      )}

      {/* Channels List */}
      <div className="bg-white border rounded-lg">
        <div className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              Channels ({channels.length})
            </h2>
            <button
              onClick={loadChannels}
              disabled={loading}
              className="p-2 hover:bg-gray-100 rounded-lg"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
            Loading channels...
          </div>
        ) : channels.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No channels found for this mission
          </div>
        ) : (
          <div className="divide-y">
            {channels.map((channel) => (
              <div key={channel._id} className="p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getChannelTypeColor(channel.type)}`}>
                        {channel.type}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getVisibilityColor(channel.visibility)}`}>
                        {channel.visibility}
                      </span>
                      <button
                        onClick={() => handleToggleStatus(channel._id, channel.status)}
                        className={`px-2 py-1 rounded text-xs font-medium cursor-pointer transition-colors ${
                          channel.status === 'active'
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                        title={`Click to ${channel.status === 'active' ? 'deactivate' : 'activate'}`}
                      >
                        {channel.status}
                      </button>
                    </div>
                    
                    {channel.groupId && (
                      <div className="text-sm font-medium">
                        Group: {channel.groupId.name}
                      </div>
                    )}
                    
                    <div className="text-xs text-gray-600 space-y-1">
                      <div>Mission: {channel.missionId.code} - {channel.missionId.title}</div>
                      <div>Allowed Roles: {channel.allowedRoles.join(', ')}</div>
                      <div>Created: {new Date(channel.createdAt).toLocaleDateString()}</div>
                      <div className="font-mono bg-gray-50 px-2 py-1 rounded mt-1">
                        <strong>Channel ID:</strong> {channel._id}
                      </div>
                      {channel.groupId && (
                        <div className="font-mono bg-gray-50 px-2 py-1 rounded">
                          <strong>Group ID:</strong> {channel.groupId._id}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => setEditChannel(channel)}
                      className="p-2 hover:bg-gray-200 rounded-lg text-gray-600"
                      title="Edit Channel"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteChannelId(channel._id)}
                      className="p-2 hover:bg-red-100 rounded-lg text-red-600"
                      title="Delete Channel"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Channel Modal */}
      <CreateChannelModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          setShowCreateModal(false);
          loadChannels();
        }}
        defaultMissionId={missionId}
      />

      {/* Edit Channel Modal */}
      <EditChannelModal
        open={!!editChannel}
        onClose={() => setEditChannel(null)}
        onSuccess={() => {
          setEditChannel(null);
          loadChannels();
        }}
        channel={editChannel}
      />

      {/* Delete Confirmation Dialog */}
      {deleteChannelId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Channel</h3>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to delete this channel? This action cannot be undone.
              All messages in this channel will remain but the channel will be inaccessible.
            </p>
            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => setDeleteChannelId(null)}
                disabled={deleting}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteChannel}
                disabled={deleting}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Delete Channel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

