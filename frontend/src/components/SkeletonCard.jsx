export const SkeletonCard = () => {
  return (
    <div className="glass-morphism rounded-xl p-6 animate-pulse overflow-hidden border-l-4" style={{ borderLeftColor: '#6366F1' }}>
      <div className="skeleton h-8 w-24 mb-4 rounded-lg"></div>
      <div className="skeleton h-4 w-32 mb-3 rounded"></div>
      <div className="skeleton h-3 w-full mb-4 rounded"></div>
      <div className="skeleton h-4 w-full mb-2 rounded"></div>
      <div className="skeleton h-4 w-5/6 rounded"></div>
    </div>
  )
}
