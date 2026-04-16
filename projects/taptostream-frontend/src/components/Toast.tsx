export default function Toast({ message, type = 'info' }: { message: string; type?: 'info' | 'error' | 'success' }) {
  const border =
    type === 'error' ? 'border-[#EF4444]' : type === 'success' ? 'border-[#22C55E]' : 'border-[#2A2A2A]'
  return (
    <div className={`fixed right-4 top-4 z-[100] rounded-lg border ${border} bg-[#1A1A1A] px-4 py-3 text-sm text-[#F0F0F0]`}>
      {message}
    </div>
  )
}
