'use client';

import { useState, useEffect } from 'react';

interface Zone {
  zone_id: number;
  warehouse_id: number;
  zone_name: string;
  description: string;
}

export default function ZoneList() {
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchZones = async () => {
      try {
        const response = await fetch('/api/zones');
        if (!response.ok) {
          throw new Error('Failed to fetch zones');
        }
        const data = await response.json();
        setZones(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchZones();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      {zones.map((zone) => (
        <div key={zone.zone_id}>
          <h2>{zone.zone_name}</h2>
          <p>Warehouse ID: {zone.warehouse_id}</p>
          <p>{zone.description}</p>
        </div>
      ))}
    </div>
  );
}