import { VaultDatabase } from "@/lib/api";

interface TellerThreeProps {
  database: VaultDatabase | null;
  onBack: () => void;
}

const TellerThree = ({ database, onBack }: TellerThreeProps) => {
  if (!database) {
    return (
      <div className="p-6">
        <h2 className="text-2xl font-bold">No Report Selected</h2>
        <p className="mt-2 text-slate-400">Please select a database from the previous screen.</p>
        <button className="mt-4 px-4 py-2 rounded bg-orange-500 text-black" onClick={onBack}>
          Back
        </button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <button className="mb-4 px-3 py-2 rounded bg-slate-800 text-white" onClick={onBack}>
        Back
      </button>
      <h2 className="text-2xl font-bold">{database.name}</h2>
      <p className="text-sm text-slate-400 mb-4">Created: {database.createdAt}</p>
      <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
        <h3 className="text-lg font-semibold mb-3">Fields</h3>
        <ul className="grid gap-2 md:grid-cols-3">
          {database.fields.map((field) => (
            <li key={field} className="rounded-lg bg-slate-900 px-3 py-2 text-sm">
              {field}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default TellerThree;
