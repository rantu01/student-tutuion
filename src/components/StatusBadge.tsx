interface StatusBadgeProps {
  status: string;
  size?: "sm" | "md" | "lg";
  options?: Record<string, { label: string; className: string; icon?: string }>;
}

const statusConfig = {
  pending: {
    label: "Pending",
    className: "bg-yellow-100 text-yellow-800 border-yellow-200",
    icon: "⏳"
  },
  investigating: {
    label: "Investigating",
    className: "bg-blue-100 text-blue-800 border-blue-200",
    icon: "🔍"
  },
  "under-review": {
    label: "Under Review",
    className: "bg-blue-100 text-blue-800 border-blue-200",
    icon: "🔍"
  },
  approved: {
    label: "Approved",
    className: "bg-green-100 text-green-800 border-green-200",
    icon: "✅"
  },
  "in-progress": {
    label: "In Progress",
    className: "bg-purple-100 text-purple-800 border-purple-200",
    icon: "🚧"
  },
  completed: {
    label: "Completed",
    className: "bg-green-100 text-green-800 border-green-200",
    icon: "✅"
  },
  rejected: {
    label: "Rejected",
    className: "bg-red-100 text-red-800 border-red-200",
    icon: "❌"
  },
  active: {
    label: "Active",
    className: "bg-green-100 text-green-800 border-green-200",
    icon: "✅"
  },
  paused: {
    label: "Paused",
    className: "bg-orange-100 text-orange-800 border-orange-200",
    icon: "⏸️"
  },
  inactive: {
    label: "Inactive",
    className: "bg-gray-100 text-gray-800 border-gray-200",
    icon: "⏸️"
  },
  suspended: {
    label: "Suspended",
    className: "bg-red-100 text-red-800 border-red-200",
    icon: "🚫"
  },
  invited: {
    label: "Invited",
    className: "bg-blue-100 text-blue-800 border-blue-200",
    icon: "📧"
  },
  needsInvitation: {
    label: "Needs Invitation",
    className: "bg-orange-100 text-orange-800 border-orange-200",
    icon: "📤"
  },
  profileIncomplete: {
    label: "Profile Incomplete",
    className: "bg-purple-100 text-purple-800 border-purple-200",
    icon: "📝"
  },
  profileComplete: {
    label: "Profile Complete",
    className: "bg-green-100 text-green-800 border-green-200",
    icon: "✅"
  },
  removed: {
    label: "Removed",
    className: "bg-red-100 text-red-800 border-red-200",
    icon: "🗑️"
  },
  draft: {
    label: "Draft",
    className: "bg-gray-100 text-gray-800 border-gray-200",
    icon: "📝"
  },
  archived: {
    label: "Archived",
    className: "bg-red-100 text-red-800 border-red-200",
    icon: "📦"
  },
  // Feature request categories
  bug: {
    label: "Bug",
    className: "bg-red-100 text-red-800 border-red-200",
    icon: "🐛"
  },
  enhancement: {
    label: "Enhancement",
    className: "bg-blue-100 text-blue-800 border-blue-200",
    icon: "⚡"
  },
  "new-feature": {
    label: "New Feature",
    className: "bg-green-100 text-green-800 border-green-200",
    icon: "✨"
  },
  improvement: {
    label: "Improvement",
    className: "bg-purple-100 text-purple-800 border-purple-200",
    icon: "🔧"
  },
  other: {
    label: "Other",
    className: "bg-gray-100 text-gray-800 border-gray-200",
    icon: "📋"
  },
  // Priority levels
  low: {
    label: "Low",
    className: "bg-gray-100 text-gray-800 border-gray-200",
    icon: "🔽"
  },
  medium: {
    label: "Medium",
    className: "bg-yellow-100 text-yellow-800 border-yellow-200",
    icon: "➡️"
  },
  high: {
    label: "High",
    className: "bg-orange-100 text-orange-800 border-orange-200",
    icon: "🔼"
  },
  critical: {
    label: "Critical",
    className: "bg-red-100 text-red-800 border-red-200",
    icon: "🚨"
  }
};

const sizeClasses = {
  sm: "px-2 py-1 text-xs",
  md: "px-3 py-1 text-sm",
  lg: "px-4 py-2 text-base"
};

export function StatusBadge({ status, size = "md", options }: StatusBadgeProps) {
  let config;
  
  if (options && options[status]) {
    config = {
      label: options[status].label,
      className: options[status].className,
      icon: options[status].icon || "❓"
    };
  } else {
    config = statusConfig[status as keyof typeof statusConfig] || {
      label: status,
      className: "bg-gray-100 text-gray-800 border-gray-200",
      icon: "❓"
    };
  }

  return (
    <span className={`inline-flex items-center gap-1 rounded-full border font-medium ${config.className} ${sizeClasses[size]}`}>
      <span>{config.icon}</span>
      <span>{config.label}</span>
    </span>
  );
}

// Default export
export default StatusBadge; 