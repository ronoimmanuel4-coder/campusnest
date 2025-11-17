import React from 'react';
import {
  FileText, BarChart3, PieChart, TrendingUp, Download,
  Calendar, Users, Home, DollarSign, Activity
} from 'lucide-react';
import toast from 'react-hot-toast';

const AdminReports = () => {
  const reportTypes = [
    {
      title: 'User Analytics',
      description: 'User growth, demographics, and activity patterns',
      icon: Users,
      color: 'blue'
    },
    {
      title: 'Revenue Report',
      description: 'Financial performance and payment analytics',
      icon: DollarSign,
      color: 'green'
    },
    {
      title: 'Property Insights',
      description: 'Listing performance and occupancy trends',
      icon: Home,
      color: 'purple'
    },
    {
      title: 'Platform Activity',
      description: 'System usage and engagement metrics',
      icon: Activity,
      color: 'yellow'
    }
  ];

  const generateReport = (type) => {
    toast.success(`Generating ${type} report...`);
    // API call would go here
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-6">Analytics & Reports</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reportTypes.map((report, index) => {
          const Icon = report.icon;
          const colorClasses = {
            blue: 'bg-blue-100 text-blue-600',
            green: 'bg-green-100 text-green-600',
            purple: 'bg-purple-100 text-purple-600',
            yellow: 'bg-yellow-100 text-yellow-600'
          };
          
          return (
            <div key={index} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className={`${colorClasses[report.color]} rounded-full p-3 w-fit mb-4`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {report.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    {report.description}
                  </p>
                  <button
                    onClick={() => generateReport(report.title)}
                    className="btn-primary text-sm flex items-center"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Generate Report
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AdminReports;
