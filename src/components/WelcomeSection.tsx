import Image from 'next/image';

export default function WelcomeSection() {
  return (
    <div className="bg-white rounded-lg p-6 mb-8 flex justify-between items-center">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome <span className="text-blue-500">Front Desk</span>
        </h1>
        <p className="text-gray-600 mt-2">
          That applications allows loan requests smooth processing,
          <br />
          from Consultants to Bankers.
        </p>
        <div className="mt-4 space-x-4">
          <button className="px-4 py-2 border border-blue-500 text-blue-500 rounded-md hover:bg-blue-50">
            My Details
          </button>
          <button className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600">
            New Request
          </button>
        </div>
      </div>
      <div>
        <Image src="/loan-illustration.svg" alt="Loan Process" width={300} height={200} />
      </div>
    </div>
  );
} 