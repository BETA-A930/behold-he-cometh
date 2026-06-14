import { VaultDatabase } from "@/lib/api";

interface TellerTwoProps {
  username?: string;
  institutionType?: string;
  onViewReports: (db: VaultDatabase) => void;
}

const TellerTwo = ({ username, institutionType, onViewReports }: TellerTwoProps) => {
  const dummyDb: VaultDatabase = {
    id: "demo-db",
    name: "Demo Vault",
    fields: ["Name", "Value"],
    records: [{ Name: "Item 1", Value: "100" }],
    isPublic: false,
    isLocked: false,
    createdAt: new Date().toLocaleDateString(),
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Hello {username || "Guest"}</h2>
      {institutionType && <p className="mb-4 text-sm text-slate-400">Institution: {institutionType}</p>}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
          <h3 className="text-lg font-semibold mb-2">Your Databases</h3>
          <p className="text-sm text-slate-400">Manage and inspect your private vaults here.</p>
          <button className="mt-4 px-4 py-2 rounded bg-orange-500 text-black" onClick={() => onViewReports(dummyDb)}>
            View Demo Report
          </button>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
          <h3 className="text-lg font-semibold mb-2">Create Vault</h3>
          <p className="text-sm text-slate-400">Add new structured vaults and protected records.</p>
          <button className="mt-4 px-4 py-2 rounded bg-slate-800 text-white">Create New Database</button>
        </div>
      </div>
    </div>
  );
};

export default TellerTwo;
