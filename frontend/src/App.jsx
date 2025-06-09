import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/layout/Layout';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Dashboard from './pages/dashboard/Dashboard';
import SKUManagement from './pages/skus/SKUManagement';
import AddEditSKU from './pages/skus/AddEditSKU';
import SKUDetails from './pages/skus/SKUDetails';
import Suppliers from './pages/suppliers/Suppliers';
import AddEditSupplier from './pages/suppliers/AddEditSupplier';
import SupplierDetail from './pages/suppliers/SupplierDetail';
import Customers from './pages/customers/Customers';
import Warehouses from './pages/warehouses/Warehouses';
import AddEditWarehouse from './pages/warehouses/AddEditWarehouse';
import WarehouseDetail from './pages/warehouses/WarehouseDetail';
import StockAdjustments from './pages/inventory/StockAdjustments';
import Transactions from './pages/transactions/Transactions';
import Reports from './pages/reports/Reports';
import AdminPanel from './pages/admin/AdminPanel';
import PurchaseDashboard from './pages/purchase/PurchaseDashboard';
import PO from './pages/purchase/PO';
import Indent from './pages/purchase/Indent';
import IndentApproval from './pages/purchase/IndentApproval';
import CreditDebitNote from './pages/purchase/CreditDebitNote';
import SalesDashboard from './pages/sales/SalesDashboard';
import SalesOrder from './pages/sales/SalesOrder';
import SalesReturn from './pages/sales/SalesReturn';
import Invoice from './pages/sales/Invoice';
import Dispatch from './pages/sales/Dispatch';
import SalesDebitNote from './pages/sales/SalesDebitNote';
import SkuVendorMapping from './pages/vendors/SkuVendorMapping';
import { AlertProvider } from './context/AlertContext';
import withPermission from './components/common/withPermission';

// Wrap components with permission checking using correct route paths
const ProtectedDashboard = withPermission(Dashboard, '/dashboard');
const ProtectedSKUManagement = withPermission(SKUManagement, '/skus');
const ProtectedStockAdjustments = withPermission(StockAdjustments, '/inventory/adjustments');
const ProtectedTransactions = withPermission(Transactions, '/transactions');
const ProtectedSkuVendorMapping = withPermission(SkuVendorMapping, '/vendors/sku-mapping');
const ProtectedPurchaseDashboard = withPermission(PurchaseDashboard, '/purchase/dashboard');
const ProtectedPO = withPermission(PO, '/purchase/orders');
const ProtectedIndent = withPermission(Indent, '/purchase/indent');
const ProtectedIndentApproval = withPermission(IndentApproval, '/purchase/indent-approval');
const ProtectedCreditDebitNote = withPermission(CreditDebitNote, '/purchase/credit-debit-note');
const ProtectedSalesDashboard = withPermission(SalesDashboard, '/sales/dashboard');
const ProtectedSalesOrder = withPermission(SalesOrder, '/sales/orders');
const ProtectedSalesReturn = withPermission(SalesReturn, '/sales/returns');
const ProtectedInvoice = withPermission(Invoice, '/sales/invoice');
const ProtectedDispatch = withPermission(Dispatch, '/sales/dispatch');
const ProtectedSalesDebitNote = withPermission(SalesDebitNote, '/sales/debit-note');
const ProtectedCustomers = withPermission(Customers, '/customers');
const ProtectedReports = withPermission(Reports, '/reports');
const ProtectedSuppliers = withPermission(Suppliers, '/suppliers');
const ProtectedWarehouses = withPermission(Warehouses, '/warehouses');
const ProtectedAdminPanel = withPermission(AdminPanel, '/admin');

function App() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '18px'
      }}>
        Loading...
      </div>
    );
  }

  return (
    <AlertProvider>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/" />} />
        <Route path="/register" element={!isAuthenticated ? <Register /> : <Navigate to="/" />} />

        {/* Protected routes */}
        <Route path="/" element={isAuthenticated ? <Layout /> : <Navigate to="/login" />}>
          <Route index element={<ProtectedDashboard />} />
          
          {/* SKU Management */}
          <Route path="skus" element={<ProtectedSKUManagement />} />
          <Route path="skus/add" element={withPermission(AddEditSKU, '/skus')({ mode: 'add' })} />
          <Route path="skus/edit/:id" element={withPermission(AddEditSKU, '/skus')({ mode: 'edit' })} />
          <Route path="skus/:id" element={withPermission(SKUDetails, '/skus')()} />
          
          {/* Suppliers */}
          <Route path="suppliers" element={<ProtectedSuppliers />} />
          <Route path="suppliers/add" element={withPermission(AddEditSupplier, '/suppliers')({ mode: 'add' })} />
          <Route path="suppliers/edit/:id" element={withPermission(AddEditSupplier, '/suppliers')({ mode: 'edit' })} />
          <Route path="suppliers/:id" element={withPermission(SupplierDetail, '/suppliers')()} />
          
          {/* Other routes */}
          <Route path="customers" element={<ProtectedCustomers />} />
          <Route path="warehouses" element={<ProtectedWarehouses />} />
          <Route path="warehouses/add" element={withPermission(AddEditWarehouse, '/warehouses')({ mode: 'add' })} />
          <Route path="warehouses/edit/:id" element={withPermission(AddEditWarehouse, '/warehouses')({ mode: 'edit' })} />
          <Route path="warehouses/:id" element={withPermission(WarehouseDetail, '/warehouses')()} />
          
          {/* Inventory */}
          <Route path="inventory/adjustments" element={<ProtectedStockAdjustments />} />
          
          {/* Transactions & Reports */}
          <Route path="transactions" element={<ProtectedTransactions />} />
          <Route path="reports" element={<ProtectedReports />} />
          
          {/* Admin */}
          <Route path="admin" element={<ProtectedAdminPanel />} />
          
          {/* Purchase Module */}
          <Route path="purchase/dashboard" element={<ProtectedPurchaseDashboard />} />
          <Route path="purchase/orders" element={<ProtectedPO />} />
          <Route path="purchase/indent" element={<ProtectedIndent />} />
          <Route path="purchase/indent-approval" element={<ProtectedIndentApproval />} />
          <Route path="purchase/credit-debit-note" element={<ProtectedCreditDebitNote />} />
          
          {/* Sales Module */}
          <Route path="sales/dashboard" element={<ProtectedSalesDashboard />} />
          <Route path="sales/orders" element={<ProtectedSalesOrder />} />
          <Route path="sales/returns" element={<ProtectedSalesReturn />} />
          <Route path="sales/invoice" element={<ProtectedInvoice />} />
          <Route path="sales/dispatch" element={<ProtectedDispatch />} />
          <Route path="sales/debit-note" element={<ProtectedSalesDebitNote />} />
          
          {/* Vendors */}
          <Route path="vendors/sku-mapping" element={<ProtectedSkuVendorMapping />} />
        </Route>
      </Routes>
    </AlertProvider>
  );
}

export default App;