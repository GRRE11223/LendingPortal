export default function ReportSection() {
  return (
    <div className="fixed top-24 right-8 w-72 bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">My Report</h2>
      <div className="space-y-4">
        <div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">All my requests</span>
            <span className="text-2xl font-bold text-blue-500">43</span>
          </div>
        </div>
        <div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">All my accepted requests</span>
            <span className="text-2xl font-bold text-blue-500">12</span>
          </div>
        </div>
        <div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">All my requests of the year</span>
            <span className="text-2xl font-bold text-blue-500">43</span>
          </div>
        </div>
      </div>
    </div>
  );
} 