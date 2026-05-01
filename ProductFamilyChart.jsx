"use client";

export default function ChartCard({ title, subtitle, children, height = 320, badge }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
          {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
        {badge && (
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 uppercase tracking-wide">
            {badge}
          </span>
        )}
      </div>
      <div style={{ height }}>{children}</div>
    </div>
  );
}
