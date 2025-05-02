import Image from 'next/image';

export default function Header() {
  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <div className="flex items-center">
          <Image src="/centurybank-logo.svg" alt="CenturyBank" width={200} height={32} />
        </div>
        <div className="flex items-center space-x-4">
          <span>Consultant Dashboard</span>
          <div className="h-8 w-8 rounded-full bg-orange-500 flex items-center justify-center text-white">
            F
          </div>
          <span>Front Desk Consultant</span>
        </div>
      </div>
    </header>
  );
} 