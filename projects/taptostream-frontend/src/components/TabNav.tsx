export default function TabNav({
  activeTab,
  onTabChange,
}: {
  activeTab: 'viewer' | 'creator'
  onTabChange: (tab: 'viewer' | 'creator') => void
}) {
  return (
    <div className="flex gap-8 border-b border-[#2A2A2A] px-6">
      {(['viewer', 'creator'] as const).map((tab) => (
        <button
          key={tab}
          onClick={() => onTabChange(tab)}
          className={`border-b-2 px-1 py-4 text-sm capitalize transition ${
            activeTab === tab ? 'border-[#00D4AA] text-[#F0F0F0]' : 'border-transparent text-[#6B6B6B]'
          }`}
        >
          {tab}
        </button>
      ))}
    </div>
  )
}
