// Hoy — populated in Phase 8 (meal planner integration)
export default function HoyPage() {
  return (
    <div className="py-6 px-0">
      {/* Greeting */}
      <p className="text-[22px] font-semibold text-foreground px-5 pb-6" style={{ letterSpacing: '-0.3px' }}>
        Hola 👋
      </p>

      {/* Recetas de hoy */}
      <p className="text-[14px] font-semibold text-foreground px-5 pb-2">Recetas de hoy</p>
      <div className="h-px bg-border mx-5 mb-1" />
      <p className="text-[14px] text-placeholder italic px-5 py-3">No hay recetas para hoy</p>

      {/* Tu actividad */}
      <p className="text-[14px] font-semibold text-foreground px-5 pt-2 pb-2">Tu actividad</p>
      <div className="h-px bg-border mx-5 mb-3" />
      <div className="flex gap-2.5 px-5">
        <div className="flex-1 bg-subtle rounded-[12px] p-4">
          <p className="text-[24px] font-bold text-foreground leading-none">—</p>
          <p className="text-[13px] text-secondary mt-1 leading-snug">recetas cocinadas este mes</p>
        </div>
        <div className="flex-1 bg-subtle rounded-[12px] p-4">
          <p className="text-[24px] font-bold text-foreground leading-none">—</p>
          <p className="text-[13px] text-secondary mt-1 leading-snug">recetas guardadas</p>
        </div>
      </div>
      <p className="text-[11px] text-placeholder italic px-5 pt-3">Próximamente: más estadísticas</p>
    </div>
  );
}
