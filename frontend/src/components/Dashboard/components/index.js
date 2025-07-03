import React from 'react';

// Simple placeholder components since the originals were removed
export const Active = ({ deals = [] }) => (
  <div className="p-4">
    <h3 className="text-lg font-semibold mb-4">Active Deals</h3>
    {deals.length === 0 ? (
      <p className="text-gray-500">No active deals</p>
    ) : (
      <div className="space-y-2">
        {deals.map((deal, index) => (
          <div key={index} className="p-3 border rounded bg-green-50">
            <p className="font-medium">Deal #{deal.id || index + 1}</p>
            <p className="text-sm text-gray-600">{deal.description || 'Active deal'}</p>
          </div>
        ))}
      </div>
    )}
  </div>
);

export const Pending = ({ deals = [] }) => (
  <div className="p-4">
    <h3 className="text-lg font-semibold mb-4">Pending Deals</h3>
    {deals.length === 0 ? (
      <p className="text-gray-500">No pending deals</p>
    ) : (
      <div className="space-y-2">
        {deals.map((deal, index) => (
          <div key={index} className="p-3 border rounded bg-yellow-50">
            <p className="font-medium">Deal #{deal.id || index + 1}</p>
            <p className="text-sm text-gray-600">{deal.description || 'Pending deal'}</p>
          </div>
        ))}
      </div>
    )}
  </div>
);

export const Challenged = ({ deals = [] }) => (
  <div className="p-4">
    <h3 className="text-lg font-semibold mb-4">Challenged Deals</h3>
    {deals.length === 0 ? (
      <p className="text-gray-500">No challenged deals</p>
    ) : (
      <div className="space-y-2">
        {deals.map((deal, index) => (
          <div key={index} className="p-3 border rounded bg-red-50">
            <p className="font-medium">Deal #{deal.id || index + 1}</p>
            <p className="text-sm text-gray-600">{deal.description || 'Challenged deal'}</p>
          </div>
        ))}
      </div>
    )}
  </div>
);

export default {
  Active,
  Pending,
  Challenged
};
