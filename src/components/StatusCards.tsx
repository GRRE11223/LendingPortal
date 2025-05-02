interface StatusCard {
  label: string;
  count: number;
  status: string;
  color: string;
}

const statusCards: StatusCard[] = [
  { label: 'All', count: 43, status: 'all', color: 'gray' },
  { label: 'In Process (Consultant)', count: 8, status: 'process-consultant', color: 'purple' },
  { label: 'Waiting for a Banker', count: 7, status: 'waiting-banker', color: 'orange' },
  { label: 'In Process (Banker)', count: 5, status: 'process-banker', color: 'yellow' },
  { label: 'Rejected', count: 6, status: 'rejected', color: 'red' },
  { label: 'Inquiried', count: 5, status: 'inquiried', color: 'blue' },
  { label: 'Accepted', count: 12, status: 'accepted', color: 'emerald' },
];

export default function StatusCards() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
      {statusCards.map((card) => (
        <div
          key={card.status}
          className={`p-4 rounded-lg ${
            card.status === 'all' ? 'bg-gray-100' : 'bg-white'
          } shadow-sm`}
        >
          <div className="flex flex-col">
            <span className="text-2xl font-bold text-gray-900">{card.count}</span>
            <span className="text-sm text-gray-600">{card.label}</span>
          </div>
        </div>
      ))}
    </div>
  );
} 