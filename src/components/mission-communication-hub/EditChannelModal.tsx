"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";

interface EditChannelModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  channel: {
    _id: string;
    type: string;
    visibility: string;
    allowedRoles: string[];
    groupId?: { _id: string; name: string };
    missionId: { _id: string; code: string; title: string };
  } | null;
}

interface Group {
  _id: string;
  name: string;
}

export default function EditChannelModal({
  open,
  onClose,
  onSuccess,
  channel,
}: EditChannelModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(false);

  const [formData, setFormData] = useState({
    type: "group-discussion" as "mentor-messaging" | "group-discussion" | "group-announcement",
    visibility: "group" as "non-student" | "group",
    allowedRoles: [] as string[],
    status: "active" as "active" | "inactive",
    groupId: "",
  });

  // Initialize form data when channel changes
  useEffect(() => {
    if (channel && open) {
      setFormData({
        type: channel.type as any,
        visibility: channel.visibility as any,
        allowedRoles: [...channel.allowedRoles],
        status: (channel as any).status || "active",
        groupId: channel.groupId?._id || "",
      });
      
      // Load groups for this mission
      if (channel.missionId?._id) {
        loadGroups(channel.missionId._id);
      }
    }
  }, [channel, open]);

  const loadGroups = async (missionId: string) => {
    setLoadingGroups(true);
    try {
      const res = await fetch(`/api/v2/mentorship-groups?missionId=${missionId}&page=1&limit=100`);
      const json = await res.json();
      if (json?.success) {
        setGroups(json.data || []);
      }
    } catch (err) {
      console.error("Failed to load groups:", err);
    } finally {
      setLoadingGroups(false);
    }
  };

  const handleRoleToggle = (role: string) => {
    setFormData((prev) => {
      const roles = prev.allowedRoles.includes(role)
        ? prev.allowedRoles.filter((r) => r !== role)
        : [...prev.allowedRoles, role];
      return { ...prev, allowedRoles: roles };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!channel) return;
    
    setError(null);
    setLoading(true);

    try {
      const payload = {
        type: formData.type,
        visibility: formData.visibility,
        allowedRoles: formData.allowedRoles,
        status: formData.status,
        groupId: formData.groupId || null,
      };

      const res = await fetch(`/api/v2/channels/${channel._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok || !json?.success) {
        throw new Error(json?.error || "Failed to update channel");
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to update channel");
    } finally {
      setLoading(false);
    }
  };

  if (!open || !channel) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white">
          <div>
            <h2 className="text-xl font-bold">Edit Channel</h2>
            <p className="text-sm text-gray-600 mt-1">
              {channel.missionId?.code} - {channel.missionId?.title}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg"
            type="button"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Group Select (Optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mentorship Group (optional)
            </label>
            <select
              value={formData.groupId}
              onChange={(e) => setFormData({ ...formData, groupId: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={loadingGroups}
            >
              <option value="">No group (mission-wide channel)</option>
              {groups.map((group) => (
                <option key={group._id} value={group._id}>
                  {group.name}
                </option>
              ))}
            </select>
            {loadingGroups && (
              <p className="text-xs text-gray-500 mt-1">Loading groups...</p>
            )}
          </div>

          {/* Channel Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Channel Type <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="mentor-messaging">Mentor Messaging</option>
              <option value="group-discussion">Group Discussion</option>
              <option value="group-announcement">Group Announcement</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              {formData.type === "mentor-messaging" && "For mentor-only discussions"}
              {formData.type === "group-discussion" && "For group members to discuss"}
              {formData.type === "group-announcement" && "For mentors to post announcements"}
            </p>
          </div>

          {/* Visibility */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Visibility <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.visibility}
              onChange={(e) => setFormData({ ...formData, visibility: e.target.value as any })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="non-student">Non-Student (Mentors & Staff only)</option>
              <option value="group">Group (Group members only)</option>
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              {formData.status === 'active' ? 'Channel is active and accessible' : 'Channel is inactive and hidden from users'}
            </p>
          </div>

          {/* Allowed Roles */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Allowed Roles <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              {["admin", "developer", "manager", "sre", "mentor", "student"].map((role) => (
                <label key={role} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.allowedRoles.includes(role)}
                    onChange={() => handleRoleToggle(role)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm capitalize">{role}</span>
                </label>
              ))}
            </div>
            {formData.allowedRoles.length === 0 && (
              <p className="text-xs text-red-600 mt-1">At least one role must be selected</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || formData.allowedRoles.length === 0}
              className="px-4 py-2 text-sm font-medium text-white bg-black hover:bg-gray-800 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Updating..." : "Update Channel"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

