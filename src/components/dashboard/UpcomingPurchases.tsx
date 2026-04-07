import React from 'react';
import { Calendar, Clock, DollarSign } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const UpcomingPurchases: React.FC = () => {
  const { isDark } = useTheme();

  const upcomingPurchases = [
    {
      material: 'Steel Rods (10mm)',
      quantity: '200 pcs',
      supplier: 'MetalCorp Ltd',
      expectedDate: '2025-01-23',
      amount: '$2,400',
      status: 'confirmed'
    },
    {
      material: 'Aluminum Sheets',
      quantity: '50 kg',
      supplier: 'AlumTech Inc',
      expectedDate: '2025-01-25',
      amount: '$1,800',
      status: 'pending'
    },
    {
      material: 'Copper Wire',
      quantity: '100 m',
      supplier: 'WireTech Co',
      expectedDate: '2025-01-27',
      amount: '$950',
      status: 'urgent'
    },
    {
      material: 'Plastic Pellets',
      quantity: '75 kg',
      supplier: 'PolySupply',
      expectedDate: '2025-01-29',
      amount: '$650',
      status: 'confirmed'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'urgent':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  return (
    <div className={`p-6 rounded-xl border transition-colors duration-300 ${
      isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
    }`}>
      <div className="flex items-center space-x-3 mb-6">
        <Calendar className="h-6 w-6 text-orange-500" />
        <h2 className="text-xl font-semibold">Upcoming Purchases (Next 7 Days)</h2>
      </div>

      <div className="space-y-4">
        {upcomingPurchases.map((purchase, index) => (
          <div
            key={index}
            className={`p-4 rounded-lg border transition-all duration-200 hover:shadow-md ${
              isDark ? 'border-gray-700 hover:bg-gray-700' : 'border-gray-200 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold mb-1">{purchase.material}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {purchase.supplier}
                </p>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(purchase.status)}`}>
                {purchase.status}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-2 text-sm">
              <div className="flex items-center text-gray-600 dark:text-gray-400">
                <Clock className="h-4 w-4 mr-2" />
                <span>{new Date(purchase.expectedDate).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center text-gray-600 dark:text-gray-400">
                <DollarSign className="h-4 w-4 mr-2" />
                <span>{purchase.amount} for {purchase.quantity}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-600 dark:text-gray-400">Total for next 7 days:</span>
          <span className="font-semibold text-lg">$5,800</span>
        </div>
      </div>
    </div>
  );
};

export default UpcomingPurchases;