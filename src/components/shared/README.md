# Compact Table System

A professional, responsive table system designed for data-heavy admin interfaces, inspired by Bootstrap's `table-sm` but built with Tailwind CSS utilities.

## 🎯 Features

- **Compact Design**: Small text, tight padding for more data density
- **Sticky Headers**: Headers stay visible during vertical scroll
- **Responsive**: Horizontal scroll on mobile devices
- **Skeleton Loading**: Professional loading states with placeholder rows
- **TypeScript Support**: Fully typed with generics
- **Flexible Actions**: Support for links, buttons, and custom actions
- **Always Full Rows**: Maintains consistent table height with skeleton rows

## 📦 Components

### 1. CSS Utility Classes (globals.css)

```css
.table-compact         /* Main table styling with small text */
.table-container       /* Professional wrapper with borders */
.table-responsive      /* Horizontal scroll wrapper */
.form-compact          /* Compact form controls for filters */
```

### 2. CompactTable Component

Reusable React component with TypeScript generics for type-safe table rendering.

## 🚀 Usage Examples

### Basic Usage

```tsx
import CompactTable, { TableColumn, TableAction } from '@/components/shared/CompactTable';
import { Eye, Edit, Trash2 } from 'lucide-react';

interface User {
  _id: string;
  name: string;
  email: string;
  status: 'active' | 'inactive';
  createdAt: string;
}

const columns: TableColumn<User>[] = [
  {
    key: 'name',
    header: 'Name',
    accessor: 'name'
  },
  {
    key: 'email',
    header: 'Email',
    accessor: 'email'
  },
  {
    key: 'status',
    header: 'Status',
    render: (user) => (
      <span className={`px-2 py-1 rounded-full text-xs ${
        user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
      }`}>
        {user.status}
      </span>
    )
  },
  {
    key: 'created',
    header: 'Created',
    accessor: (user) => new Date(user.createdAt).toLocaleDateString()
  }
];

const actions: TableAction<User>[] = [
  {
    label: 'View',
    icon: Eye,
    href: (user) => `/users/${user._id}`
  },
  {
    label: 'Edit',
    icon: Edit,
    href: (user) => `/users/${user._id}/edit`
  },
  {
    label: 'Delete',
    icon: Trash2,
    onClick: (user) => handleDelete(user._id),
    className: 'hover:text-red-600'
  }
];

function UsersTable() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  return (
    <CompactTable
      data={users}
      columns={columns}
      actions={actions}
      loading={loading}
      pageSize={10}
      emptyMessage="No users found"
    />
  );
}
```

### Using CSS Classes Directly

```tsx
function CustomTable() {
  return (
    <div className="table-container">
      <div className="table-responsive">
        <table className="table-compact">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>John Doe</td>
              <td>john@example.com</td>
              <td className="actions">
                <button className="text-gray-600 hover:text-black">
                  Edit
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

### Compact Form Controls

```tsx
function TableFilters() {
  return (
    <div className="border rounded-lg p-4 bg-white form-compact">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <input
          type="text"
          placeholder="Search..."
          className="w-full"
        />
        <select>
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <button className="border border-gray-300 text-gray-700 hover:border-black">
          Clear Filters
        </button>
        <button className="bg-blue-600 text-white hover:bg-blue-700">
          Export
        </button>
      </div>
    </div>
  );
}
```

## 🎨 Design Specifications

### Typography
- **Table**: `text-xs` (12px)
- **Cells**: `text-[11px]` (11px)  
- **Headers**: `text-[10px]` (10px)
- **Form Controls**: `text-xs` (12px)

### Spacing
- **Cell Padding**: `px-3 py-2` (12px horizontal, 8px vertical)
- **Form Padding**: `px-3 py-1.5` (12px horizontal, 6px vertical)
- **Icon Size**: `h-3.5 w-3.5` (14px)

### Colors
- **Header Background**: `bg-gray-50`
- **Border**: `border-gray-200`
- **Hover**: `hover:bg-gray-50`
- **Text**: `text-gray-900` (primary), `text-gray-500` (secondary)

## 📱 Responsive Behavior

- **Desktop**: Full table with all columns visible
- **Tablet**: Horizontal scroll for overflow columns
- **Mobile**: Horizontal scroll with sticky left column (when implemented)

## 🔧 Customization

### Custom Column Styling

```tsx
const columns: TableColumn<User>[] = [
  {
    key: 'name',
    header: 'Full Name',
    accessor: 'name',
    className: 'font-medium',
    headerClassName: 'w-1/4'
  }
];
```

### Custom Actions

```tsx
const actions: TableAction<User>[] = [
  {
    label: 'Custom Action',
    onClick: (user) => customHandler(user),
    disabled: (user) => user.status === 'inactive',
    className: 'text-purple-600 hover:text-purple-800'
  }
];
```

## 🎯 Best Practices

1. **Always use `pageSize`** to maintain consistent table height
2. **Enable `showSkeletons`** for better loading UX
3. **Use semantic column keys** for better maintainability
4. **Implement proper error states** with custom empty messages
5. **Keep actions minimal** (2-4 actions max) for better UX
6. **Use icons for actions** instead of text labels when possible

## 🔄 Migration from Existing Tables

1. Replace table wrapper with `table-container`
2. Add `table-responsive` wrapper
3. Replace table with `table-compact` class
4. Remove custom padding classes (handled by utilities)
5. Update text sizes to match the system
6. Add skeleton loading if needed

This system provides consistent, professional table styling across the entire admin interface while maintaining flexibility for custom use cases.
