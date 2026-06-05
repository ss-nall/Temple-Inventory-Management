const InventoryActionForm = ({
  title,
  submitLabel,
  values,
  onChange,
  onSubmit,
  roleFieldName,
  roleFieldLabel,
  children
}) => (
  <form onSubmit={onSubmit} className="temple-card space-y-3 p-4">
    <h3 className="font-heading text-lg text-templeGold">{title}</h3>
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="text-sm">
        Sarees
        <input
          type="number"
          min="0"
          className="temple-input mt-1"
          value={values.sarees}
          onChange={(e) => onChange("sarees", e.target.value)}
        />
      </label>
      <label className="text-sm">
        Panchas
        <input
          type="number"
          min="0"
          className="temple-input mt-1"
          value={values.panchas}
          onChange={(e) => onChange("panchas", e.target.value)}
        />
      </label>
    </div>
    <label className="text-sm">
      {roleFieldLabel}
      <input
        type="text"
        className="temple-input mt-1"
        value={values[roleFieldName]}
        onChange={(e) => onChange(roleFieldName, e.target.value)}
      />
    </label>
    <label className="text-sm">
      Notes
      <textarea className="temple-input mt-1 min-h-20" value={values.notes} onChange={(e) => onChange("notes", e.target.value)} />
    </label>
    <label className="text-sm">
      Date
      <input type="date" className="temple-input mt-1" value={values.date} onChange={(e) => onChange("date", e.target.value)} />
    </label>
    {children}
    <button type="submit" className="temple-button">
      {submitLabel}
    </button>
  </form>
);

export default InventoryActionForm;

