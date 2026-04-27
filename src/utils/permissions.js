
export const STAFF_PERMISSIONS = {
  fulfillment_staff: {
    'Workbench': 'FULL',
    'Inbound & Stocks': 'FULL',
    'Order Fulfillment': 'FULL',
    'Track Order': 'FULL',
    'Seller Network': 'READ_ONLY',
    'Returns Management': 'READ_ONLY',
    'Last-Mile Fleet': 'READ_ONLY',
    'Courier Management': 'NONE',
    'Hub Logistics': 'READ_ONLY',
    'Zone Logistics': 'NONE',
    'Hub Settings': 'NONE',
    'Staff Intelligence': 'NONE',
    'System Logs': 'NONE'
  },
  fulfillment_manager: {
    '*': 'FULL'
  },
  admin: {
    '*': 'FULL'
  },
  super_admin: {
    '*': 'FULL'
  }
};

export const hasAccess = (userRoles, resource) => {
  if (!userRoles || !resource) return false;
  
  // Admins have full access
  if (userRoles.includes('admin') || userRoles.includes('super_admin')) return true;
  
  // Check specifically for fulfillment_manager
  if (userRoles.includes('fulfillment_manager')) return true;

  // Check specifically for fulfillment_staff
  if (userRoles.includes('fulfillment_staff')) {
    const perm = STAFF_PERMISSIONS.fulfillment_staff[resource];
    return perm === 'FULL' || perm === 'READ_ONLY';
  }

  return false;
};

export const isReadOnly = (userRoles, resource) => {
  if (userRoles.includes('admin') || userRoles.includes('super_admin') || userRoles.includes('fulfillment_manager')) return false;
  
  if (userRoles.includes('fulfillment_staff')) {
    return STAFF_PERMISSIONS.fulfillment_staff[resource] === 'READ_ONLY';
  }
  
  return false;
};
