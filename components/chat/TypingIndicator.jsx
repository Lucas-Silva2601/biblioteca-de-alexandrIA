export default function TypingIndicator() {
  return (
    <div className="flex justify-start p-4">
      <div className="flex gap-1.5 rounded-[18px] bg-surface px-5 py-3">
        {[0, 200, 400].map((delay) => (
          <span
            key={delay}
            style={{ animationDelay: `${delay}ms` }}
            className="h-2 w-2 animate-typing rounded-full bg-muted"
          />
        ))}
      </div>
    </div>
  )
}
