'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Loader2, Package, AlertTriangle, CheckCircle } from 'lucide-react';
import api from '@/lib/postgrest';
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip,
} from 'recharts';

interface DashboardData {
    stock_status: {
        available: number;
        low_stock: number;
        out_of_stock: number;
    };
    total_products: number;
    category_counts: {
        [key: string]: number;
    };
    latest_products: {
        name: string;
        category: string;
        created_at: string;
        product_id: number;
    }[];
}

export default function ProductDashboard() {
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const response = await api.get('/rpc/get_product_dashboard_data');
                setData(response.data);
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!data) return null;

    const stockData = [
        { name: 'Available', value: data.stock_status.available, color: '#28A745' },
        { name: 'Low Stock', value: data.stock_status.low_stock, color: '#FFC107' },
        { name: 'Out of Stock', value: data.stock_status.out_of_stock, color: '#DC3545' },
    ];

    const categoryData = Object.entries(data.category_counts).map(([name, value]) => ({
        name,
        value,
        color: `hsl(${Math.random() * 360}, 70%, 50%)`,
    }));

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-secondary-dark dark:text-gray-200">
                Product Dashboard
            </h1>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Card className="p-6">
                    <div className="flex items-center space-x-4">
                        <Package className="h-10 w-10 text-primary" />
                        <div>
                            <p className="text-sm text-secondary dark:text-gray-400">Total Products</p>
                            <h2 className="text-3xl font-bold text-secondary-dark dark:text-gray-200">
                                {data.total_products}
                            </h2>
                        </div>
                    </div>
                </Card>

                <Card className="p-6">
                    <div className="flex items-center space-x-4">
                        <CheckCircle className="h-10 w-10 text-success" />
                        <div>
                            <p className="text-sm text-secondary dark:text-gray-400">Available</p>
                            <h2 className="text-3xl font-bold text-secondary-dark dark:text-gray-200">
                                {data.stock_status.available}
                            </h2>
                        </div>
                    </div>
                </Card>

                <Card className="p-6">
                    <div className="flex items-center space-x-4">
                        <AlertTriangle className="h-10 w-10 text-warning" />
                        <div>
                            <p className="text-sm text-secondary dark:text-gray-400">Low Stock</p>
                            <h2 className="text-3xl font-bold text-secondary-dark dark:text-gray-200">
                                {data.stock_status.low_stock}
                            </h2>
                        </div>
                    </div>
                </Card>

                <Card className="p-6">
                    <div className="flex items-center space-x-4">
                        <Package className="h-10 w-10 text-danger" />
                        <div>
                            <p className="text-sm text-secondary dark:text-gray-400">Out of Stock</p>
                            <h2 className="text-3xl font-bold text-secondary-dark dark:text-gray-200">
                                {data.stock_status.out_of_stock}
                            </h2>
                        </div>
                    </div>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4 text-secondary-dark dark:text-gray-200">
                        Stock Status
                    </h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={stockData}
                                    dataKey="value"
                                    nameKey="name"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={80}
                                >
                                    {stockData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4 text-secondary-dark dark:text-gray-200">
                        Products by Category
                    </h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={categoryData}
                                    dataKey="value"
                                    nameKey="name"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={80}
                                >
                                    {categoryData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
            </div>

            <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4 text-secondary-dark dark:text-gray-200">
                    Latest Products
                </h3>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b dark:border-gray-700">
                                <th className="text-left py-3 px-4 text-secondary dark:text-gray-400">Name</th>
                                <th className="text-left py-3 px-4 text-secondary dark:text-gray-400">Category</th>
                                <th className="text-left py-3 px-4 text-secondary dark:text-gray-400">Created At</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.latest_products.map((product) => (
                                <tr key={product.product_id} className="border-b dark:border-gray-700">
                                    <td className="py-3 px-4 text-secondary-dark dark:text-gray-200">{product.name}</td>
                                    <td className="py-3 px-4 text-secondary-dark dark:text-gray-200">{product.category}</td>
                                    <td className="py-3 px-4 text-secondary-dark dark:text-gray-200">
                                        {new Date(product.created_at).toLocaleDateString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}
