'use client';

export default function LocationMainPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          Location Management
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          Welcome to the location management section. Here you can manage warehouse locations,
          including adding new locations, editing existing ones, and managing location details.
        </p>
        <div className="mt-6">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-3">
            Available Actions:
          </h2>
          <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-2">
            <li>Add new locations</li>
            <li>Edit existing location details</li>
            <li>View location information</li>
            <li>Delete locations</li>
          </ul>
        </div>
      </div>
    </div>
  );
}