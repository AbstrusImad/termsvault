export default function ChartCard({ title, subtitle, right, children }) {
  return (
    <div className="panel panel-glow p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="font-grotesk text-sm font-semibold text-ivory">{title}</h3>
          {subtitle ? <p className="text-xs text-ivory/45">{subtitle}</p> : null}
        </div>
        {right}
      </div>
      {children}
    </div>
  )
}
