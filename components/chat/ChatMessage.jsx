export default function ChatMessage({ message }) {
  const isUser = message.role === 'user'

  return (
    <div
      className={`flex animate-fade-in gap-3 rounded-xl p-4 max-sm:p-3 ${
        isUser ? 'flex-row-reverse bg-surface' : ''
      }`}
    >
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xl max-sm:h-8 max-sm:w-8 max-sm:text-lg ${
          isUser ? 'bg-wood' : 'bg-background'
        }`}
      >
        {isUser ? '👤' : '🤖'}
      </div>

      <div className="flex flex-1 flex-col gap-2">
        <div className="break-words leading-relaxed text-ink">{message.content}</div>
        <div className={`text-xs text-muted ${isUser ? 'text-right' : ''}`}>
          {new Date(message.timestamp).toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>
      </div>
    </div>
  )
}
