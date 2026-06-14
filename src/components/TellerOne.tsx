import { useState, type FormEvent } from "react";

interface TellerOneProps {
  onAuthenticated: (username: string, isInstitution: boolean, institutionType?: string) => void;
}

const TellerOne = ({ onAuthenticated }: TellerOneProps) => {
  const [username, setUsername] = useState("");
  const [vaultKey, setVaultKey] = useState("");
  const [mode, setMode] = useState<"login" | "register">("login");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onAuthenticated(username, false);
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Welcome to HIVE</h2>
      <div className="mb-4 flex gap-2">
        <button className="px-4 py-2 bg-slate-800 rounded" onClick={() => setMode("login")}>Login</button>
        <button className="px-4 py-2 bg-slate-800 rounded" onClick={() => setMode("register")}>Register</button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block">
          <span className="text-sm">Username</span>
          <input
            className="mt-1 block w-full rounded border border-slate-700 bg-slate-900 p-2"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
          />
        </label>
        {mode === "login" && (
          <label className="block">
            <span className="text-sm">Vault Key</span>
            <input
              type="password"
              className="mt-1 block w-full rounded border border-slate-700 bg-slate-900 p-2"
              value={vaultKey}
              onChange={(event) => setVaultKey(event.target.value)}
            />
          </label>
        )}
        <button type="submit" className="px-4 py-2 bg-orange-500 rounded text-black">
          {mode === "login" ? "Continue" : "Register"}
        </button>
      </form>
    </div>
  );
};

export default TellerOne;
