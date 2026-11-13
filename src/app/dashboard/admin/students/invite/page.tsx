"use client";

import { useState, useEffect } from "react";
import PageHeader from "@/components/PageHeader";
import SimpleSearchAndFilter from "@/components/SimpleSearchAndFilter";
import SimplePagination from "@/components/SimplePagination";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import { useToast } from "@/components/shared/ToastContainer";
import { Check, Mail, X, Users, Send, Trash2, RefreshCw, Filter, Search, Info, UserCheck, Clock, AlertCircle } from "lucide-react";

interface Invitation {
  _id: string;
  email: string;
  status: 'pending' | 'sent' | 'accepted' | 'expired' | 'cancelled';
  sentAt?: string;
  acceptedAt?: string;
  invitedBy: {
    name: string;
    email: string;
  };
  batchId?: {
    code: string;
    title: string;
  };
  resendCount: number;
  createdAt: string;
  enrollmentId: string;
  canBeInvited: boolean;
  passwordExpiresAt?: string;
}

interface Batch {
  _id: string;
  code: string;
  title: string;
}

interface InvitationResponse {
  success: boolean;
  data: Invitation[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export default function InvitationManagementPage() {
  const { showToast } = useToast();
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalInvitations, setTotalInvitations] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [batchFilter, setBatchFilter] = useState("all");
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmails, setInviteEmails] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loadingBatches, setLoadingBatches] = useState(false);
  
  // Bulk invitation states
  const [selectedInvitations, setSelectedInvitations] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);

  const fetchBatches = async () => {
    try {
      setLoadingBatches(true);
      const response = await fetch('/api/batches?limit=100');
      const data = await response.json();
      
      if (data.data) {
        setBatches(data.data);
      }
    } catch (error) {
      console.error("Error fetching batches:", error);
    } finally {
      setLoadingBatches(false);
    }
  };

  const fetchInvitations = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "10"
      });

      if (searchTerm) params.append("email", searchTerm);
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (batchFilter !== "all") params.append("batchId", batchFilter);

      const response = await fetch(`/api/students/enrollments-for-invitation?${params}`);
      const data: InvitationResponse = await response.json();

      if (data.success) {
        setInvitations(data.data);
        setTotalPages(data.pagination.pages);
        setTotalInvitations(data.pagination.total);
      } else {
        showToast({
          type: "error",
          title: "Error",
          message: "Error fetching invitations"
        });
      }
    } catch (error) {
      console.error("Error fetching invitations:", error);
      showToast({
        type: "error",
        title: "Error",
        message: "Failed to fetch invitations"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBatches();
  }, []);

  useEffect(() => {
    fetchInvitations();
  }, [currentPage, searchTerm, statusFilter, batchFilter]);

  // Clear selections when filters change
  useEffect(() => {
    setSelectedInvitations(new Set());
  }, [searchTerm, statusFilter, batchFilter]);

  const handleSendSingleInvitation = async (email: string) => {
    try {
      setInviteLoading(true);
      const response = await fetch("/api/students/send-invitations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ emails: [email] }),
      });

      const data = await response.json();

      if (data.success) {
        showToast({
          type: "success",
          title: "Success",
          message: `Successfully sent invitation to ${email}`
        });
        fetchInvitations(); // Refresh the list
      } else {
        showToast({
          type: "error",
          title: "Error",
          message: data.error?.message || "Failed to send invitation"
        });
      }
    } catch (error) {
      console.error("Error sending invitation:", error);
      showToast({
        type: "error",
        title: "Error",
        message: "Failed to send invitation"
      });
    } finally {
      setInviteLoading(false);
    }
  };

  const handleSendInvitations = async () => {
     if (!inviteEmails.trim()) {
       showToast({
         type: "error",
         title: "Validation Error",
         message: "Please enter email addresses"
       });
       return;
     }

     const emails = inviteEmails
       .split(",")
       .map(email => email.trim())
       .filter(email => email.length > 0);

     if (emails.length === 0) {
       showToast({
         type: "error",
         title: "Validation Error",
         message: "Please enter valid email addresses"
       });
       return;
     }

    try {
      setInviteLoading(true);
      const response = await fetch("/api/students/send-invitations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ emails }),
      });

      const data = await response.json();

             if (data.success) {
         showToast({
           type: "success",
           title: "Success",
           message: `Successfully sent ${data.results.successful} invitations`
         });
         setInviteEmails("");
         setShowInviteModal(false);
         fetchInvitations(); // Refresh the list
       } else {
         showToast({
           type: "error",
           title: "Error",
           message: data.error?.message || "Failed to send invitations"
         });
       }
     } catch (error) {
       console.error("Error sending invitations:", error);
       showToast({
         type: "error",
         title: "Error",
         message: "Failed to send invitations"
       });
     } finally {
      setInviteLoading(false);
    }
  };

  const handleResendInvitation = async (invitationId: string) => {
    try {
      const response = await fetch(`/api/students/send-invitations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ emails: [invitationId] }),
      });

      const data = await response.json();

             if (data.success) {
         showToast({
           type: "success",
           title: "Success",
           message: "Invitation resent successfully"
         });
         fetchInvitations(); // Refresh the list
       } else {
         showToast({
           type: "error",
           title: "Error",
           message: data.error?.message || "Failed to resend invitation"
         });
       }
     } catch (error) {
       console.error("Error resending invitation:", error);
       showToast({
         type: "error",
         title: "Error",
         message: "Failed to resend invitation"
       });
     }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    if (!confirm("Are you sure you want to cancel this invitation?")) return;

    try {
      const response = await fetch(`/api/students/cancel-invitation`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ enrollmentId: invitationId }),
      });

      const data = await response.json();

             if (data.success) {
         showToast({
           type: "success",
           title: "Success",
           message: "Invitation cancelled successfully"
         });
         fetchInvitations(); // Refresh the list
       } else {
         showToast({
           type: "error",
           title: "Error",
           message: data.error?.message || "Failed to cancel invitation"
         });
       }
     } catch (error) {
       console.error("Error cancelling invitation:", error);
       showToast({
         type: "error",
         title: "Error",
         message: "Failed to cancel invitation"
       });
     }
  };

  // Bulk invitation functions
  const handleSelectInvitation = (invitationId: string) => {
    const newSelected = new Set(selectedInvitations);
    if (newSelected.has(invitationId)) {
      newSelected.delete(invitationId);
    } else {
      newSelected.add(invitationId);
    }
    setSelectedInvitations(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedInvitations.size === invitations.length) {
      setSelectedInvitations(new Set());
    } else {
      const allIds = new Set(invitations.map(inv => inv._id));
      setSelectedInvitations(allIds);
    }
  };

  const handleSelectAllInvitable = () => {
    const invitableIds = invitations
      .filter(inv => inv.status === 'pending')
      .map(inv => inv._id);
    setSelectedInvitations(new Set(invitableIds));
  };

  const handleClearSelection = () => {
    setSelectedInvitations(new Set());
  };

  const handleBulkSendInvitations = async () => {
    if (selectedInvitations.size === 0) {
      showToast({
        type: "error",
        title: "Validation Error",
        message: "Please select at least one invitation to send"
      });
      return;
    }

    const selectedInvitationList = Array.from(selectedInvitations);
    const emails = selectedInvitationList.map(id => {
      const invitation = invitations.find(inv => inv._id === id);
      return invitation?.email;
    }).filter(Boolean);

    if (emails.length === 0) {
      showToast({
        type: "error",
        title: "Validation Error",
        message: "No valid emails found in selected invitations"
      });
      return;
    }

    if (!confirm(`Are you sure you want to send invitations to ${emails.length} students?`)) {
      return;
    }

    try {
      setBulkLoading(true);
      const response = await fetch("/api/students/send-invitations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ emails }),
      });

      const data = await response.json();

      if (data.success) {
        showToast({
          type: "success",
          title: "Success",
          message: `Successfully sent ${data.results.successful} invitations out of ${emails.length}`
        });
        setSelectedInvitations(new Set()); // Clear selection
        fetchInvitations(); // Refresh the list
      } else {
        showToast({
          type: "error",
          title: "Error",
          message: data.error?.message || "Failed to send bulk invitations"
        });
      }
    } catch (error) {
      console.error("Error sending bulk invitations:", error);
      showToast({
        type: "error",
        title: "Error",
        message: "Failed to send bulk invitations"
      });
    } finally {
      setBulkLoading(false);
    }
  };

  const handleBulkCancelInvitations = async () => {
    if (selectedInvitations.size === 0) {
      showToast({
        type: "error",
        title: "Validation Error",
        message: "Please select at least one invitation to cancel"
      });
      return;
    }

    if (!confirm(`Are you sure you want to cancel ${selectedInvitations.size} invitations?`)) {
      return;
    }

    try {
      setBulkLoading(true);
      const selectedInvitationList = Array.from(selectedInvitations);
      
      // Cancel invitations one by one
      let successCount = 0;
      let errorCount = 0;

      for (const invitationId of selectedInvitationList) {
        try {
          const response = await fetch(`/api/students/cancel-invitation`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ enrollmentId: invitationId }),
          });

          const data = await response.json();
          if (data.success) {
            successCount++;
          } else {
            errorCount++;
          }
        } catch (error) {
          errorCount++;
        }
      }

      showToast({
        type: "success",
        title: "Bulk Cancel Complete",
        message: `Successfully cancelled ${successCount} invitations${errorCount > 0 ? `, ${errorCount} failed` : ''}`
      });

      setSelectedInvitations(new Set()); // Clear selection
      fetchInvitations(); // Refresh the list
    } catch (error) {
      console.error("Error cancelling bulk invitations:", error);
      showToast({
        type: "error",
        title: "Error",
        message: "Failed to cancel bulk invitations"
      });
    } finally {
      setBulkLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: "bg-gray-100 text-gray-800 border-gray-200",
      invited: "bg-gray-200 text-gray-900 border-gray-300",
      accepted: "bg-gray-800 text-white border-gray-900",
      expired: "bg-gray-900 text-white border-gray-900",
      cancelled: "bg-gray-50 text-gray-600 border-gray-200",
    };

    const displayText = {
      pending: "Pending",
      invited: "Invited",
      accepted: "Accepted",
      expired: "Expired",
      cancelled: "Cancelled",
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded border ${statusConfig[status as keyof typeof statusConfig] || statusConfig.pending}`}>
        {displayText[status as keyof typeof displayText] || status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  // Get count of invitations that can be invited
  const getInvitableCount = () => {
    return invitations.filter(inv => inv.status === 'pending').length;
  };

  // Get count of selected invitations that can be invited
  const getSelectedInvitableCount = () => {
    return Array.from(selectedInvitations).filter(id => {
      const invitation = invitations.find(inv => inv._id === id);
      return invitation && invitation.status === 'pending';
    }).length;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-white min-h-screen text-xs">
      {/* Header - Compact */}
      <div className="border-b border-gray-200 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
              <Mail className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-black">Invitation Management</h1>
              <p className="text-xs text-gray-600">Manage student invitations efficiently</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {selectedInvitations.size > 0 && (
              <div className="bg-black text-white px-2.5 py-1.5 rounded-lg flex items-center space-x-1.5">
                <Check className="w-3.5 h-3.5" />
                <span className="text-xs font-medium">{selectedInvitations.size}</span>
              </div>
            )}

            <button
              onClick={() => setShowInviteModal(true)}
              className="bg-black hover:bg-gray-800 text-white px-3 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 text-xs"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Send</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filters - Compact UI */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 form-compact">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Left: Search + Filters */}
          <div className="flex flex-col sm:flex-row gap-3 flex-1">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search emails..."
                className="w-full pl-10 pr-4 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-500"
              />
            </div>

            {/* Status */}
            <div className="flex items-center gap-2">
              <Filter className="h-3.5 w-3.5 text-gray-500" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white min-w-[120px]"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="invited">Invited</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {/* Batch */}
            <select
              value={batchFilter}
              onChange={(e) => setBatchFilter(e.target.value)}
              className="px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white min-w-[120px]"
            >
              <option value="all">All Batches</option>
              {batches.map(batch => (
                <option key={batch._id} value={batch._id}>
                  {batch.code}
                </option>
              ))}
            </select>

            {/* Clear - only when active */}
            {(searchTerm || statusFilter !== "all" || batchFilter !== "all") && (
              <button
                onClick={() => { setSearchTerm(""); setStatusFilter("all"); setBatchFilter("all"); }}
                className="px-3 py-2 text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-colors"
              >
                Clear
              </button>
            )}
          </div>

          {/* Right: Reserved for actions if needed */}
          <div className="flex items-center gap-3"></div>
        </div>
      </div>

      {/* Bulk Actions - Compact */}
      {selectedInvitations.size > 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Check className="w-4 h-4 text-black" />
              <span className="text-xs font-medium text-black">{selectedInvitations.size} selected</span>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleBulkSendInvitations}
                disabled={bulkLoading || getSelectedInvitableCount() === 0}
                className="bg-black hover:bg-gray-800 disabled:bg-gray-400 text-white px-3 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 text-xs"
                title={`Send invitations to ${getSelectedInvitableCount()} students`}
              >
                {bulkLoading ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                <span>Send ({getSelectedInvitableCount()})</span>
              </button>

              <button
                onClick={handleBulkCancelInvitations}
                disabled={bulkLoading}
                className="bg-gray-800 hover:bg-gray-900 text-white px-3 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 text-xs"
                title={`Cancel ${selectedInvitations.size} invitations`}
              >
                {bulkLoading ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
                <span>Cancel All</span>
              </button>

              <button
                onClick={handleClearSelection}
                className="text-gray-600 hover:text-black text-xs font-medium flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                title="Clear all selections"
              >
                <X className="w-3.5 h-3.5" />
                <span>Clear</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions - Compact */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={handleSelectAllInvitable}
            className="bg-gray-100 hover:bg-gray-200 text-black text-xs font-medium flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors border border-gray-200"
            title={`Select all ${getInvitableCount()} pending invitations`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Select All ({getInvitableCount()})</span>
          </button>
        </div>
        
        <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2">
          <div className="flex items-center space-x-2">
            <Mail className="w-3.5 h-3.5 text-green-600" />
            <div className="text-xs font-medium text-green-900">
              {getInvitableCount()} Ready
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="table-container">
        <div className="table-responsive">
          <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
          <table className="table-compact">
            <thead>
              <tr>
                <th className="w-12">
                  <div className="flex items-center justify-center">
                    <input
                      type="checkbox"
                      checked={selectedInvitations.size === invitations.length && invitations.length > 0}
                      onChange={handleSelectAll}
                      className="h-4 w-4 text-black focus:ring-black border-gray-300 rounded cursor-pointer"
                      title="Select all invitations"
                    />
                  </div>
                </th>
                <th>
                  <span className="text-xs font-medium text-gray-700 uppercase tracking-wider">Student</span>
                </th>
                <th>
                  <span className="text-xs font-medium text-gray-700 uppercase tracking-wider">Status</span>
                </th>
                <th>
                  <span className="text-xs font-medium text-gray-700 uppercase tracking-wider">Batch</span>
                </th>
                <th>
                  <span className="text-xs font-medium text-gray-700 uppercase tracking-wider">Enrolled By</span>
                </th>
                <th>
                  <span className="text-xs font-medium text-gray-700 uppercase tracking-wider">Password</span>
                </th>
                <th>
                  <span className="text-xs font-medium text-gray-700 uppercase tracking-wider">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {invitations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-3 py-12 text-center">
                    <div className="flex flex-col items-center space-y-3">
                      <Mail className="w-12 h-12 text-gray-300" />
                      <div className="text-center">
                        <div className="text-xs font-medium text-gray-900">No invitations found</div>
                        <div className="text-[10px] text-gray-500">Try adjusting your search or filters</div>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                invitations.map((invitation) => (
                  <tr key={invitation._id}>
                    <td className="px-3 py-2">
                      <div className="flex items-center justify-center">
                        <input
                          type="checkbox"
                          checked={selectedInvitations.has(invitation._id)}
                          onChange={() => handleSelectInvitation(invitation._id)}
                          className="h-4 w-4 text-black focus:ring-black border-gray-300 rounded cursor-pointer"
                          title={`Select ${invitation.email}`}
                        />
                      </div>
                    </td>
                    
                    <td className="px-3 py-2">
                      <div className="space-y-1">
                        <div className="text-xs font-medium text-black">
                          {invitation.email}
                        </div>
                        <div className="text-xs text-gray-500 flex items-center space-x-1">
                          <Info className="w-3 h-3" />
                          <span>Profile pending</span>
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-3 py-2">
                      {getStatusBadge(invitation.status)}
                    </td>
                    
                    <td className="px-3 py-2">
                      <div className="text-xs text-black">
                        {invitation.batchId ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-black border border-gray-200">
                            {invitation.batchId.code}
                          </span>
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </div>
                    </td>
                    
                    <td className="px-3 py-2">
                      <div className="space-y-1">
                        <div className="text-xs text-black">
                          {invitation.invitedBy.name}
                        </div>
                        <div className="text-[10px] text-gray-500">
                          {invitation.invitedBy.email}
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-3 py-2">
                      <div className="text-xs text-black">
                        {invitation.passwordExpiresAt ? (
                          <div className="flex items-center space-x-1">
                            <Clock className="w-3 h-3 text-gray-500" />
                            <span className={new Date(invitation.passwordExpiresAt) < new Date() ? "text-red-600 font-medium" : ""}>
                              {new Date(invitation.passwordExpiresAt).toLocaleDateString()}
                            </span>
                            {new Date(invitation.passwordExpiresAt) < new Date() && (
                              <AlertCircle className="w-3 h-3 text-red-600" aria-label="Password expired" />
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </div>
                    </td>
                    
                    <td className="px-3 py-2 actions">
                      <div className="flex items-center space-x-2">
                        {invitation.status === "pending" && (
                          <button
                            onClick={() => handleSendSingleInvitation(invitation.email)}
                            className="bg-black hover:bg-gray-800 text-white flex items-center space-x-1 px-2 py-1.5 rounded transition-all duration-200"
                            title="Send invitation email"
                          >
                            <Send className="w-3 h-3" />
                            <span className="text-xs font-medium">Send</span>
                          </button>
                        )}
                        
                        {invitation.status === "sent" && invitation.resendCount < 3 && (
                          <button
                            onClick={() => handleResendInvitation(invitation.email)}
                            className="bg-gray-800 hover:bg-gray-900 text-white flex items-center space-x-1 px-2 py-1.5 rounded transition-all duration-200"
                            title="Resend invitation email"
                          >
                            <RefreshCw className="w-3 h-3" />
                            <span className="text-xs font-medium">Resend</span>
                          </button>
                        )}
                        
                        {["pending", "sent"].includes(invitation.status) && (
                          <button
                            onClick={() => handleCancelInvitation(invitation._id)}
                            className="bg-gray-100 hover:bg-gray-200 text-black flex items-center space-x-1 px-2 py-1.5 rounded transition-all duration-200 border border-gray-200"
                            title="Cancel invitation"
                          >
                            <X className="w-3 h-3" />
                            <span className="text-xs font-medium">Cancel</span>
                          </button>
                        )}
                        
                        {invitation.status === "cancelled" && (
                          <span className="text-xs text-gray-500 bg-gray-50 px-2 py-1.5 rounded">-</span>
                        )}
                        
                        {invitation.passwordExpiresAt && new Date(invitation.passwordExpiresAt) < new Date() && (
                          <button
                            onClick={() => handleSendSingleInvitation(invitation.email)}
                            className="bg-gray-800 hover:bg-gray-900 text-white flex items-center space-x-1 px-2 py-1.5 rounded transition-all duration-200"
                            title="Reinvite with new password"
                          >
                            <Mail className="w-3 h-3" />
                            <span className="text-xs font-medium">Reinvite</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          </div>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center">
          <SimplePagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      )}

      {/* Minimalist Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-6 border w-[450px] shadow-2xl rounded-xl bg-white">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="bg-black rounded-full p-2">
                  <Mail className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-black">Send Invitations</h3>
              </div>
              
              <div className="space-y-2">
                <label className="block text-xs font-medium text-gray-700">
                  Email Addresses
                </label>
                <textarea
                  value={inviteEmails}
                  onChange={(e) => setInviteEmails(e.target.value)}
                  placeholder="Enter emails separated by commas..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black text-xs resize-none"
                  rows={4}
                />
                <p className="text-xs text-gray-500">
                  Separate multiple emails with commas
                </p>
              </div>
              
              <div className="flex justify-end space-x-3 pt-3">
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendInvitations}
                  disabled={inviteLoading}
                  className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-all duration-200 flex items-center space-x-2 font-medium"
                >
                  {inviteLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Send Invitations</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
     </div>
   );
 }
