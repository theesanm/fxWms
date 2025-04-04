import InventoryTransactionManager from '@/components/inventory/inventory-transaction-manager';

export default function InventoryTransactionPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Inventory Transactions</h1>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <InventoryTransactionManager />
      </div>
    </div>
  );
}