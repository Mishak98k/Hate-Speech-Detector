const getBadgeConfig = (label) => {
  const configs = {
    HATE_SPEECH: {
      bg: 'category-hate_speech',
      borderColor: '#EF4444',
      icon: '🔴',
      glowColor: 'rgba(239, 68, 68, 0.3)',
    },
    SECTARIAN: {
      bg: 'category-sectarian',
      borderColor: '#8B5CF6',
      icon: '🟣',
      glowColor: 'rgba(139, 92, 246, 0.3)',
    },
    RACIAL_ABUSE: {
      bg: 'category-racial_abuse',
      borderColor: '#F97316',
      icon: '🟠',
      glowColor: 'rgba(249, 115, 22, 0.3)',
    },
    RELIGIOUS_THREAT: {
      bg: 'category-religious_threat',
      borderColor: '#B91C1C',
      icon: '🟥',
      glowColor: 'rgba(185, 28, 28, 0.3)',
    },
    NEUTRAL: {
      bg: 'category-neutral',
      borderColor: '#10B981',
      icon: '🟢',
      glowColor: 'rgba(16, 185, 129, 0.3)',
    },
  }

  return configs[label] || configs.NEUTRAL
}

export const BadgeLabel = ({ label, confidence, showEmoji = true, size = 'md' }) => {
  const config = getBadgeConfig(label)
  const sizeClasses = {
    sm: 'px-2.5 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base',
  }

  return (
    <span 
      className={`inline-block rounded-full font-bold border ${config.bg} ${sizeClasses[size]} transition-all duration-300`}
      style={{
        borderColor: config.borderColor,
        boxShadow: `0 0 12px ${config.glowColor}`,
      }}
    >
      {showEmoji && `${config.icon} `}
      <span className="font-bold">{label.replace(/_/g, ' ')}</span>
    </span>
  )
}

export const getConfidenceBarColor = (label) => {
  const colors = {
    HATE_SPEECH: 'bg-[#EF4444]',
    SECTARIAN: 'bg-[#8B5CF6]',
    RACIAL_ABUSE: 'bg-[#F97316]',
    RELIGIOUS_THREAT: 'bg-[#B91C1C]',
    NEUTRAL: 'bg-[#10B981]',
  }

  return colors[label] || 'bg-[#6366F1]'
}
