import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginOrganization, registerOrganization } from "../../api/safApi";

const initialRegisterState = {
  organizationName: "",
  organizationType: "",
  businessRegistrationNumber: "",
  country: "",
  officialEmail: "",
  password: "",
  confirmPassword: "",
  contactPersonName: "",
  phone: "",
  address: "",
};

const routeByOrgType = {
  supplier: "/dashboard",
  airline: "/airline/dashboard",
  trader: "/registry",
  inspector: "/inspector",
  registry: "/registry",
};

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [registerForm, setRegisterForm] = useState(initialRegisterState);
  const [registerLoading, setRegisterLoading] = useState(false);
  const [registerError, setRegisterError] = useState("");
  const [registerSuccess, setRegisterSuccess] = useState("");

  const handleLoginSubmit = async (event) => {
    event.preventDefault();
    setLoginError("");

    try {
      setLoginLoading(true);
      const response = await loginOrganization({
        officialEmail: email,
        password,
      });

      const orgType = response?.data?.organizationType;
      localStorage.setItem(
        "saf_auth",
        JSON.stringify({
          id: response?.data?.id,
          organizationType: orgType,
          officialEmail: response?.data?.officialEmail,
          status: response?.data?.status,
        })
      );
      const targetRoute = routeByOrgType[orgType] || "/dashboard";
      navigate(targetRoute, { replace: true });
    } catch (err) {
      setLoginError(err.message || "Unable to login");
    } finally {
      setLoginLoading(false);
    }
  };

  const onRegisterFieldChange = (key, value) => {
    setRegisterForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleRegisterSubmit = async (event) => {
    event.preventDefault();
    setRegisterError("");
    setRegisterSuccess("");

    try {
      setRegisterLoading(true);
      const response = await registerOrganization(registerForm);
      setRegisterSuccess(response?.message || "Registration submitted. Awaiting Registry approval.");
      setRegisterForm(initialRegisterState);
    } catch (err) {
      setRegisterError(err.message || "Registration failed");
    } finally {
      setRegisterLoading(false);
    }
  };

  const clearSession = () => {
    localStorage.removeItem("saf_auth");
    setLoginError("Session cleared. Please login again.");
  };

  return (
    <div className="min-h-screen flex bg-background-light">
      <div className="hidden lg:flex lg:w-5/12 relative flex-col justify-between p-12 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0d1b14] via-[#1f3a2c] to-primary/30" />
        <div className="relative z-10 flex flex-col h-full justify-between text-white">
          <div className="flex items-center gap-3">
            <div className="bg-primary p-2 rounded-lg">
              <span className="material-symbols-outlined text-black">eco</span>
            </div>
            <h2 className="text-2xl font-black tracking-tight">Infosys SAFc Platform</h2>
          </div>

          <div>
            <h1 className="text-4xl font-black leading-tight mb-6">
              Accelerating Sustainable Aviation Fuel Transparency
            </h1>
            <p className="text-white/80 leading-relaxed">
              Enterprise-grade blockchain registry for SAF certification, transfer, retirement and compliance reporting.
            </p>
          </div>

          <div className="flex gap-6 text-sm font-medium">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">verified</span>
              <span>Enterprise Security</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">eco</span>
              <span>Carbon Verified</span>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-7/12 flex items-center justify-center p-10 bg-white">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <h2 className="text-3xl font-black mb-2">Welcome back</h2>
            <p className="text-gray-500">Log in to access the SAFc platform.</p>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold mb-2">Corporate Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="name@company.com"
                className="w-full h-12 px-4 border rounded-lg focus:ring-2 focus:ring-primary outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="********"
                className="w-full h-12 px-4 border rounded-lg focus:ring-2 focus:ring-primary outline-none"
              />
            </div>

            {loginError && (
              <p className="text-sm text-red-600">{loginError}</p>
            )}

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full h-12 bg-primary font-bold rounded-lg hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loginLoading ? "Signing In..." : "Sign In"}
              <span className="material-symbols-outlined">arrow_forward</span>
            </button>
          </form>

          <div className="mt-6 text-center">
            <div className="flex items-center justify-center gap-4">
              <button
                type="button"
                onClick={() => {
                  setRegisterError("");
                  setRegisterSuccess("");
                  setShowRegisterModal(true);
                }}
                className="text-sm font-bold text-primary hover:underline"
              >
                Register Organization
              </button>
              <button
                type="button"
                onClick={clearSession}
                className="text-sm font-bold text-slate-600 hover:underline"
              >
                Clear Session
              </button>
            </div>
          </div>
        </div>
      </div>

      {showRegisterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[linear-gradient(rgba(16,34,24,0.45),rgba(16,34,24,0.45))] backdrop-blur-sm">
          <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-slate-200">
            <div className="px-8 pt-8 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center shadow-lg shadow-primary/20">
                  <span className="material-symbols-outlined text-background-dark font-bold">flight_takeoff</span>
                </div>
                <div>
                  <h1 className="text-2xl font-black text-slate-900 leading-tight tracking-tight">SAFc Platform</h1>
                  <p className="text-sm font-medium text-primary uppercase tracking-wider">Create Organization Account</p>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-8 py-6">
              <form onSubmit={handleRegisterSubmit} className="space-y-8">
                <section className="space-y-5">
                  <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
                    <span className="material-symbols-outlined text-slate-400 text-lg">corporate_fare</span>
                    <h2 className="text-lg font-bold text-slate-800">Organization Details</h2>
                  </div>
                  <div className="grid grid-cols-1 gap-5">
                    <Field label="Organization Name" required>
                      <input
                        required
                        value={registerForm.organizationName}
                        onChange={(e) => onRegisterFieldChange("organizationName", e.target.value)}
                        className="w-full h-12 px-4 rounded-lg border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none"
                        placeholder="e.g. Global Aviation Logistics"
                      />
                    </Field>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <Field label="Organization Type" required>
                        <select
                          required
                          value={registerForm.organizationType}
                          onChange={(e) => onRegisterFieldChange("organizationType", e.target.value)}
                          className="w-full h-12 px-4 rounded-lg border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none"
                        >
                          <option value="">Select type</option>
                          <option value="supplier">Supplier</option>
                          <option value="airline">Airline</option>
                          <option value="inspector">Inspector</option>
                          <option value="registry">Registry</option>
                        </select>
                      </Field>

                      <Field label="Business Registration Number" required>
                        <input
                          required
                          value={registerForm.businessRegistrationNumber}
                          onChange={(e) => onRegisterFieldChange("businessRegistrationNumber", e.target.value)}
                          className="w-full h-12 px-4 rounded-lg border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none"
                          placeholder="TAX-ID / REG-NUM"
                        />
                      </Field>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <Field label="Country (ISO)" required>
                        <select
                          required
                          value={registerForm.country}
                          onChange={(e) => onRegisterFieldChange("country", e.target.value)}
                          className="w-full h-12 px-4 rounded-lg border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none"
                        >
                          <option value="">Select country</option>
                          <option value="US">United States (US)</option>
                          <option value="GB">United Kingdom (GB)</option>
                          <option value="FR">France (FR)</option>
                          <option value="DE">Germany (DE)</option>
                          <option value="SG">Singapore (SG)</option>
                        </select>
                      </Field>

                      <Field label="Headquarters Address" required>
                        <input
                          required
                          value={registerForm.address}
                          onChange={(e) => onRegisterFieldChange("address", e.target.value)}
                          className="w-full h-12 px-4 rounded-lg border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none"
                          placeholder="Street name, Building, City, ZIP"
                        />
                      </Field>
                    </div>
                  </div>
                </section>

                <section className="space-y-5">
                  <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
                    <span className="material-symbols-outlined text-slate-400 text-lg">verified_user</span>
                    <h2 className="text-lg font-bold text-slate-800">Security and Access</h2>
                  </div>
                  <div className="grid grid-cols-1 gap-5">
                    <Field label="Official Business Email" required>
                      <input
                        type="email"
                        required
                        value={registerForm.officialEmail}
                        onChange={(e) => onRegisterFieldChange("officialEmail", e.target.value)}
                        className="w-full h-12 px-4 rounded-lg border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none"
                        placeholder="name@company.com"
                      />
                      <p className="text-[11px] text-slate-500 mt-1">Public email domains are not allowed.</p>
                    </Field>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <Field label="Password" required>
                        <input
                          type="password"
                          required
                          minLength={8}
                          value={registerForm.password}
                          onChange={(e) => onRegisterFieldChange("password", e.target.value)}
                          className="w-full h-12 px-4 rounded-lg border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none"
                          placeholder="********"
                        />
                      </Field>
                      <Field label="Confirm Password" required>
                        <input
                          type="password"
                          required
                          minLength={8}
                          value={registerForm.confirmPassword}
                          onChange={(e) => onRegisterFieldChange("confirmPassword", e.target.value)}
                          className="w-full h-12 px-4 rounded-lg border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none"
                          placeholder="********"
                        />
                      </Field>
                    </div>
                  </div>
                </section>

                <section className="space-y-5">
                  <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
                    <span className="material-symbols-outlined text-slate-400 text-lg">person</span>
                    <h2 className="text-lg font-bold text-slate-800">Primary Contact</h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <Field label="Contact Person Name" required>
                      <input
                        required
                        value={registerForm.contactPersonName}
                        onChange={(e) => onRegisterFieldChange("contactPersonName", e.target.value)}
                        className="w-full h-12 px-4 rounded-lg border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none"
                        placeholder="Full name"
                      />
                    </Field>
                    <Field label="Phone Number" required>
                      <input
                        required
                        inputMode="numeric"
                        pattern="[0-9]+"
                        value={registerForm.phone}
                        onChange={(e) => onRegisterFieldChange("phone", e.target.value)}
                        className="w-full h-12 px-4 rounded-lg border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none"
                        placeholder="1234567890"
                      />
                    </Field>
                  </div>
                </section>

                {registerError && <p className="text-sm text-red-600">{registerError}</p>}
                {registerSuccess && <p className="text-sm text-emerald-600">{registerSuccess}</p>}

                <div className="pb-1">
                  <button
                    type="submit"
                    disabled={registerLoading}
                    className="w-full h-12 bg-primary hover:bg-primary/90 text-background-dark font-bold rounded-lg transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {registerLoading ? "Submitting..." : "Register Organization"}
                    <span className="material-symbols-outlined">arrow_forward</span>
                  </button>
                </div>
              </form>
            </div>

            <button
              type="button"
              onClick={() => setShowRegisterModal(false)}
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, required, children }) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-semibold text-slate-700">
        {label}
        {required ? " *" : ""}
      </label>
      {children}
    </div>
  );
}
