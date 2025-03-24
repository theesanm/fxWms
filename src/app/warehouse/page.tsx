'use client';

export default function WarehouseMainPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Warehouse Management</h1>
        <p className="text-gray-600 mb-4">
          Welcome to the warehouse management section. Here you can manage your warehouses,
          including adding new warehouses, editing existing ones, and managing warehouse details.
        </p>
        <div className="mt-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-3">Available Actions:</h2>
          <ul className="list-disc list-inside text-gray-600 space-y-2">
            <li>Add new warehouses</li>
            <li>Edit existing warehouse details</li>
            <li>View warehouse information</li>
            <li>Delete warehouses</li>
          </ul>
        </div>
      </div>
    </div>
  );
}