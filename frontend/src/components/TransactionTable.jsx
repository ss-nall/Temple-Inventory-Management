const TransactionTable = ({ items = [], plain = false, canManage = false, onEdit, onDelete }) => (
  <div className={`${plain ? "overflow-hidden rounded border" : "temple-card overflow-hidden"}`}>
    <div className="overflow-x-auto">
      <table className="min-w-full text-xs sm:text-sm">
        <thead className={`${plain ? "bg-[#f7efde] text-left text-[#5B1E1E]" : "bg-templeGold/20 text-left text-templeGold"}`}>
          <tr>
            <th className="px-2 py-2 sm:px-3">Date</th>
            <th className="px-2 py-2 sm:px-3">Type</th>
            <th className="px-2 py-2 sm:px-3">Sarees</th>
            <th className="px-2 py-2 sm:px-3">Panchas</th>
            <th className="px-2 py-2 sm:px-3">Sponsor/Donor</th>
            <th className="px-2 py-2 sm:px-3">Admin</th>
            <th className="px-2 py-2 sm:px-3">Notes</th>
            {canManage && <th className="px-2 py-2 sm:px-3">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item._id} className={`${plain ? "border-t border-gray-200" : "border-t border-templeGold/15"}`}>
              <td className="px-2 py-2 sm:px-3">{new Date(item.date).toLocaleDateString()}</td>
              <td className="px-2 py-2 sm:px-3">{item.type}</td>
              <td className="px-2 py-2 sm:px-3">{item.sarees}</td>
              <td className="px-2 py-2 sm:px-3">{item.panchas}</td>
              <td className="px-2 py-2 sm:px-3">{item.sponsorName || item.donorName || "-"}</td>
              <td className="px-2 py-2 sm:px-3">{item.createdBy?.username || "-"}</td>
              <td className="px-2 py-2 sm:px-3">{item.notes || "-"}</td>
              {canManage && (
                <td className="px-2 py-2 sm:px-3">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="rounded bg-templeGold px-2 py-1 text-xs font-semibold text-templeBrown"
                      onClick={() => onEdit?.(item)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="rounded bg-red-500 px-2 py-1 text-xs font-semibold text-white"
                      onClick={() => onDelete?.(item)}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              )}
            </tr>
          ))}
          {items.length === 0 && (
            <tr>
              <td colSpan={canManage ? 8 : 7} className={`px-3 py-6 text-center ${plain ? "text-gray-500" : "text-templeCream/70"}`}>
                No transactions found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </div>
);

export default TransactionTable;
