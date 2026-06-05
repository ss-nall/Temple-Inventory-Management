import { useEffect, useState } from "react";
import InventoryActionForm from "../components/InventoryActionForm";
import TransactionTable from "../components/TransactionTable";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

const initialAdd = {
  sarees: 0,
  panchas: 0,
  donorName: "",
  notes: "",
  recipientEmail: "",
  date: new Date().toISOString().slice(0, 10)
};

const initialDist = {
  sarees: 0,
  panchas: 0,
  sponsorName: "",
  notes: "",
  date: new Date().toISOString().slice(0, 10)
};

const initialReset = {
  sarees: 0,
  panchas: 0,
  reason: "",
  date: new Date().toISOString().slice(0, 10)
};

const initialClear = {
  reason: "",
  date: new Date().toISOString().slice(0, 10)
};

const toDateInput = (value) => {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 10);
};

const InventoryPage = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [inventory, setInventory] = useState({ sarees: 0, panchas: 0 });
  const [history, setHistory] = useState([]);
  const [addForm, setAddForm] = useState(initialAdd);
  const [distForm, setDistForm] = useState(initialDist);
  const [resetForm, setResetForm] = useState(initialReset);
  const [clearForm, setClearForm] = useState(initialClear);
  const [editForm, setEditForm] = useState(null);
  const [adminList, setAdminList] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadData = async () => {
    const promises = [
      api.get("/inventory"),
      api.get("/inventory/history?limit=20")
    ];
    if (isAdmin) {
      promises.push(api.get("/inventory/admins"));
    }
    try {
      const results = await Promise.all(promises);
      setInventory(results[0].data);
      setHistory(results[1].data.items);
      if (isAdmin && results[2]) {
        setAdminList(results[2].data);
      }
    } catch (err) {
      console.error("Error loading inventory data:", err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onAddChange = (key, value) => setAddForm((prev) => ({ ...prev, [key]: value }));
  const onDistChange = (key, value) => setDistForm((prev) => ({ ...prev, [key]: value }));
  const onResetChange = (key, value) => setResetForm((prev) => ({ ...prev, [key]: value }));
  const onClearChange = (key, value) => setClearForm((prev) => ({ ...prev, [key]: value }));
  const onEditChange = (key, value) => setEditForm((prev) => ({ ...prev, [key]: value }));

  const handleAdd = async (event) => {
    event.preventDefault();
    if (!addForm.recipientEmail) {
      setError("Please select an admin to notify.");
      return;
    }
    setError("");
    setMessage("");
    try {
      await api.post("/inventory/add", {
        ...addForm,
        sarees: Number(addForm.sarees),
        panchas: Number(addForm.panchas)
      });
      setMessage("Stock receipt recorded, pending confirmation.");
      setAddForm(initialAdd);
      await loadData();
    } catch (apiError) {
      setError(apiError.response?.data?.message || "Unable to add stock.");
    }
  };

  const handleDistribute = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    try {
      await api.post("/inventory/distribute", {
        ...distForm,
        sarees: Number(distForm.sarees),
        panchas: Number(distForm.panchas)
      });
      setMessage("Stock distributed successfully.");
      setDistForm(initialDist);
      await loadData();
    } catch (apiError) {
      setError(apiError.response?.data?.message || "Unable to distribute stock.");
    }
  };

  const handleReset = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    try {
      await api.post("/inventory/reset", {
        sarees: Number(resetForm.sarees),
        panchas: Number(resetForm.panchas),
        reason: resetForm.reason,
        date: resetForm.date
      });
      setMessage("Stock reset completed and logged.");
      setResetForm(initialReset);
      await loadData();
    } catch (apiError) {
      setError(apiError.response?.data?.message || "Unable to reset stock.");
    }
  };

  const handleClear = async (event) => {
    event.preventDefault();
    const confirmed = window.confirm("Clear all saree and pancha stock to zero?");
    if (!confirmed) return;
    setError("");
    setMessage("");
    try {
      await api.post("/inventory/clear", {
        reason: clearForm.reason,
        date: clearForm.date
      });
      setMessage("Inventory cleared to zero and logged.");
      setClearForm(initialClear);
      await loadData();
    } catch (apiError) {
      setError(apiError.response?.data?.message || "Unable to clear stock.");
    }
  };

  const openEdit = (item) => {
    setEditForm({
      _id: item._id,
      type: item.type,
      sarees: item.sarees,
      panchas: item.panchas,
      donorName: item.donorName || "",
      sponsorName: item.sponsorName || "",
      notes: item.notes || "",
      date: toDateInput(item.date),
      eventDate: toDateInput(item.eventDate)
    });
  };

  const cancelEdit = () => setEditForm(null);

  const handleEditSave = async (event) => {
    event.preventDefault();
    if (!editForm?._id) return;
    setError("");
    setMessage("");
    try {
      await api.put(`/inventory/history/${editForm._id}`, {
        type: editForm.type,
        sarees: Number(editForm.sarees),
        panchas: Number(editForm.panchas),
        donorName: editForm.donorName,
        sponsorName: editForm.sponsorName,
        notes: editForm.notes,
        date: editForm.date,
        eventDate: editForm.eventDate || null
      });
      setMessage("Transaction updated.");
      setEditForm(null);
      await loadData();
    } catch (apiError) {
      setError(apiError.response?.data?.message || "Unable to update transaction.");
    }
  };

  const handleDeleteLog = async (item) => {
    const confirmed = window.confirm(`Delete this ${item.type} log from ${new Date(item.date).toLocaleDateString()}?`);
    if (!confirmed) return;
    setError("");
    setMessage("");
    try {
      await api.delete(`/inventory/history/${item._id}`);
      setMessage("Transaction deleted.");
      if (editForm?._id === item._id) setEditForm(null);
      await loadData();
    } catch (apiError) {
      setError(apiError.response?.data?.message || "Unable to delete transaction.");
    }
  };

  const handleClearAllHistory = async () => {
    const userInput = window.prompt('Type "CLEAR_HISTORY" to remove all transaction logs.');
    if (userInput !== "CLEAR_HISTORY") return;
    setError("");
    setMessage("");
    try {
      await api.delete("/inventory/history/clear-all", {
        data: { confirm: "CLEAR_HISTORY" }
      });
      setMessage("All transaction history cleared.");
      setEditForm(null);
      await loadData();
    } catch (apiError) {
      setError(apiError.response?.data?.message || "Unable to clear history.");
    }
  };

  const handleConfirmStock = async (item) => {
    const confirmed = window.confirm(
      `Confirm receipt of ${item.sarees} sarees and ${item.panchas} panchas from ${item.donorName || "unknown source"}?`
    );
    if (!confirmed) return;
    setError("");
    setMessage("");
    try {
      await api.post(`/inventory/history/${item._id}/confirm`);
      setMessage("Stock receipt confirmed successfully. Notification email sent to admins.");
      await loadData();
    } catch (apiError) {
      setError(apiError.response?.data?.message || "Unable to confirm stock receipt.");
    }
  };

  return (
    <section className="space-y-5">
      <div className="temple-card grid gap-4 p-4 sm:grid-cols-2">
        <div>
          <p className="text-sm text-templeCream/70">Current Sarees</p>
          <p className="font-heading text-4xl text-templeGold">{inventory.sarees}</p>
        </div>
        <div>
          <p className="text-sm text-templeCream/70">Current Panchas</p>
          <p className="font-heading text-4xl text-templeGold">{inventory.panchas}</p>
        </div>
      </div>

      {message && <p className="rounded-lg bg-green-100 p-2 text-green-800">{message}</p>}
      {error && <p className="rounded-lg bg-red-100 p-2 text-red-800">{error}</p>}

      {isAdmin ? (
        <>
          <div className="grid gap-4 lg:grid-cols-2">
            <InventoryActionForm
              title="Add Stock"
              submitLabel="Add Stock"
              values={addForm}
              onChange={onAddChange}
              onSubmit={handleAdd}
              roleFieldName="donorName"
              roleFieldLabel="Donor/Source Name"
            >
              <label className="text-sm">
                Notify Admin (Target for confirmation email)
                <select
                  className="temple-input mt-1"
                  value={addForm.recipientEmail}
                  onChange={(e) => onAddChange("recipientEmail", e.target.value)}
                  required
                >
                  <option value="">-- Select Admin --</option>
                  {adminList.map((email) => (
                    <option key={email} value={email}>
                      {email}
                    </option>
                  ))}
                </select>
              </label>
            </InventoryActionForm>
            <InventoryActionForm
              title="Distribute Stock"
              submitLabel="Distribute Stock"
              values={distForm}
              onChange={onDistChange}
              onSubmit={handleDistribute}
              roleFieldName="sponsorName"
              roleFieldLabel="Sponsor Name"
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <form onSubmit={handleReset} className="temple-card space-y-3 p-4">
              <h3 className="font-heading text-lg text-templeGold">Reset Stock (Set Exact Values)</h3>
              <p className="text-xs text-templeCream/75">
                Use after a physical count. This action records an adjustment audit entry.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-sm">
                  Target Sarees
                  <input
                    type="number"
                    min="0"
                    className="temple-input mt-1"
                    value={resetForm.sarees}
                    onChange={(e) => onResetChange("sarees", e.target.value)}
                  />
                </label>
                <label className="text-sm">
                  Target Panchas
                  <input
                    type="number"
                    min="0"
                    className="temple-input mt-1"
                    value={resetForm.panchas}
                    onChange={(e) => onResetChange("panchas", e.target.value)}
                  />
                </label>
              </div>
              <label className="text-sm">
                Reason (required)
                <input
                  className="temple-input mt-1"
                  value={resetForm.reason}
                  onChange={(e) => onResetChange("reason", e.target.value)}
                  required
                />
              </label>
              <label className="text-sm">
                Date
                <input
                  type="date"
                  className="temple-input mt-1"
                  value={resetForm.date}
                  onChange={(e) => onResetChange("date", e.target.value)}
                />
              </label>
              <button type="submit" className="temple-button">
                Apply Reset
              </button>
            </form>

            <form onSubmit={handleClear} className="temple-card space-y-3 p-4 border border-red-300/50">
              <h3 className="font-heading text-lg text-red-300">Clear Stock (Set All to Zero)</h3>
              <p className="text-xs text-templeCream/75">Use only when required. This action is also logged in history.</p>
              <label className="text-sm">
                Reason
                <input
                  className="temple-input mt-1"
                  value={clearForm.reason}
                  onChange={(e) => onClearChange("reason", e.target.value)}
                  placeholder="Example: Annual reconciliation"
                />
              </label>
              <label className="text-sm">
                Date
                <input
                  type="date"
                  className="temple-input mt-1"
                  value={clearForm.date}
                  onChange={(e) => onClearChange("date", e.target.value)}
                />
              </label>
              <button type="submit" className="rounded-lg bg-red-500 px-4 py-2 font-semibold text-white hover:bg-red-400">
                Clear Inventory
              </button>
            </form>
          </div>
        </>
      ) : (
        <div className="rounded-xl border border-templeGold/30 bg-templeBrown/50 p-4 text-sm text-templeCream/85">
          You are logged in as a normal user. Inventory changes are restricted to admin accounts.
        </div>
      )}

      <div>
        <div className="mb-2 flex items-center justify-between gap-3">
          <h3 className="font-heading text-xl text-templeGold">Inventory History</h3>
          {isAdmin && (
            <button
              type="button"
              className="rounded-lg border border-red-300 px-3 py-2 text-sm text-red-300 hover:bg-red-300/10"
              onClick={handleClearAllHistory}
            >
              Clear All History
            </button>
          )}
        </div>
        <TransactionTable
          items={history}
          canManage={isAdmin}
          onEdit={openEdit}
          onDelete={handleDeleteLog}
          onConfirm={handleConfirmStock}
        />

        {isAdmin && editForm && (
          <form onSubmit={handleEditSave} className="temple-card mt-4 space-y-3 p-4">
            <h4 className="font-heading text-lg text-templeGold">Edit Transaction</h4>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <label className="text-sm">
                Type
                <select
                  className="temple-input mt-1"
                  value={editForm.type}
                  onChange={(e) => onEditChange("type", e.target.value)}
                >
                  <option value="ADD">ADD</option>
                  <option value="DISTRIBUTE">DISTRIBUTE</option>
                  <option value="ADJUSTMENT">ADJUSTMENT</option>
                </select>
              </label>
              <label className="text-sm">
                Sarees
                <input
                  type="number"
                  className="temple-input mt-1"
                  value={editForm.sarees}
                  onChange={(e) => onEditChange("sarees", e.target.value)}
                />
              </label>
              <label className="text-sm">
                Panchas
                <input
                  type="number"
                  className="temple-input mt-1"
                  value={editForm.panchas}
                  onChange={(e) => onEditChange("panchas", e.target.value)}
                />
              </label>
              <label className="text-sm">
                Date
                <input
                  type="date"
                  className="temple-input mt-1"
                  value={editForm.date}
                  onChange={(e) => onEditChange("date", e.target.value)}
                />
              </label>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm">
                Donor Name
                <input
                  className="temple-input mt-1"
                  value={editForm.donorName}
                  onChange={(e) => onEditChange("donorName", e.target.value)}
                />
              </label>
              <label className="text-sm">
                Sponsor Name
                <input
                  className="temple-input mt-1"
                  value={editForm.sponsorName}
                  onChange={(e) => onEditChange("sponsorName", e.target.value)}
                />
              </label>
            </div>
            <label className="text-sm">
              Event Date
              <input
                type="date"
                className="temple-input mt-1"
                value={editForm.eventDate}
                onChange={(e) => onEditChange("eventDate", e.target.value)}
              />
            </label>
            <label className="text-sm">
              Notes
              <textarea
                className="temple-input mt-1 min-h-20"
                value={editForm.notes}
                onChange={(e) => onEditChange("notes", e.target.value)}
              />
            </label>
            <div className="flex gap-2">
              <button type="submit" className="temple-button">
                Save Changes
              </button>
              <button
                type="button"
                className="rounded-lg border border-templeGold/50 px-4 py-2 text-sm"
                onClick={cancelEdit}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
};

export default InventoryPage;
