'use client';

export default function ProductMainPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Product Management</h1>
        <p className="text-gray-600 mb-4">
          Welcome to the product management section. Here you can manage your product catalog, 
          including adding new products, editing existing ones, and managing product images.
        </p>
        <div className="mt-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-3">Available Actions:</h2>
          <ul className="list-disc list-inside text-gray-600 space-y-2">
            <li>Add new products to your catalog</li>
            <li>Edit existing product details</li>
            <li>Manage product images</li>
            <li>Add and edit product metadata</li>
          </ul>
        </div>
      </div>
    </div>
  );
}